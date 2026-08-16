import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { z } from "zod";
import { headers } from "next/headers";
import { authConfig } from "@/lib/auth.config";
import { resolveSessionMaxAge } from "@/lib/auth/session";
import { GOOGLE_PROVIDER_ID, isGoogleAuthConfigured } from "@/lib/auth/oauth";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  image: string | null;
  companySlug?: string;
};

const authUserSelect = {
  id: true,
  email: true,
  password: true,
  role: true,
  permissions: true,
  image: true,
  deletedAt: true,
  googleAuthEnabled: true,
  requiresPasswordReset: true,
  company: { select: { slug: true } },
} as const;

type AuthUserRecord = {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  image: string | null;
  company: { slug: string } | null;
};

const toAuthenticatedUser = (user: AuthUserRecord): AuthenticatedUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
  permissions: user.permissions ?? [],
  image: user.image,
  companySlug:
    user.role === "DEVELOPER" ? undefined : (user.company?.slug ?? undefined),
});

const findActiveUserByEmail = async (email: string) =>
  db.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
    select: authUserSelect,
  });

const getClientIp = async () => {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headersList.get("x-real-ip") || "unknown";
};

const getClientUserAgent = async () => {
  const headersList = await headers();
  return headersList.get("user-agent");
};

const isIpBlocked = async (ip: string) => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const count = await db.loginAttempt.count({
      where: {
        ip,
        success: false,
        createdAt: { gte: oneHourAgo },
      },
    });
    return count >= 3;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("does not exist") ||
      errorMessage.includes("P2021")
    ) {
      return false;
    }
    return false;
  }
};

const recordLoginAttempt = async (
  ip: string,
  email: string,
  success: boolean,
) => {
  try {
    const userAgent = await getClientUserAgent();
    await db.loginAttempt.create({
      data: { ip, email, success, userAgent },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      !errorMessage.includes("does not exist") &&
      !errorMessage.includes("P2021")
    ) {
      throw error;
    }
  }
};

const linkGoogleAccount = async (
  userId: string,
  providerAccountId: string,
  providerEmail: string,
) => {
  try {
    await db.userOAuthAccount.upsert({
      where: {
        userId_provider: { userId, provider: GOOGLE_PROVIDER_ID },
      },
      create: {
        userId,
        provider: GOOGLE_PROVIDER_ID,
        providerAccountId,
        providerEmail,
        lastLoginAt: new Date(),
      },
      update: {
        providerAccountId,
        providerEmail,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[auth] Falha ao vincular conta Google:", error);
  }
};

const googleSignIn: NonNullable<
  NonNullable<NextAuthConfig["callbacks"]>["signIn"]
> = async ({ user, account, profile }) => {
  if (account?.provider !== GOOGLE_PROVIDER_ID) return true;

  const ip = await getClientIp();
  if (await isIpBlocked(ip)) return "/login?error=ip_blocked";

  const email = user.email?.toLowerCase() ?? "";
  if (!email || profile?.email_verified !== true) {
    await recordLoginAttempt(ip, email, false);
    return "/login?error=google_unverified";
  }

  const dbUser = await findActiveUserByEmail(email);
  if (!dbUser) {
    await recordLoginAttempt(ip, email, false);
    return "/login?error=google_no_account";
  }

  if (!dbUser.googleAuthEnabled) {
    await recordLoginAttempt(ip, email, false);
    return "/login?error=google_disabled";
  }

  if (dbUser.requiresPasswordReset) {
    return "/login?error=google_reset_required";
  }

  await linkGoogleAccount(dbUser.id, account.providerAccountId, email);
  await recordLoginAttempt(ip, email, true);
  return true;
};

const baseJwt = authConfig.callbacks.jwt;

const jwt: NonNullable<NonNullable<NextAuthConfig["callbacks"]>["jwt"]> = async (
  params,
) => {
  if (params.account?.provider === GOOGLE_PROVIDER_ID && params.user?.email) {
    const dbUser = await findActiveUserByEmail(params.user.email);
    if (dbUser) {
      return baseJwt({ ...params, user: toAuthenticatedUser(dbUser) });
    }
  }
  return baseJwt(params);
};

const buildAuthConfig = async (): Promise<NextAuthConfig> => ({
  ...authConfig,
  session: { strategy: "jwt", maxAge: await resolveSessionMaxAge() },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const ip = await getClientIp();

        if (await isIpBlocked(ip)) {
          throw new Error("IP_BLOCKED");
        }

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          await recordLoginAttempt(ip, "", false);
          return null;
        }

        const user = await findActiveUserByEmail(parsed.data.email);
        if (!user) {
          await recordLoginAttempt(ip, parsed.data.email, false);
          return null;
        }

        const isValid = await compare(parsed.data.password, user.password);
        if (!isValid) {
          await recordLoginAttempt(ip, parsed.data.email, false);
          return null;
        }

        await recordLoginAttempt(ip, parsed.data.email, true);

        return toAuthenticatedUser(user);
      },
    }),
    ...(isGoogleAuthConfigured()
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
            clientSecret:
              process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn: googleSignIn,
    jwt,
  },
  trustHost: true,
});

export const { handlers, auth, signIn, signOut } = NextAuth(buildAuthConfig);
