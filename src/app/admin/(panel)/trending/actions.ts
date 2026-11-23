"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const safeBack = (b: FormDataEntryValue | null) => { const s = String(b ?? ""); return s.startsWith("/admin") ? s : "/admin/trending"; };
const ordered = () => db.article.findMany({ where: { trending: true }, orderBy: [{ trendingOrder: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }], select: { id: true } });
async function renumber(list: number[]) { await db.$transaction(list.map((id, i) => db.article.update({ where: { id }, data: { trendingOrder: i + 1 } }))); }

/** Only editors choose Trending. Nothing is ever marked automatically, and only published articles qualify. */
export async function addTrending(f: FormData) {
  const u = await requirePerm("trending.manage"); const id = Number(f.get("articleId")), back = safeBack(f.get("back"));
  const a = await db.article.findUnique({ where: { id } });
  if (!a || a.status !== "PUBLISHED") redirect(`${back}${back.includes("?") ? "&" : "?"}e=trending_published_only`);
  if (!a.trending) { const list = (await ordered()).map((x) => x.id); await renumber([...list, id]); await db.article.update({ where: { id }, data: { trending: true } }); await logActivity(u.id, "added to Trending", id); }
  revalidatePath("/admin/trending"); redirect(`${back}${back.includes("?") ? "&" : "?"}ok=1`);
}
export async function removeTrending(f: FormData) {
  const u = await requirePerm("trending.manage"); const id = Number(f.get("articleId")), back = safeBack(f.get("back"));
  await db.article.update({ where: { id }, data: { trending: false, trendingOrder: null } });
  await renumber((await ordered()).map((x) => x.id)); await logActivity(u.id, "removed from Trending", id);
  revalidatePath("/admin/trending"); redirect(`${back}${back.includes("?") ? "&" : "?"}ok=1`);
}
export async function moveTrending(f: FormData) {
  const u = await requirePerm("trending.manage"); const id = Number(f.get("articleId")), d = f.get("dir") === "up" ? -1 : 1;
  const list = (await ordered()).map((x) => x.id), i = list.indexOf(id), j = i + d;
  if (i < 0 || j < 0 || j >= list.length) redirect("/admin/trending");
  [list[i], list[j]] = [list[j], list[i]]; await renumber(list); await logActivity(u.id, `Trending order: moved ${d < 0 ? "up" : "down"}`, id);
  revalidatePath("/admin/trending"); redirect("/admin/trending?ok=1");
}
