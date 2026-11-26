import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Newspaper } from "lucide-react";
import { T, fmtDay, isLang, loc, type L } from "@/lib/i18n";
import { loadHome, type HomeBlock } from "@/lib/home";
import { plainText } from "@/lib/blocks";
import { Card, CardRow, Meta, SectionHead, Thumb, formatLabel, href, imageOf } from "@/components/listing";
import { HeroSlider, type Slide } from "@/components/hero-slider";
import { listArticles, slugOf, type Item } from "@/lib/queries";
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
const panel = "rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]";
const COLS = ["", "", "md:grid-cols-2", "md:grid-cols-2 lg:grid-cols-3"];
const SLIDES = 4, RAIL = 4; // the carousel and the list beside it
const TRIO: Kind[] = ["POPULAR", "INVESTIGATIONS", "ANNOUNCEMENTS"];

/** The list beside the carousel: thumbnail, headline, date and views, arrow. The whole row is one link. */
function Rail({ items, lang }: { items: Item[]; lang: L }) {
  return (
    <aside aria-label={T[lang].latestNews} className={`${panel} flex min-w-0 flex-col divide-y divide-line overflow-hidden`}>
      {items.map((a) => (
        <article key={a.id} data-rail className="group relative flex min-h-[7.25rem] flex-1 items-center gap-3.5 px-2.5 py-2 transition-colors hover:bg-band/60 min-[1440px]:gap-5">
          <Thumb a={a} lang={lang} badge={false} ratio="aspect-[7/5]" className="w-28 shrink-0 lg:w-20 xl:w-[7.5rem] min-[1440px]:w-[8.75rem]" play={a.format === "VIDEO"} />
          <div className="min-w-0 flex-1">
            <h3 title={a.translations[0].title} className="h-sans line-clamp-3 !text-wrap break-words text-[0.95rem] !leading-[1.32] min-[1440px]:text-[1.0625rem]"><Link href={href(lang, a)} className="after:absolute after:inset-0 group-hover:text-brand-ink">{a.translations[0].title}</Link></h3>
            <Meta a={a} lang={lang} className="!mt-1.5 text-[13px]" />
          </div>
          <span aria-hidden className="mr-1.5 grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink shadow-sm transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-white max-sm:hidden lg:max-xl:hidden"><ArrowRight className="size-4" /></span>
        </article>))}
    </aside>
  );
}

