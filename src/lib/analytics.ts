import { db } from "./db";

export type Range = { from: Date; to: Date };
export const parseRange = (from?: string, to?: string, defDays = 30): Range => {
  const day = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(+new Date(s)) ? new Date(s) : null);
  const t = day(to) ?? new Date(new Date().toISOString().slice(0, 10));
  let f = day(from) ?? new Date(+t - (defDays - 1) * 864e5);
  if (f > t) f = t;
  if (+t - +f > 365 * 864e5) f = new Date(+t - 365 * 864e5);
  return { from: f, to: t };
};
export async function viewsByDay(r: Range) {
  const rows = await db.$queryRaw<{ day: Date; views: bigint }[]>`
    SELECT d::date AS day, COALESCE(SUM(v."count"), 0) AS views FROM generate_series(${r.from}::date, ${r.to}::date, interval '1 day') d
    LEFT JOIN "ArticleView" v ON v."day" = d::date GROUP BY d ORDER BY d`;
  return rows.map((x) => ({ day: x.day.toISOString().slice(0, 10), views: Number(x.views) }));
}
export async function topArticles(r: Range, limit = 10) {
  const rows = await db.$queryRaw<{ id: number; title: string | null; views: bigint }[]>`
    SELECT a."id", (SELECT t."title" FROM "Translation" t WHERE t."articleId" = a."id" ORDER BY (t."lang" = 'uz') DESC, t."id" LIMIT 1) AS title, SUM(v."count") AS views
    FROM "ArticleView" v JOIN "Article" a ON a."id" = v."articleId" WHERE v."day" BETWEEN ${r.from}::date AND ${r.to}::date GROUP BY a."id" ORDER BY views DESC LIMIT ${limit}`;
  return rows.map((x) => ({ id: x.id, title: x.title ?? `#${x.id}`, views: Number(x.views) }));
}
export async function topCategories(r: Range) {
  const rows = await db.$queryRaw<{ key: string; names: Record<string, string>; views: bigint }[]>`
    SELECT c."key", c."names", SUM(v."count") AS views FROM "ArticleView" v JOIN "Article" a ON a."id" = v."articleId" JOIN "Category" c ON c."id" = a."categoryId"
    WHERE v."day" BETWEEN ${r.from}::date AND ${r.to}::date GROUP BY c."id" ORDER BY views DESC LIMIT 12`;
  return rows.map((x) => ({ key: x.key, names: x.names, views: Number(x.views) }));
}
export async function viewsByFormat(r: Range) {
  const rows = await db.$queryRaw<{ format: string; views: bigint }[]>`
    SELECT a."format"::text AS format, SUM(v."count") AS views FROM "ArticleView" v JOIN "Article" a ON a."id" = v."articleId"
    WHERE v."day" BETWEEN ${r.from}::date AND ${r.to}::date GROUP BY a."format" ORDER BY views DESC`;
  return rows.map((x) => ({ format: x.format, views: Number(x.views) }));
}
