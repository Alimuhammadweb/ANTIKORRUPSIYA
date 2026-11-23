"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { DEFAULT_SECTIONS } from "@/lib/home";

function go(q: string): never { return redirect(`/admin/homepage?${q}`); }
const sections = () => db.homeSection.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
async function renumber(ids: number[]) { await db.$transaction(ids.map((id, i) => db.homeSection.update({ where: { id }, data: { sortOrder: i } }))); }

export async function saveSection(f: FormData) {
  const u = await requirePerm("homepage.manage"); const id = Number(f.get("id"));
  const count = Math.max(1, Math.min(24, Number(f.get("count")) || 1));
  await db.homeSection.update({ where: { id }, data: { enabled: f.get("enabled") === "on", manual: f.get("manual") === "on", count } });
  await logActivity(u.id, `homepage section #${id} saved`); go("ok=1");
}
export async function moveSection(f: FormData) {
  const u = await requirePerm("homepage.manage"); const id = Number(f.get("id")), d = f.get("dir") === "up" ? -1 : 1;
  const l = (await sections()).map((x) => x.id), i = l.indexOf(id), j = i + d; if (i < 0 || j < 0 || j >= l.length) go("");
  [l[i], l[j]] = [l[j], l[i]]; await renumber(l); await logActivity(u.id, "homepage sections reordered"); go("ok=1");
}
export async function addCategorySection(f: FormData) {
  const u = await requirePerm("homepage.manage"); const categoryId = Number(f.get("categoryId"));
  if (!(await db.category.findUnique({ where: { id: categoryId } }))) go("e=not_found");
  if (await db.homeSection.findFirst({ where: { kind: "CATEGORY", categoryId } })) go("e=duplicate");
  await db.homeSection.create({ data: { kind: "CATEGORY", categoryId, count: 4, sortOrder: (await sections()).length } }); await logActivity(u.id, "homepage category section added"); go("ok=1");
}
export async function removeSection(f: FormData) {
  const u = await requirePerm("homepage.manage"); const id = Number(f.get("id"));
  const s = await db.homeSection.findUnique({ where: { id } }); if (!s || s.kind !== "CATEGORY") go("e=forbidden");
  await db.homeSection.delete({ where: { id } }); await renumber((await sections()).map((x) => x.id)); await logActivity(u.id, "homepage section removed"); go("ok=1");
}
export async function addPick(f: FormData) {
  const u = await requirePerm("homepage.manage"); const sectionId = Number(f.get("sectionId")), articleId = Number(f.get("articleId"));
  const a = await db.article.findFirst({ where: { id: articleId, status: "PUBLISHED" } }); if (!a) go("e=trending_published_only");
  if (!(await db.homePick.findUnique({ where: { sectionId_articleId: { sectionId, articleId } } }))) {
    const n = await db.homePick.count({ where: { sectionId } }); await db.homePick.create({ data: { sectionId, articleId, position: n } });
    await db.homeSection.update({ where: { id: sectionId }, data: { manual: true } }); await logActivity(u.id, "homepage pick added", articleId);
  }
  go(`ok=1&s=${sectionId}`);
}
export async function removePick(f: FormData) {
  const u = await requirePerm("homepage.manage"); const id = Number(f.get("id")); const p = await db.homePick.findUnique({ where: { id } }); if (!p) go("");
  await db.homePick.delete({ where: { id } });
  const rest = await db.homePick.findMany({ where: { sectionId: p.sectionId }, orderBy: { position: "asc" } });
  await db.$transaction(rest.map((x, i) => db.homePick.update({ where: { id: x.id }, data: { position: i } }))); await logActivity(u.id, "homepage pick removed", p.articleId); go(`ok=1&s=${p.sectionId}`);
}
export async function movePick(f: FormData) {
  await requirePerm("homepage.manage"); const id = Number(f.get("id")), d = f.get("dir") === "up" ? -1 : 1; const p = await db.homePick.findUnique({ where: { id } }); if (!p) go("");
  const l = await db.homePick.findMany({ where: { sectionId: p.sectionId }, orderBy: { position: "asc" } }), i = l.findIndex((x) => x.id === id), j = i + d; if (j < 0 || j >= l.length) go(`s=${p.sectionId}`);
  [l[i], l[j]] = [l[j], l[i]]; await db.$transaction(l.map((x, k) => db.homePick.update({ where: { id: x.id }, data: { position: k } }))); go(`ok=1&s=${p.sectionId}`);
}
/** Recreates any missing standard section (e.g. on a fresh database). */
export async function ensureDefaults() {
  await requirePerm("homepage.manage"); const have = await db.homeSection.findMany({ select: { kind: true, categoryId: true } }); let order = have.length;
  for (const s of DEFAULT_SECTIONS) if (!have.some((h) => h.kind === s.kind && !h.categoryId)) await db.homeSection.create({ data: { kind: s.kind, count: s.count, sortOrder: order++ } });
  go("ok=1");
}
