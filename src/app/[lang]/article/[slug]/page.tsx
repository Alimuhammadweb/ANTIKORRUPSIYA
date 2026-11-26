import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { isVisible } from "@/lib/visible";
import { inc, base, localize } from "@/lib/queries";
import { dec } from "@/lib/slug";
import { SITE_URL } from "@/lib/settings";
import { plainText } from "@/lib/blocks";
import { ArticleView, type FullArticle } from "@/components/article-view";
import { ViewPing } from "@/components/article-extras";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; slug: string }> };
const withArticle = { article: { include: { cover: true, category: true, tags: true, author: { select: { name: true } }, images: { include: { media: true } }, translations: { select: { lang: true, slug: true, article: { select: { status: true, publishedAt: true } } } } } } } as const;
/** The translation with this slug in the visitor's language; otherwise the same slug in the article's original language (articles are written once, normally in Uzbek). */
const load = async (lang: "uz" | "en" | "ru", slug: string) => (await db.translation.findUnique({ where: { lang_slug: { lang, slug } }, include: withArticle })) ?? db.translation.findFirst({ where: { slug }, orderBy: { lang: "asc" }, include: withArticle });

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params; if (!isLang(lang)) return {};
  const tr = await load(lang, dec(slug)); if (!tr || !isVisible(tr.article)) return {};
  const title = tr.seoTitle || tr.title, description = tr.seoDescription || tr.description || plainText(tr.blocks).slice(0, 160), a = tr.article, img = a.cover ? (a.cover.path.startsWith("http") ? a.cover.path : `${SITE_URL}${a.cover.path}`) : undefined;
  const alts = a.translations.filter((x) => isVisible(x.article));
  return { title, description, robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_URL}/${tr.lang}/article/${tr.slug}`, languages: { ...Object.fromEntries(alts.map((x) => [x.lang === "uz" ? "uz-Cyrl" : x.lang, `${SITE_URL}/${x.lang}/article/${x.slug}`])), ...(alts.find((x) => x.lang === "uz") ? { "x-default": `${SITE_URL}/uz/article/${alts.find((x) => x.lang === "uz")!.slug}` } : {}) } },
    openGraph: { type: "article", title, description, url: `${SITE_URL}/${tr.lang}/article/${tr.slug}`, locale: tr.lang === "uz" ? "uz_UZ" : tr.lang === "ru" ? "ru_RU" : "en_GB", publishedTime: a.publishedAt?.toISOString(), modifiedTime: a.updatedAt.toISOString(), images: img ? [img] : [] },
    twitter: { card: img ? "summary_large_image" : "summary", title, description, images: img ? [img] : [] } };
}
export default async function ArticlePage({ params }: P) {
  const { lang, slug: raw } = await params; if (!isLang(lang)) notFound();
  const slug = dec(raw), tr = await load(lang, slug); if (!tr || !isVisible(tr.article)) notFound();
  if (tr.lang !== lang) { const mine = tr.article.translations.find((x) => x.lang === lang && isVisible(x.article)); if (mine) redirect(`/${lang}/article/${mine.slug}`); } // a real translation exists: use it
  const a = tr.article as unknown as FullArticle;
  const a2 = { ...a, translations: tr.article.translations.filter((x) => isVisible(x.article)) } as FullArticle;
  const rel = await db.article.findMany({ where: base(lang, { id: { not: a.id }, OR: [...(a.categoryId ? [{ categoryId: a.categoryId }] : []), ...(a.tags.length ? [{ tags: { some: { id: { in: a.tags.map((x) => x.id) } } } }] : [])] }), orderBy: { publishedAt: "desc" }, take: 3, include: inc(lang) }).then((r) => localize(r, lang));
  const popularTags = await db.tag.findMany({ where: { articles: { some: base(lang) } }, orderBy: { articles: { _count: "desc" } }, take: 12 });
  const url = `${SITE_URL}/${lang}/article/${tr.slug}`, img = a.cover ? (a.cover.path.startsWith("http") ? a.cover.path : `${SITE_URL}${a.cover.path}`) : undefined;
  const ld = { "@context": "https://schema.org", "@type": "NewsArticle", headline: tr.title.slice(0, 110), description: tr.description || undefined, inLanguage: tr.lang === "uz" ? "uz-Cyrl" : tr.lang, mainEntityOfPage: url, datePublished: a.publishedAt?.toISOString(), dateModified: a.updatedAt.toISOString(),
    image: img ? [img] : undefined, author: [{ "@type": "Organization", name: "ANTIKORRUPSIYA" }], publisher: { "@type": "Organization", name: "ANTIKORRUPSIYA", logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo.png` } } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <ViewPing id={a.id} />
      <ArticleView a={a2} tr={tr} lang={lang} related={rel} url={url} popularTags={popularTags} />
    </>
  );
}
