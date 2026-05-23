import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "Não autenticado" },
      { status: 401 },
    );
  }

  if (session.user.role !== "DEVELOPER" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Acesso negado" },
      { status: 403 },
    );
  }

  const { projectId } = await params;

  const bunnyHost = process.env.BUNNY_HOST;
  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const accessKey = process.env.BUNNY_ACCESS_KEY;
  const pullZone = process.env.BUNNY_PULL_ZONE;

  if (!bunnyHost || !storageZone || !accessKey || !pullZone) {
    return NextResponse.json(
      { ok: false, error: "CDN não configurada" },
      { status: 500 },
    );
  }

  try {
    const project = await db.project.findUnique({
      where: { id: projectId, deletedAt: null },
      include: { company: true },
    });

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Projeto não encontrado" },
        { status: 404 },
      );
    }

    if (
      session.user.role === "DEVELOPER" &&
      session.user.companySlug &&
      project.company.slug !== session.user.companySlug
    ) {
      return NextResponse.json(
        { ok: false, error: "Acesso negado" },
        { status: 403 },
      );
    }

    const templatePath = join(
      process.cwd(),
      "src",
      "lib",
      "cms",
      "sync-script-template.js",
    );
    const scriptContent = readFileSync(templatePath, "utf-8");
    const body = Buffer.from(scriptContent, "utf-8");

    const version = Date.now();
    const storagePath = `scripts/${projectId}-${version}.js`;

    const uploadResponse = await fetch(
      `https://${bunnyHost}/${storageZone}/${storagePath}`,
      {
        method: "PUT",
        headers: {
          AccessKey: accessKey,
          "Content-Type": "application/javascript",
        },
        body: body as BodyInit,
      },
    );

    if (!uploadResponse.ok) {
      const detail = await uploadResponse.text().catch(() => "");
      console.error("[generate-script] CDN upload failed", uploadResponse.status, detail);
      return NextResponse.json(
        { ok: false, error: `Falha no upload CDN (${uploadResponse.status})` },
        { status: 500 },
      );
    }

    const scriptUrl = `https://${pullZone}/${storagePath}`;

    await db.project.update({
      where: { id: projectId },
      data: { cmsSyncScriptUrl: scriptUrl },
    });

    return NextResponse.json({ ok: true, url: scriptUrl });
  } catch (error) {
    console.error("[generate-script]", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao gerar script" },
      { status: 500 },
    );
  }
}
