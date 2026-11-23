import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { visible, notExpired } from "@/lib/visible";
import { LANGS } from "@/lib/i18n";
import { slugOf } from "@/lib/queries";
import { SITE_URL } from "@/lib/settings";

export const dynamic = "force-dynamic";
const hl = (l: string) => (l === "uz" ? "uz-Cyrl" : l);
// Only public, published articles (and active categories) are listed, with hreflang alternates between translations.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rows, cats] = await Promise.all([
    db.translation.findMany({ where: { article: { AND: [visible(), { OR: [{ format: { not: "ANNOUNCEMENT" } }, notExpired()] }] } }, select: { articleId: true, lang: true, slug: true, article: { select: { updatedAt: true } } } }),
    db.category.findMany({ where: { active: true } }),
  ]);
  const byArticle = new Map<number, typeof rows>(); rows.forEach((r) => byArticle.set(r.articleId, [...(byArticle.get(r.articleId) ?? []), r]));
  const sections = ["", "/latest", "/popular", "/trending", "/investigations", "/videos", "/interviews", "/announcements", "/categories"];
  const fixed = LANGS.flatMap((l) => sections.map((p) => ({ url: `${SITE_URL}/${l}${p}`, alternates: { languages: Object.fromEntries(LANGS.map((x) => [hl(x), `${SITE_URL}/${x}${p}`])) } })));
  const catUrls = LANGS.flatMap((l) => cats.map((c) => ({ url: `${SITE_URL}/${l}/category/${slugOf(c, l)}`, alternates: { languages: Object.fromEntries(LANGS.map((x) => [hl(x), `${SITE_URL}/${x}/category/${slugOf(c, x)}`])) } })));
  const arts = rows.map((r) => ({ url: `${SITE_URL}/${r.lang}/article/${r.slug}`, lastModified: r.article.updatedAt, alternates: { languages: Object.fromEntries((byArticle.get(r.articleId) ?? []).map((x) => [hl(x.lang), `${SITE_URL}/${x.lang}/article/${x.slug}`])) } }));
  return [...fixed, ...catUrls, ...arts];
}
