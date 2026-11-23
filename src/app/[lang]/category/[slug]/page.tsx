import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang, T, LANGS, loc } from "@/lib/i18n";
import { listArticles, findCategory, slugOf } from "@/lib/queries";
import { dec } from "@/lib/slug";
import { Grid, PageHeader, Pager } from "@/components/listing";
import { SITE_URL } from "@/lib/settings";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ page?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params; if (!isLang(lang)) return {}; const c = await findCategory(lang, dec(slug)); if (!c) return {};
  return { title: `${loc(c.names, lang)} — ANTIKORRUPSIYA`, description: loc(c.descriptions, lang) || undefined,
    alternates: { canonical: `${SITE_URL}/${lang}/category/${slugOf(c, lang)}`, languages: Object.fromEntries(LANGS.map((l) => [l === "uz" ? "uz-Cyrl" : l, `${SITE_URL}/${l}/category/${slugOf(c, l)}`])) } };
}
export default async function Category({ params, searchParams }: P) {
  const { lang, slug } = await params; if (!isLang(lang)) notFound();
  const c = await findCategory(lang, dec(slug)); if (!c) notFound();
  const page = Math.max(1, Number((await searchParams).page) || 1), r = await listArticles(lang, { categoryId: c.id }, { page });
  return (
    <main><PageHeader kicker={T[lang].category} title={loc(c.names, lang)} sub={loc(c.descriptions, lang)} />
      <div className="wrap py-10 md:py-14"><Grid items={r.items} lang={lang} empty={T[lang].empty} /><Pager lang={lang} path={`/${lang}/category/${slugOf(c, lang)}`} params={{}} page={page} pages={r.pages} /></div></main>
  );
}