/** One of the three columns: heading with "view all", a wide picture, headline, date and views. */
function SectionColumn({ b, title, lang }: { b: HomeBlock; title: string; lang: L }) {
  const lead = b.items[0] as Item | undefined, t = T[lang], more = moreOf(b, lang);
  return (
    <section data-column className={`${panel} flex min-w-0 flex-col overflow-hidden`}>
      <div className="flex min-h-[3.15rem] items-center justify-between gap-3 pr-4">
        <h2 className="flex min-w-0 items-center gap-3 text-[1.1rem] font-bold leading-tight tracking-tight min-[1440px]:gap-5 min-[1440px]:text-[1.4rem]"><span className="h-8 w-1.5 shrink-0 rounded-r-full bg-accent-bar" aria-hidden />{title}</h2>
        {more && <Link href={more} className="group/more inline-flex shrink-0 items-center gap-2 text-[13.5px] font-semibold text-ink transition-colors hover:text-brand-ink"><span className="max-sm:sr-only md:max-xl:sr-only">{t.viewAll}</span><ArrowRight className="size-4 transition-transform group-hover/more:translate-x-0.5" aria-hidden /></Link>}
      </div>
      {lead ? (
        <article className="group relative flex flex-1 flex-col">
          <Thumb a={lead} lang={lang} badge={false} ratio="aspect-[16/9] xl:aspect-[18/5]" className="mx-1 [&_img]:object-[center_30%]" play={lead.format === "VIDEO"} />
          <div className="flex flex-1 flex-col px-3 pb-3.5 pt-2.5">
            <h3 title={lead.translations[0].title} className="h-sans line-clamp-2 min-h-[2.64em] !text-wrap break-words text-[1.15rem] !leading-[1.32] xl:text-[1.25rem]"><Link href={href(lang, lead)} className="after:absolute after:inset-0 group-hover:text-brand-ink">{lead.translations[0].title}</Link></h3>
            <Meta a={lead} lang={lang} className="text-[13px]" />
            {b.kind === "ANNOUNCEMENTS" && lead.expiresAt && <p className="mt-2 inline-flex w-fit rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-ink">{t.activeUntil} {fmtDay(lead.expiresAt, lang)}</p>}
          </div>
        </article>
      ) : (
        <div className="mx-1 mb-1 grid min-h-44 flex-1 place-items-center rounded-lg bg-band/70 px-6 py-8 text-center"><div><Newspaper className="mx-auto mb-2 size-7 text-mute/60" strokeWidth={1.5} aria-hidden /><p className="text-sm text-mute">{t.noArticlesSection}</p></div></div>
      )}
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
/** A public article card never carries staff names: only category, date, reading time and (in lists) views. */
function toSlide(a: Item, lang: L): Slide {
  const tr = a.translations[0], text = plainText(tr.blocks).replace(/\s+/g, " ").trim(), words = text.split(" ").filter(Boolean).length;
  const excerpt = (text.startsWith(tr.title) ? text.slice(tr.title.length).trim() : text).slice(0, 200);
  return { id: a.id, href: href(lang, a), img: imageOf(a), badge: formatLabel(a, lang) ?? (a.category ? loc(a.category.names, lang) : undefined),
    badgeHref: a.format === "INVESTIGATION" ? `/${lang}/investigations` : a.format === "ANNOUNCEMENT" ? `/${lang}/announcements` : a.category ? `/${lang}/category/${slugOf(a.category, lang)}` : undefined,
    title: tr.title, description: tr.description || excerpt, date: fmtDay(a.publishedAt, lang), dateTime: a.publishedAt?.toISOString(), mins: `${Math.max(1, Math.round(words / 190))} ${T[lang].minRead}` };
}
/** Chooses the carousel slides and the side list. The editors' choices (Admin -> Homepage) always come first; when they are fewer than four,
 *  the newest published articles fill the remaining places. With very few articles the side list wins over extra slides, then slides may repeat list items. */
async function topStories(lang: L, hero: HomeBlock | undefined, side: HomeBlock | undefined, fallback: Item) {
  const picked = hero?.items.length ? hero.items : [fallback];
  const newest = async (take: number, not: number[], withCover = false) => take > 0 ? (await listArticles(lang, { id: { notIn: not }, ...(withCover ? { coverId: { not: null } } : {}) }, { page: 1, take })).items : [];
  const ids = (x: Item[]) => x.map((a) => a.id);
  let rail = (side?.items ?? []).filter((a) => !ids(picked).includes(a.id)).slice(0, RAIL);
  rail = [...rail, ...(await newest(RAIL - rail.length, ids([...picked, ...rail])))];
  let slides = picked;
  if (hero) {
    slides = [...slides, ...(await newest(SLIDES - slides.length, ids([...slides, ...rail]), true))];
    slides = [...slides, ...(await newest(SLIDES - slides.length, ids(slides), true))];
  }
  return { slides, rail };
}
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLang(lang)) notFound();
  const t = T[lang], all = (await loadHome(lang)).filter((b) => b.kind !== "MEDIA"); // Videos / Interviews are not shown on the homepage
  const blocks = all.filter((b) => b.items.length);
  if (!blocks.length) return <main className="wrap grid place-items-center py-32 text-center"><Newspaper className="mb-4 size-10 text-mute/50" strokeWidth={1.25} aria-hidden /><p className="max-w-sm text-lg text-mute">{t.empty}</p></main>;
  const of = (k: Kind) => blocks.find((b) => b.kind === k);
  const hero = of("HERO"), secondary = of("SECONDARY"), latest = of("LATEST");
  const { slides, rail } = await topStories(lang, hero, secondary ?? latest, (secondary ?? latest ?? blocks[0]).items[0]);
  const topIds = [...slides, ...rail].map((a) => a.id);
  // The three columns keep their place even while one of them has no article yet (a section switched off in the admin panel is left out).
  const titles: Partial<Record<Kind, string>> = { POPULAR: t.popularNews, INVESTIGATIONS: t.investigations, ANNOUNCEMENTS: t.announcements };
  const trio = TRIO.flatMap((k) => { const b = all.find((x) => x.kind === k); return b ? [{ b, title: titles[k]! }] : []; });
  // "Popular" avoids leading with a story that already leads one of the other two columns, when it has another to show.
  const reserved = new Set(trio.filter(({ b }) => b.kind !== "POPULAR").map(({ b }) => b.items[0]?.id));
  const columns = trio.map(({ b, title }) => ({ title, b: b.kind === "POPULAR" ? { ...b, items: [...b.items].sort((x, y) => Number(reserved.has(x.id)) - Number(reserved.has(y.id))) } : b }));
  const consumed = new Set<Kind>(["HERO", "SECONDARY", ...TRIO]);
  const extras = blocks.filter((b) => !consumed.has(b.kind) && b.items.some((a) => b.kind !== "LATEST" || !topIds.includes(a.id)));
  return (
    <main className="-mb-16 bg-canvas pb-12 pt-5 lg:pt-[1.6rem]">
      <h1 className="sr-only">{t.home_title}</h1>
      <div className="wrap"><div className={`grid gap-5 ${rail.length ? "lg:grid-cols-[minmax(0,2.05fr)_minmax(0,1fr)]" : ""}`}>
        <HeroSlider slides={slides.map((a) => toSlide(a, lang))} label={t.heroLabel} readMore={t.readMore} slideLabel={t.slide} />
        {rail.length > 0 && <Rail items={rail} lang={lang} />}
      </div></div>
      {trio.length > 0 && <div className={`wrap mt-6 grid items-stretch gap-5 xl:gap-[1.6rem] ${COLS[trio.length]}`}>{columns.map(({ b, title }) => <SectionColumn key={b.id} b={b} title={title} lang={lang} />)}</div>}
      {extras.length > 0 && <div className="mt-12 space-y-12 md:space-y-16">{extras.map((b) => <Extra key={b.id} b={b} lang={lang} skip={b.kind === "LATEST" ? topIds : []} />)}</div>}
    </main>
  );
}
