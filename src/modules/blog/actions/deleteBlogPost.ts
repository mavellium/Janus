"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { revalidateSites } from "@/lib/revalidateSites";
import { logAudit } from "@/lib/audit-logger";

export async function deleteBlogPost(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Não autenticado" };

  try {
    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        project: { include: { company: { select: { slug: true } } } },
      },
    });

    await db.blogPost.delete({ where: { id } });
    revalidatePath("/", "layout");

    if (post) {
      await logAudit({
        userId: session.user.id,
        action: "DELETE",
        entity: "BlogPost",
        entityId: id,
        entityLabel: post.title,
        projectId: post.projectId,
        oldData: { ...post, project: undefined },
      });
    }

    if (post?.project?.company?.slug) {
      revalidateSites(post.project.company.slug);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao excluir artigo" };
  }
}
