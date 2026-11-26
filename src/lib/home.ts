import type { HomeKind, Prisma } from "@prisma/client";
import { db } from "./db";
import { byIds, listArticles, popular, type Item } from "./queries";
import type { L } from "./i18n";

export const DEFAULT_SECTIONS: { kind: HomeKind; count: number }[] = [
  { kind: "HERO", count: 1 }, { kind: "SECONDARY", count: 4 }, { kind: "LATEST", count: 8 }, { kind: "POPULAR", count: 5 }, { kind: "TRENDING", count: 5 },
  { kind: "INVESTIGATIONS", count: 3 }, { kind: "MEDIA", count: 4 }, { kind: "ANNOUNCEMENTS", count: 4 },
];
const FORMAT: Partial<Record<HomeKind, Prisma.ArticleWhereInput>> = {
  INVESTIGATIONS: { format: "INVESTIGATION" }, MEDIA: { format: { in: ["VIDEO", "INTERVIEW"] } }, ANNOUNCEMENTS: { format: "ANNOUNCEMENT" }, TRENDING: { trending: true },
};
export type HomeBlock = { id: number; kind: HomeKind; categoryId: number | null; category: { id: number; key: string; names: unknown; slugs: unknown } | null; items: Item[] };

async function auto(kind: HomeKind, categoryId: number | null, lang: L, count: number, exclude: number[]): Promise<Item[]> {
  const notIn: Prisma.ArticleWhereInput = exclude.length ? { id: { notIn: exclude } } : {};
  if (kind === "POPULAR") { // this week's most read first; a short list is completed from the all-time most read
    const fresh = (items: Item[], skip: number[]) => items.filter((a) => !skip.includes(a.id));
    const recent = fresh((await popular(lang, 7, 1, count + exclude.length)).items, exclude).slice(0, count);
    const ever = recent.length < count ? fresh((await popular(lang, 0, 1, count * 2 + exclude.length)).items, [...exclude, ...recent.map((a) => a.id)]) : [];
    const items = [...recent, ...ever].slice(0, count); return items.length ? items : (await popular(lang, 0, 1, count)).items;
  }
  const extra: Prisma.ArticleWhereInput = { ...(FORMAT[kind] ?? {}), ...(kind === "CATEGORY" && categoryId ? { categoryId } : {}), ...(kind === "HERO" ? { coverId: { not: null } } : {}), ...notIn };
  const sort = kind === "TRENDING" ? "trending" : "new";
  const r = await listArticles(lang, extra, { page: 1, sort, take: count });
  return r.items;
}
/** Builds the public homepage entirely from the admin configuration and the database. Nothing is hardcoded. */
export async function loadHome(lang: L): Promise<HomeBlock[]> {
  const sections = await db.homeSection.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { picks: { orderBy: { position: "asc" } }, category: { select: { id: true, key: true, names: true, slugs: true, active: true } } } });
  const used: number[] = [], out: HomeBlock[] = [];
  for (const s of sections) {
    if (s.kind === "CATEGORY" && !s.category?.active) continue;
    const count = Math.max(1, Math.min(s.count, 24));
    let items: Item[] = s.manual && s.picks.length ? (await byIds(lang, s.picks.map((p) => p.articleId))).slice(0, count) : [];
    if (!items.length) items = await auto(s.kind, s.categoryId, lang, count, s.kind === "HERO" ? [] : used);
    if (s.kind === "HERO" && !items.length) items = await auto("HERO", null, lang, count, []).catch(() => []);
    // These two are homepage columns of their own: show their newest story even if it already appears at the top of the page.
    if ((s.kind === "INVESTIGATIONS" || s.kind === "ANNOUNCEMENTS") && !items.length) items = await auto(s.kind, s.categoryId, lang, count, []);
    if (s.kind === "HERO" || s.kind === "SECONDARY") used.push(...items.map((a) => a.id));
    out.push({ id: s.id, kind: s.kind, categoryId: s.categoryId, category: s.category, items });
  }
  return out;
}
