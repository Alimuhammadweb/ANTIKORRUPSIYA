import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, T, LANGS, loc } from "@/lib/i18n";
import { listArticles, findTag, slugOf } from "@/lib/queries";
import { dec } from "@/lib/slug";
import { Grid, PageHeader, Pager } from "@/components/listing";
import { SITE_URL } from "@/lib/settings";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ page?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params; if (!isLang(lang)) return {}; const g = await findTag(lang, dec(slug)); if (!g) return {};
  return { title: `#${loc(g.names, lang)} — ANTIKORRUPSIYA`, alternates: { canonical: `${SITE_URL}/${lang}/tag/${slugOf(g, lang)}`, languages: Object.fromEntries(LANGS.map((l) => [l === "uz" ? "uz-Cyrl" : l, `${SITE_URL}/${l}/tag/${slugOf(g, l)}`])) } };
}
export default async function TagPage({ params, searchParams }: P) {
  const { lang, slug } = await params; if (!isLang(lang)) notFound();
  const g = await findTag(lang, dec(slug)); if (!g) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1), r = await listArticles(lang, { tags: { some: { id: g.id } } }, { page });
  return (
    <main><PageHeader kicker={T[lang].tag} title={`#${loc(g.names, lang)}`} sub={T[lang].tagPage} />
      <div className="wrap py-10 md:py-14"><Grid items={r.items} lang={lang} empty={T[lang].empty} /><Pager lang={lang} path={`/${lang}/tag/${slugOf(g, lang)}`} params={{}} page={page} pages={r.pages} /></div></main>
  );
}
