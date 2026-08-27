import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/constants";

/** Serves an uploaded document only to its owner or an admin. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const doc = await db.document.findUnique({
    where: { id },
    select: { data: true, mimeType: true, fileName: true, application: { select: { userId: true } } },
  });
  if (!doc) return new Response("Not found", { status: 404 });
  if (doc.application.userId !== user.id && user.role !== ROLES.ADMIN) {
    return new Response("Forbidden", { status: 403 });
  }

  const base64 = doc.data.split(",")[1] ?? "";
  const bytes = Buffer.from(base64, "base64");

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
