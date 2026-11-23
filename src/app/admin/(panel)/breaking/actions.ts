"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { fromLocalInput } from "@/lib/time";

const S = z.object({ text: z.string().trim().min(1).max(240), lang: z.enum(["uz", "en", "ru"]), sortOrder: z.coerce.number().int().min(0).max(9999).default(0) });
export async function saveBreaking(f: FormData) {
  const u = await requirePerm("breaking.manage"); const id = Number(f.get("id")) || 0, back = id ? `/admin/breaking?edit=${id}` : "/admin/breaking";
  const p = S.safeParse(Object.fromEntries(f)); if (!p.success) redirect(`${back}${id ? "&" : "?"}e=invalid`);
  const startsAt = fromLocalInput(String(f.get("startsAt") ?? "")) ?? new Date(), endsAt = fromLocalInput(String(f.get("endsAt") ?? ""));
  if (endsAt && endsAt <= startsAt) redirect(`${back}${id ? "&" : "?"}e=dates`);
  const articleId = Number(f.get("articleId")) || null;
  if (articleId && !(await db.translation.findFirst({ where: { articleId, lang: p.data.lang } }))) redirect(`${back}${id ? "&" : "?"}e=article_lang`);
  const data = { ...p.data, startsAt, endsAt, articleId, active: f.get("active") === "on" };
  if (id) await db.breakingNews.update({ where: { id }, data }); else await db.breakingNews.create({ data });
  await logActivity(u.id, `breaking news ${id ? "updated" : "created"}: ${p.data.text.slice(0, 60)}`); redirect("/admin/breaking?ok=1");
}
export async function toggleBreaking(f: FormData) {
  const u = await requirePerm("breaking.manage"); const id = Number(f.get("id")), b = await db.breakingNews.findUnique({ where: { id } }); if (!b) redirect("/admin/breaking");
  await db.breakingNews.update({ where: { id }, data: { active: !b.active } }); await logActivity(u.id, `breaking news ${b.active ? "deactivated" : "activated"}`); redirect("/admin/breaking?ok=1");
}
export async function deleteBreaking(f: FormData) {
  const u = await requirePerm("breaking.manage"); await db.breakingNews.delete({ where: { id: Number(f.get("id")) } }).catch(() => {}); await logActivity(u.id, "breaking news deleted"); redirect("/admin/breaking?ok=1");
}
