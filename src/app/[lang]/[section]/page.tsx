import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, T } from "@/lib/i18n";
import { listArticles, popular } from "@/lib/queries";
import { Grid, PageHeader, Pager } from "@/components/listing";
import { alternatesFor } from "@/lib/seo";

export const dynamic = "force-dynamic";
const SECTIONS = { latest: {}, popular: {}, trending: { trending: true }, investigations: { format: "INVESTIGATION" }, videos: { format: "VIDEO" }, interviews: { format: "INTERVIEW" }, announcements: { format: "ANNOUNCEMENT" } } as const;
const PERIODS = { today: 1, week: 7, month: 30, all: 0 } as const;
type P = { params: Promise<{ lang: string; section: string }>; searchParams: Promise<{ page?: string; period?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, section } = await params; if (!isLang(lang) || !(section in SECTIONS)) return {};
  const title = `${T[lang][section as keyof typeof SECTIONS]} — ANTIKORRUPSIYA`; return { title, alternates: alternatesFor(lang, `/${section}`), openGraph: { title, type: "website" } };
}
export default async function Section({ params, searchParams }: P) {
  const { lang, section } = await params; if (!isLang(lang) || !(section in SECTIONS)) notFound();
  const sp = await searchParams, page = Math.max(1, Number(sp.page) || 1), t = T[lang];
  const period = (sp.period && sp.period in PERIODS ? sp.period : "all") as keyof typeof PERIODS;
  const r = section === "popular" ? await popular(lang, PERIODS[period], page)
    : await listArticles(lang, SECTIONS[section as keyof typeof SECTIONS], { page, sort: section === "trending" ? "trending" : "new" }); // Trending: exactly the editors' selection and order
  return (
    <main>
      <PageHeader title={t[section as keyof typeof SECTIONS]} kicker="ANTIKORRUPSIYA">
        {section === "popular" && <div className="inline-flex flex-wrap gap-1 rounded-full border border-rule bg-surface p-1 shadow-sm" role="group" aria-label={t.popular}>{(["today", "week", "month", "all"] as const).map((p) => <Link key={p} href={p === "all" ? `/${lang}/popular` : `/${lang}/popular?period=${p}`} aria-current={period === p ? "true" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${period === p ? "bg-navy text-white dark:bg-accent dark:text-navy" : "text-mute hover:bg-band hover:text-ink"}`}>{t[p]}</Link>)}</div>}
      </PageHeader>
      <div className="wrap py-10 md:py-14">
        <Grid items={r.items} lang={lang} empty={t.empty} bigFirst={section !== "popular" && section !== "trending"} />
        <Pager lang={lang} path={`/${lang}/${section}`} params={{ period: section === "popular" && period !== "all" ? period : undefined }} page={page} pages={r.pages} />
      </div>
    </main>
  );
}
