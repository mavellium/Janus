import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { assertPublicUrl } from "@/lib/ssrf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const project = await db.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { previewUrl: true, cmsSyncScriptUrl: true, company: { select: { slug: true } } },
    });

    if (!project) {
      return NextResponse.json({ ok: false, error: "Projeto não encontrado" }, { status: 404 });
    }

    if (
      session.user.companySlug &&
      project.company.slug !== session.user.companySlug &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ ok: false, error: "Acesso negado" }, { status: 403 });
    }

    if (!project.previewUrl || !project.cmsSyncScriptUrl) {
      return NextResponse.json({ ok: true, active: false });
    }

    try {
      const safeUrl = await assertPublicUrl(project.previewUrl);
      const res = await fetch(safeUrl, {
        headers: { "User-Agent": "Janus-CMS-Checker/1.0", "Cache-Control": "no-cache" },
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return NextResponse.json({ ok: true, active: false });

      const html = await res.text();
      const scriptFileName = `${projectId}-sync.js`;
      const active = html.includes(scriptFileName);

      return NextResponse.json({ ok: true, active });
    } catch {
      return NextResponse.json({ ok: true, active: false });
    }
  } catch (error) {
    console.error("[check-script]", error);
    return NextResponse.json({ ok: false, error: "Erro ao verificar script" }, { status: 500 });
  }
}
