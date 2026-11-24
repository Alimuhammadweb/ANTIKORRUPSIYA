import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Newspaper } from "lucide-react";
import { T, fmtDay, isLang, loc, type L } from "@/lib/i18n";
import { loadHome, type HomeBlock } from "@/lib/home";
import { db } from "@/lib/db";
import { plainText } from "@/lib/blocks";
import { Card, CardRow, Meta, SectionHead, Thumb, formatLabel, href } from "@/components/listing";
import { HeroSlider, type Slide } from "@/components/hero-slider";
import { slugOf, type Item } from "@/lib/queries";
import { alternatesFor } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params; if (!isLang(lang)) return {};
  return { title: T[lang].home_title, description: T[lang].tagline, alternates: alternatesFor(lang, ""), openGraph: { title: T[lang].home_title, description: T[lang].tagline, type: "website" } };
}
type Kind = HomeBlock["kind"];
const MORE: Partial<Record<Kind, string>> = { LATEST: "latest", POPULAR: "popular", TRENDING: "trending", INVESTIGATIONS: "investigations", ANNOUNCEMENTS: "announcements" };
const moreOf = (b: HomeBlock, lang: L) => b.kind === "CATEGORY" && b.category ? `/${lang}/category/${slugOf(b.category, lang)}` : MORE[b.kind] ? `/${lang}/${MORE[b.kind]}` : undefined;
const box = "rounded-2xl border border-rule bg-surface shadow-[var(--shadow-card)]";
const COLS = ["", "", "lg:grid-cols-2", "lg:grid-cols-3"];

/** Right-hand "latest news" rail beside the featured story. Every row is a real link to the article. */
function Rail({ items, lang }: { items: Item[]; lang: L }) {
  return (
    <aside aria-label={T[lang].latestNews} className={`${box} flex flex-col divide-y divide-rule overflow-hidden !rounded-[0.95rem]`}>
      {items.map((a) => (
        <article key={a.id} className="group relative flex flex-1 items-center gap-[1.15rem] p-[0.6rem] transition-colors hover:bg-band/60 lg:min-h-[6.6rem]">
          <Thumb a={a} lang={lang} badge={false} ratio="aspect-[1.4/1]" className="w-28 shrink-0 sm:w-32 lg:w-[8.2rem]" play={a.format === "VIDEO"} />
          <div className="min-w-0 flex-1"><h3 className="h-sans text-[1.02rem] font-medium lg:text-[1.1rem] lg:leading-[1.4]"><Link href={href(lang, a)} className="link-line after:absolute after:inset-0">{a.translations[0].title}</Link></h3><Meta a={a} lang={lang} className="lg:mt-2.5" /></div>
          <span aria-hidden className="mr-1 grid size-7 shrink-0 place-items-center rounded-full border border-ink/40 text-ink transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-white"><ArrowRight className="size-4" /></span>
        </article>))}
    </aside>
  );
}

