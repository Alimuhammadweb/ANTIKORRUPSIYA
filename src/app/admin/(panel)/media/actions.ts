"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { removeMedia, usageOf } from "@/lib/media";

export async function updateMedia(f: FormData) {
  const u = await requirePerm("media.upload"); const id = Number(f.get("id"));
  const m = await db.media.findUnique({ where: { id } }); if (!m) redirect("/admin/media?e=not_found");
  if (!can(u, "media.editAny") && m.uploadedById !== u.id) redirect(`/admin/media/${id}?e=forbidden`);
  const s = (k: string, n: number) => String(f.get(k) ?? "").trim().slice(0, n) || null;
  await db.media.update({ where: { id }, data: { alt: s("alt", 300), caption: s("caption", 500), credit: s("credit", 200), filename: s("filename", 200) ?? m.filename } });
  await logActivity(u.id, `edited media #${id}`); revalidatePath("/admin/media"); redirect(`/admin/media/${id}?ok=1`);
}
/** Deleting is blocked while anything references the file, so no article is left with a broken image, video or document. */
export async function deleteMedia(f: FormData) {
  const u = await requirePerm("media.delete"); const id = Number(f.get("id"));
  const m = await db.media.findUnique({ where: { id } }); if (!m) redirect("/admin/media?e=not_found");
  if ((await usageOf(m)).length) redirect(`/admin/media/${id}?e=media_in_use`);
  try { await removeMedia(m); } catch { redirect(`/admin/media/${id}?e=storage`); }
  await logActivity(u.id, `deleted media ${m.filename}`); revalidatePath("/admin/media"); redirect("/admin/media?ok=deleted");
}
