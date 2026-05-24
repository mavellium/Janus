import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { SelectCompanyClient } from "./SelectCompanyClient";

export const metadata = { title: "Selecionar empresa — Janus" };

export default async function SelectCompanyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: {
      name: true,
      email: true,
      companyId: true,
      companies: {
        where: { company: { deletedAt: null } },
        include: { company: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) redirect("/login");

  const companies = user.companies.map((uc) => uc.company);

  if (companies.length === 0) redirect("/no-company");
  if (companies.length === 1) redirect(`/${companies[0].slug}/dashboard`);

  return (
    <SelectCompanyClient
      userName={user.name}
      companies={companies}
      primaryCompanyId={user.companyId}
    />
  );
}
