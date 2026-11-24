"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { slugify } from "@/lib/slug";
import { readUz, buildUzSlugs, slugClash } from "@/lib/taxonomy";

const go = (q: string): never => redirect(`/admin/categories?${q}`);
export async function saveCategory(f: FormData) {
  const u = await requirePerm("taxonomy.manage"); const id = Number(f.get("id")) || 0, back = id ? `edit=${id}&` : "new=1&";
  const prev = id ? await db.category.findUnique({ where: { id } }) : null; if (id && !prev) go("e=not_found");
  const names = readUz(f, "name", prev?.names), descriptions = readUz(f, "desc", prev?.descriptions, 600);
  if (!names.uz) go(`${back}e=names_required`);
  const slugs = buildUzSlugs(names.uz, String(f.get("slug_uz") ?? "").trim().slice(0, 100), prev?.slugs); if (!slugs) go(`${back}e=invalid`);
  const others = await db.category.findMany({ where: id ? { NOT: { id } } : {}, select: { key: true, slugs: true } });
  if (slugClash(slugs!, others)) go(`${back}e=slug_taken`);
  const order = Math.max(0, Math.min(9999, Number(f.get("order")) || 0)), active = f.get("active") === "on";
  if (id) { await db.category.update({ where: { id }, data: { names, slugs: slugs!, descriptions, order, active } }); }
  else {
    const key = slugify(String(f.get("key") || names.uz)); if (!key) go(`${back}e=invalid`);
    if (await db.category.findUnique({ where: { key } })) go(`${back}e=slug_taken`);
    await db.category.create({ data: { key, names, slugs: slugs!, descriptions, order, active } });
  }
  await logActivity(u.id, `category ${id ? "updated" : "created"}: ${names.uz}`); go("ok=1");
}
/** Refuses while articles use the category, so no article is left pointing at nothing. Deactivate instead. */
export async function deleteCategory(f: FormData) {
  const u = await requirePerm("taxonomy.manage"); const id = Number(f.get("id"));
  if (await db.article.count({ where: { categoryId: id } })) go("e=category_in_use");
  await db.category.delete({ where: { id } }).catch(() => go("e=not_found")); await logActivity(u.id, `category #${id} deleted`); go("ok=deleted");
}
