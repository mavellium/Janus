import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { ThemeProvider } from "@/components/ThemeContext";
import { ImpersonationBanner } from "@/components/dashboard/ImpersonationBanner";
import type { UserPreferences } from "@/types/next-auth";
import {
  isPrivilegedRole,
  getImpersonatedUserId,
  getImpersonatedUserName,
  getImpersonationReturnUrl,
} from "@/lib/auth/permissions";
import { getCompanyUsers } from "@/modules/auth/queries/getCompanyUsers";
import { getUserCompanies } from "@/modules/users/queries/getUserCompanies";
import {
  getCurrentVersion,
  countUnreadReleases,
} from "@/modules/notifications/queries/getReleases";
import { CompanySwitcher } from "@/components/dashboard/CompanySwitcher";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  });

  if (!company) redirect("/login");

  const role = session.user.role;
  const isPrivileged = isPrivilegedRole(role);

  if (!isPrivileged) {
    const hasAccess =
      session.user.companySlug === companySlug ||
      !!(await db.userCompany.findUnique({
        where: {
          userId_companyId: { userId: session.user.id, companyId: company.id },
        },
      }));
    if (!hasAccess) redirect("/login");
  }

  const impersonatedUserId = await getImpersonatedUserId();
  const impersonatedUserName = await getImpersonatedUserName();
  const returnUrl = await getImpersonationReturnUrl();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, preferences: true },
  });

  const prefs = (user?.preferences ?? {}) as UserPreferences;

  let impersonatedUserEmail: string | null = null;
  let impersonatedUserNameForSidebar: string | null = null;
  let impersonatedUserPermissions:
    | string
    | string[]
    | Record<string, Record<string, string[]>>
    | undefined;
  let impersonatedUserImage: string | null = null;
  let impersonatedPreferences: UserPreferences = {};
  if (impersonatedUserId) {
    const target = await db.user.findUnique({
      where: { id: impersonatedUserId, deletedAt: null },
      select: {
        email: true,
        name: true,
        permissions: true,
        image: true,
        preferences: true,
      },
    });
    impersonatedUserEmail = target?.email ?? null;
    impersonatedUserNameForSidebar = target?.name ?? null;
    impersonatedUserPermissions = target?.permissions;
    impersonatedUserImage = target?.image ?? null;
    impersonatedPreferences = (target?.preferences ?? {}) as UserPreferences;
  }

  const realUserName = session.user.name ?? null;

  let companyUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
  }> = [];
  let allCompanies: Array<{ id: string; name: string; slug: string }> = [];
  if (isPrivileged) {
    companyUsers = await getCompanyUsers(company.id);
    allCompanies = await db.company.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
  }

  const effectiveUserId = impersonatedUserId ?? session.user.id;
  const userCompanies = !isPrivileged
    ? await getUserCompanies(effectiveUserId)
    : [];

  const adminReturnPath =
    role === "ADMIN" ? "/dashboard-admin" : `/dev/${session.user.id}/dashboard`;

  const currentVersion = await getCurrentVersion();
  const unreadNotifications = await countUnreadReleases(session.user.id);

  const onboardingPrefs = impersonatedUserId ? impersonatedPreferences : prefs;
  const showOnboarding = onboardingPrefs.onboarding?.status === "pending";

  return (
    <ThemeProvider
      darkMode={prefs.darkMode}
      userImage={
        impersonatedUserId ? impersonatedUserImage : (user?.image ?? null)
      }
    >
      <div className="h-screen flex bg-brand-bg">
        <Sidebar
          email={
            impersonatedUserId && impersonatedUserEmail
              ? impersonatedUserEmail
              : (session.user.email ?? "")
          }
          name={
            impersonatedUserId && impersonatedUserNameForSidebar
              ? impersonatedUserNameForSidebar
              : realUserName
          }
          image={
            impersonatedUserId ? impersonatedUserImage : (user?.image ?? null)
          }
          initialCollapsed={prefs.sidebar_collapsed ?? false}
          companyName={company.name}
          currentVersion={currentVersion}
          unreadNotifications={unreadNotifications}
        />
        <MobileNav logoHref={`/${companySlug}/dashboard`}>
          <Sidebar
            email={
              impersonatedUserId && impersonatedUserEmail
                ? impersonatedUserEmail
                : (session.user.email ?? "")
            }
            name={
              impersonatedUserId && impersonatedUserNameForSidebar
                ? impersonatedUserNameForSidebar
                : realUserName
            }
            image={
              impersonatedUserId ? impersonatedUserImage : (user?.image ?? null)
            }
            initialCollapsed={false}
            companyName={company.name}
            currentVersion={currentVersion}
            unreadNotifications={unreadNotifications}
            embedded
          />
        </MobileNav>
        <main className="flex-1 flex flex-col min-h-0 pt-14 md:pt-0 md:ml-[var(--sidebar-width,220px)] overflow-x-hidden">
          {isPrivileged && (
            <ImpersonationBanner
              companySlug={companySlug}
              companyId={company.id}
              companyName={company.name}
              impersonatedUserName={impersonatedUserName}
              isImpersonating={!!impersonatedUserId}
              companyUsers={companyUsers}
              allCompanies={allCompanies}
              realUserRole={role as "ADMIN" | "DEVELOPER"}
              impersonatedUserId={impersonatedUserId}
              impersonatedUserEmail={impersonatedUserEmail}
              impersonatedUserPermissions={impersonatedUserPermissions}
              returnUrl={returnUrl}
              adminReturnPath={adminReturnPath}
            />
          )}
          {userCompanies.length > 1 && (
            <div className="flex justify-end px-4 pt-3">
              <CompanySwitcher
                companies={userCompanies}
                currentSlug={companySlug}
              />
            </div>
          )}
          <div className="flex-1 min-h-0">{children}</div>
        </main>
        {showOnboarding && (
          <OnboardingTour
            companySlug={companySlug}
            initialStep={onboardingPrefs.onboarding?.step ?? 0}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
