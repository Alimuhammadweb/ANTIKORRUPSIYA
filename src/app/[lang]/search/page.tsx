import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLang, T, loc } from "@/lib/i18n";
import { listArticles } from "@/lib/queries";
import { Search as SearchIcon } from "lucide-react";
import { Grid, PageHeader, Pager } from "@/components/listing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: true } };
export default async function Search({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string; cat?: string; sort?: string; page?: string }> }) {
  const { lang } = await params; if (!isLang(lang)) notFound();
  const sp = await searchParams, t = T[lang], q = (sp.q ?? "").trim().slice(0, 100), page = Math.max(1, Number(sp.page) || 1);
  const cats = await db.category.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  let r: Awaited<ReturnType<typeof listArticles>> | null = null;
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`; // visible text only: title, summary, body text nodes, category name, tag name, in any language the article has
    const rows = await db.$queryRaw<{ articleId: number }[]>`
      SELECT DISTINCT t."articleId" FROM "Translation" t WHERE (
        t."title" ILIKE ${like} OR t."description" ILIKE ${like}
        OR EXISTS (SELECT 1 FROM jsonb_path_query(t."blocks", 'strict $.**.text') v WHERE jsonb_typeof(v) = 'string' AND (v #>> '{}') ILIKE ${like})
        OR EXISTS (SELECT 1 FROM "Article" a JOIN "Category" c ON c."id" = a."categoryId" WHERE a."id" = t."articleId" AND COALESCE(NULLIF(c."names"->>${lang}, ''), c."names"->>'uz') ILIKE ${like})
        OR EXISTS (SELECT 1 FROM "_ArticleToTag" x JOIN "Tag" g ON g."id" = x."B" WHERE x."A" = t."articleId" AND COALESCE(NULLIF(g."names"->>${lang}, ''), g."names"->>'uz') ILIKE ${like}))
      LIMIT 500`;
    r = await listArticles(lang, { id: { in: rows.map((x) => x.articleId) }, ...(sp.cat ? { category: { key: sp.cat } } : {}) }, { page, sort: sp.sort === "views" ? "views" : "new" });
  }
  const ctl = "h-12 rounded-xl border border-rule bg-surface px-4 text-sm shadow-sm transition-colors hover:border-mute/50 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20";
  return (
    <main><PageHeader kicker="ANTIKORRUPSIYA" title={q ? <>{t.resultsFor} <span className="text-accent-ink">“{q}”</span></> : t.search}>
      <form role="search" className="flex max-w-4xl flex-wrap gap-3">
        <label className="relative min-w-0 flex-[2_1_16rem]"><span className="sr-only">{t.search}</span><SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mute" aria-hidden /><input name="q" defaultValue={q} placeholder={t.searchPh} className={`${ctl} w-full pl-12 text-base`} /></label>
        <select name="cat" defaultValue={sp.cat ?? ""} aria-label={t.category} className={ctl}><option value="">{t.allCategories}</option>{cats.map((c) => <option key={c.id} value={c.key}>{loc(c.names, lang)}</option>)}</select>
        <select name="sort" defaultValue={sp.sort ?? "new"} aria-label={t.sort} className={ctl}><option value="new">{t.newest}</option><option value="views">{t.mostViewed}</option></select>
        <button className="h-12 rounded-xl bg-accent px-7 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-accent-strong">{t.find}</button></form></PageHeader>
      <div className="wrap py-10 md:py-12">
        {r ? <><p className="mb-8 text-sm font-semibold text-mute">{r.total} {t.results}</p><Grid items={r.items} lang={lang} empty={t.noResults} bigFirst={false} /><Pager lang={lang} path={`/${lang}/search`} params={{ q, cat: sp.cat, sort: sp.sort }} page={page} pages={r.pages} /></>
          : <div className="grid place-items-center rounded-xl border border-dashed border-rule bg-band/50 px-6 py-20 text-center"><SearchIcon className="mb-3 size-8 text-mute/60" strokeWidth={1.5} aria-hidden /><p className="max-w-sm text-mute">{t.searchHint}</p></div>}
      </div>
    </main>
  );
}
