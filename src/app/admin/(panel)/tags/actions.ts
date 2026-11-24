"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { slugify } from "@/lib/slug";
import { readUz, buildUzSlugs, slugClash } from "@/lib/taxonomy";

const go = (q: string): never => redirect(`/admin/tags?${q}`);
export async function saveTag(f: FormData) {
  const u = await requirePerm("taxonomy.manage"); const id = Number(f.get("id")) || 0, back = id ? `edit=${id}&` : "";
  const prev = id ? await db.tag.findUnique({ where: { id } }) : null; if (id && !prev) go("e=not_found");
  const names = readUz(f, "name", prev?.names, 80);
  if (!names.uz) go(`${back}e=names_required`);
  const slugs = buildUzSlugs(names.uz, String(f.get("slug_uz") ?? "").trim().slice(0, 100), prev?.slugs); if (!slugs) go(`${back}e=invalid`);
  const others = await db.tag.findMany({ where: id ? { NOT: { id } } : {}, select: { key: true, slugs: true } });
  if (slugClash(slugs!, others)) go(`${back}e=slug_taken`);
  if (id) await db.tag.update({ where: { id }, data: { names, slugs: slugs! } });
  else { const key = slugify(names.uz); if (!key || (await db.tag.findUnique({ where: { key } }))) go("e=slug_taken"); await db.tag.create({ data: { key, names, slugs: slugs! } }); }
  await logActivity(u.id, `tag ${id ? "updated" : "created"}: ${names.uz}`); go("ok=1");
}
/** Removes the tag and its links to articles; the articles themselves are untouched. */
export async function deleteTag(f: FormData) {
  const u = await requirePerm("taxonomy.manage"); const id = Number(f.get("id"));
  await db.tag.delete({ where: { id } }).catch(() => go("e=not_found")); await logActivity(u.id, `tag #${id} deleted`); go("ok=deleted");
}
