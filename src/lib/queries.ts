import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { visible, notExpired } from "./visible";
import type { L } from "./i18n";

export const PAGE = 12;
// Articles are written once (normally in Uzbek). A visitor browsing in another interface language sees the article in its original language
// unless a real translation exists; nothing is ever machine-translated or faked.
export const inc = (_lang: L) => ({ cover: true, category: true, tags: true, translations: true }) satisfies Prisma.ArticleInclude;
/** The one translation to show: the visitor's language if it exists, otherwise Uzbek, otherwise whatever the article has. */
export const pickTr = <T extends { lang: string }>(trs: T[], lang: L): T[] => { const best = trs.find((x) => x.lang === lang) ?? trs.find((x) => x.lang === "uz") ?? trs[0]; return best ? [best] : []; };
export const localize = <A extends { translations: { lang: string }[] }>(items: A[], lang: L): A[] => items.map((a) => ({ ...a, translations: pickTr(a.translations, lang) }));
/** Public (published, not expired) articles in any language. Announcements past their expiry date are hidden. */
export const base = (_lang: L, extra: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput => ({
  AND: [visible(), { translations: { some: {} } }, { OR: [{ format: { not: "ANNOUNCEMENT" } }, notExpired()] }, extra],
});
export type Item = Prisma.ArticleGetPayload<{ include: ReturnType<typeof inc> }>;
type Sort = "new" | "views" | "trending";
const order = (s?: Sort): Prisma.ArticleOrderByWithRelationInput[] =>
  s === "views" ? [{ views: "desc" }, { publishedAt: "desc" }] : s === "trending" ? [{ trendingOrder: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }] : [{ publishedAt: "desc" }];

export async function listArticles(lang: L, extra: Prisma.ArticleWhereInput, o: { page: number; sort?: Sort; take?: number }) {
  const where = base(lang, extra), take = o.take ?? PAGE;
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: order(o.sort), skip: (o.page - 1) * take, take, include: inc(lang) }),
    db.article.count({ where }),
  ]);
  return { items: localize(items, lang), total, pages: Math.max(1, Math.ceil(total / take)) };
}
/** Popular within a period, from the real daily view counters. days = 0 means all time (lifetime counter). */
export async function popular(lang: L, days: number, page: number, take = PAGE) {
  if (!days) return listArticles(lang, {}, { page, sort: "views", take });
  const since = new Date(new Date().toISOString().slice(0, 10)); since.setUTCDate(since.getUTCDate() - (days - 1));
  const g = await db.articleView.groupBy({ by: ["articleId"], where: { day: { gte: since } }, _sum: { count: true }, orderBy: { _sum: { count: "desc" } }, take: 200 });
  const ids = g.map((x) => x.articleId);
  const rows = await db.article.findMany({ where: base(lang, { id: { in: ids } }), include: inc(lang) });
  const sorted = localize(ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is Item => !!r), lang);
  return { items: sorted.slice((page - 1) * take, page * take), total: sorted.length, pages: Math.max(1, Math.ceil(sorted.length / take)) };
}
/** Items by id in the given order, only those still public in this language (deleted / unpublished picks disappear safely). */
export async function byIds(lang: L, ids: number[]): Promise<Item[]> {
  if (!ids.length) return [];
  const rows = await db.article.findMany({ where: base(lang, { id: { in: ids } }), include: inc(lang) });
  return localize(ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is Item => !!r), lang);
}
// ---- localized slugs for categories and tags ----
type Named = { key: string; slugs: unknown };
export const slugOf = (x: Named, lang: L) => { const s = (x.slugs as Record<string, string> | null)?.[lang]; return s || x.key; };
export const findCategory = (lang: L, slug: string) => db.category.findFirst({ where: { active: true, OR: [{ slugs: { path: [lang], equals: slug } }, { key: slug }] } });
export const findTag = (lang: L, slug: string) => db.tag.findFirst({ where: { OR: [{ slugs: { path: [lang], equals: slug } }, { key: slug }] } });