/** The three headline sections. Each has a large lead card, then a different list style: ranked / thumbnails / dated notices. */
function SectionCard({ b, title, lang }: { b: HomeBlock; title: string; lang: L }) {
  const [lead] = b.items, tr = lead.translations[0], t = T[lang];
  return (
    <section className={`${box} flex flex-col overflow-hidden !rounded-[0.95rem]`}>
      <div className="px-3.5 pt-2 lg:pt-1.5 [&>div]:!mb-2.5"><SectionHead title={title} more={moreOf(b, lang)} lang={lang} /></div>
      <article className="group relative flex flex-1 flex-col">
        <div className="relative aspect-[16/9] lg:aspect-[3.8/1]"><Thumb a={lead} lang={lang} ratio="" rounded="rounded-none" className="!absolute inset-0 size-full" play={lead.format === "VIDEO"} />
          {b.kind === "ANNOUNCEMENTS" && lead.expiresAt && <p className="absolute bottom-2 left-3 z-[2] inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-navy shadow">{t.activeUntil} {fmtDay(lead.expiresAt, lang)}</p>}</div>
        <div className="flex flex-1 flex-col px-3.5 pb-3 pt-2.5"><h3 className="h-sans text-[1.2rem] font-semibold leading-[1.2] lg:text-[1.35rem]"><Link href={href(lang, lead)} className="link-line after:absolute after:inset-0">{tr.title}</Link></h3>
          <Meta a={lead} lang={lang} className="!mt-auto pt-3" /></div>
      </article>
    </section>
  );
}
function Extra({ b, lang, skip }: { b: HomeBlock; lang: L; skip: number[] }) {
  const t = T[lang], items = b.items.filter((a) => !skip.includes(a.id)); if (!items.length) return null;
  if (b.kind === "TRENDING") return (
    <section className="wrap"><SectionHead title={t.trending} more={moreOf(b, lang)} lang={lang} />
      <ol className={`${box} grid gap-x-10 p-6 md:grid-cols-2`}>{items.map((a, i) => (
        <li key={a.id} className="group relative flex gap-4 border-b border-rule py-4 first:pt-0 last:border-0 last:pb-0 md:[&:nth-last-child(2)]:last:border-0 md:[&:nth-last-child(2)]:border-0 md:[&:nth-last-child(2):nth-child(odd)]:border-0">
          <span className="w-9 shrink-0 text-center font-serif text-[2rem] font-bold leading-none text-accent tabular-nums" aria-hidden>{i + 1}</span>
          <div className="min-w-0"><h3 className="h-sans text-[1.02rem]"><Link href={href(lang, a)} className="link-line after:absolute after:inset-0">{a.translations[0].title}</Link></h3><Meta a={a} lang={lang} className="!mt-1.5" /></div></li>))}</ol></section>);
  if (b.kind === "CATEGORY") { const [first, ...rest] = items; return (
    <section className="wrap"><SectionHead title={loc(b.category?.names, lang)} more={moreOf(b, lang)} lang={lang} />
      <div className={rest.length ? "grid gap-6 lg:grid-cols-12" : ""}><div className={rest.length ? "lg:col-span-6" : "max-w-xl"}><Card a={first} lang={lang} feature /></div>
        {rest.length > 0 && <div className={`${box} divide-y divide-rule p-5 lg:col-span-6`}>{rest.map((a) => <div key={a.id} className="py-4 first:pt-0 last:pb-0"><CardRow a={a} lang={lang} thumb="w-28 sm:w-36" /></div>)}</div>}</div></section>); }
  return <section className="wrap"><SectionHead title={b.kind === "LATEST" ? t.latestNews : t.latest} more={moreOf(b, lang)} lang={lang} /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map((a) => <Card key={a.id} a={a} lang={lang} />)}</div></section>;
}
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLang(lang)) notFound();
  const t = T[lang], blocks = (await loadHome(lang)).filter((b) => b.items.length && b.kind !== "MEDIA"); // Videos / Interviews are not shown on the homepage
  if (!blocks.length) return <main className="wrap grid place-items-center py-32 text-center"><Newspaper className="mb-4 size-10 text-mute/50" strokeWidth={1.25} aria-hidden /><p className="max-w-sm text-lg text-mute">{t.empty}</p></main>;
  const of = (k: Kind) => blocks.find((b) => b.kind === k);
  const hero = of("HERO"), secondary = of("SECONDARY"), latest = of("LATEST");
  const heroItems = hero?.items ?? [(secondary ?? latest ?? blocks[0]).items[0]], heroIds = heroItems.map((a) => a.id);
  const rail = (secondary?.items ?? latest?.items ?? []).filter((a) => !heroIds.includes(a.id)).slice(0, 4);
  const authors = new Map((await db.article.findMany({ where: { id: { in: heroIds } }, select: { id: true, author: { select: { name: true } } } })).map((r) => [r.id, r.author?.name ?? ""]));
  const slides: Slide[] = heroItems.map((a) => {
    const tr = a.translations[0], fl = formatLabel(a, lang), words = plainText(tr.blocks).split(/\s+/).filter(Boolean).length;
    return { id: a.id, href: href(lang, a), img: a.cover?.path, blue: true, badge: fl ?? (a.category ? loc(a.category.names, lang) : undefined), badgeHref: a.format === "INVESTIGATION" ? `/${lang}/investigations` : a.category ? `/${lang}/category/${slugOf(a.category, lang)}` : undefined,
      title: tr.title, description: tr.description, author: authors.get(a.id) || "ANTIKORRUPSIYA", date: fmtDay(a.publishedAt, lang), mins: `${Math.max(1, Math.round(words / 190))} ${t.minRead}` };
  });
  const trio = ([["POPULAR", t.popularNews], ["INVESTIGATIONS", t.investigations], ["ANNOUNCEMENTS", t.announcements]] as [Kind, string][]).flatMap(([k, title]) => { const b = of(k); return b ? [{ b, title }] : []; });
  const consumed = new Set<Kind>(["HERO", "SECONDARY", "POPULAR", "INVESTIGATIONS", "ANNOUNCEMENTS"]), railIds = secondary ? [] : rail.map((a) => a.id);
  return (
    <main className="space-y-12 pb-4 pt-6 md:space-y-14 lg:pt-[1.6rem]">
      <div className="space-y-8">
      <div className="wrap"><div className={`grid gap-5 ${rail.length ? "lg:grid-cols-[minmax(0,1fr)_25rem] xl:grid-cols-[minmax(0,1fr)_29rem]" : ""}`}>
        <HeroSlider slides={slides} label={t.heroLabel} readMore={t.readMore} slideLabel={t.slide} />
        {rail.length > 0 && <Rail items={rail} lang={lang} />}
      </div></div>
      {trio.length > 0 && <div className={`wrap grid items-stretch gap-[1.6rem] ${COLS[Math.min(trio.length, 3)]}`}>{trio.map(({ b, title }) => <SectionCard key={b.id} b={b} title={title} lang={lang} />)}</div>}
      </div>
      {blocks.filter((b) => !consumed.has(b.kind)).map((b) => <Extra key={b.id} b={b} lang={lang} skip={b.kind === "LATEST" ? [...heroIds, ...railIds] : []} />)}
    </main>
  );
}
