import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Eye, Newspaper, Play } from "lucide-react";
import { T, fmtDay, fmtViews, loc, type L } from "@/lib/i18n";
import { slugOf, type Item } from "@/lib/queries";
import { firstVideo } from "@/lib/blocks";
import { InlineVideo } from "./inline-video";

export const href = (lang: L, a: Item) => `/${lang}/article/${a.translations[0].slug}`;

/** Short label for the article format; plain news has none. */
export function formatLabel(a: Item, lang: L): string | null {
  const t = T[lang];
  return ({ INVESTIGATION: t.fInvestigation, VIDEO: t.fVideo, INTERVIEW: t.fInterview, ANNOUNCEMENT: t.fAnnouncement, PHOTO_NEWS: t.fPhoto, GALLERY: t.fPhoto } as Record<string, string>)[a.format] ?? null;
}
/** Publication date + view count, with icons (as in the portal reference). */
export function Meta({ a, lang, className = "" }: { a: Item; lang: L; className?: string }) {
  return (
    <p className={`meta mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 ${className}`}>
      <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0 opacity-80" aria-hidden /><time dateTime={a.publishedAt?.toISOString()}>{fmtDay(a.publishedAt, lang)}</time></span>
      <span className="inline-flex items-center gap-1.5"><Eye className="size-3.5 shrink-0 opacity-80" aria-hidden /><span>{fmtViews(a.views, lang)}<span className="sr-only"> {T[lang].views}</span></span></span>
    </p>
  );
}
/** Cover image with a graceful artwork fallback, a format badge and an optional play button. Decorative: the headline link names the card. */
export function Thumb({ a, lang, ratio = "aspect-[3/2]", play, badge = true, className = "", rounded = "rounded-lg" }: { a: Item; lang: L; ratio?: string; play?: boolean; badge?: boolean; className?: string; rounded?: string }) {
  const label = badge ? formatLabel(a, lang) : null, strong = a.format === "INVESTIGATION";
  return (
    <div className={`relative isolate overflow-hidden bg-band ${rounded} ${ratio} ${className}`} aria-hidden>
      {a.cover ? <img src={a.cover.path} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
        : <div className="art absolute inset-0 grid place-items-center text-white/25"><Newspaper className="size-1/4 min-w-8 max-w-14" strokeWidth={1.25} /></div>}
      {label && <span className={`absolute left-3 top-3 z-[1] inline-flex items-center rounded-md px-2.5 py-1 text-[10.5px] font-bold uppercase leading-none tracking-wider shadow-sm ${strong ? "bg-brand text-white" : "bg-navy/85 text-white backdrop-blur"}`}>{label}</span>}
      {play && <span className="absolute inset-0 z-[1] grid place-items-center bg-gradient-to-t from-black/45 via-transparent to-transparent"><span className="grid size-12 place-items-center rounded-full bg-white/95 pl-0.5 text-navy shadow-lg transition-transform duration-200 group-hover:scale-110"><Play className="size-5 fill-current" /></span></span>}
    </div>
  );
}
export function Kicker({ a, lang, className = "" }: { a: Item; lang: L; className?: string }) {
  return a.category ? <Link href={`/${lang}/category/${slugOf(a.category, lang)}`} className={`kicker relative z-10 inline-block hover:underline ${className}`}>{loc(a.category.names, lang)}</Link> : null;
}
function Tags({ a, lang }: { a: Item; lang: L }) {
  return a.tags.length > 0 ? <p className="relative z-10 mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">{a.tags.slice(0, 3).map((g) => <Link key={g.id} href={`/${lang}/tag/${slugOf(g, lang)}`} className="text-mute transition-colors hover:text-brand-ink">#{loc(g.names, lang)}</Link>)}</p> : null;
}
const Until = ({ a, lang }: { a: Item; lang: L }) => a.format === "ANNOUNCEMENT" && a.expiresAt ? <p className="mt-2 inline-flex w-fit rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-ink">{T[lang].activeUntil} {fmtDay(a.expiresAt, lang)}</p> : null;

/** Standard story card (bordered, rounded, lifts on hover). `big` is the wide lead layout at the top of listing pages; `feature` is a larger vertical card.
 *  The whole card is one link (stretched headline link). */
export function Card({ a, lang, big, feature, ratio }: { a: Item; lang: L; big?: boolean; feature?: boolean; dark?: boolean; ratio?: string }) {
  const tr = a.translations[0], isVideo = a.format === "VIDEO", v = isVideo ? firstVideo(tr.blocks) : undefined, r = ratio ?? (big ? "aspect-[16/10]" : feature ? "aspect-[16/9]" : "aspect-[3/2]");
  return (
    <article className={`group card-pub relative overflow-hidden ${big ? "lg:grid lg:grid-cols-12 lg:items-stretch" : "flex flex-col"}`}>
      <div className={`relative ${big ? "lg:col-span-7" : ""} ${v ? "z-10" : ""}`}>{v ? <InlineVideo v={v} poster={a.cover?.path} label={T[lang].play} ratio={r} /> : <Thumb a={a} lang={lang} ratio={r} play={isVideo} rounded="rounded-none" className={big ? "lg:h-full lg:!aspect-auto lg:min-h-[22rem]" : ""} />}</div>
      <div className={`flex flex-1 flex-col ${big ? "justify-center p-6 lg:col-span-5 lg:p-9" : feature ? "p-5" : "p-4"}`}>
        <Kicker a={a} lang={lang} />
        <h3 className={`${big ? "headline text-[1.65rem] sm:text-3xl lg:text-[2.1rem]" : feature ? "headline text-[1.5rem] sm:text-[1.75rem]" : "h-sans text-[1.08rem]"} mt-1.5`}><Link href={href(lang, a)} className="link-line after:absolute after:inset-0">{tr.title}</Link></h3>
        {tr.description && <p className={`mt-2 font-serif leading-relaxed text-mute ${big ? "text-[1.05rem] lg:line-clamp-5" : feature ? "line-clamp-3 text-[1.02rem]" : "line-clamp-2 text-[0.93rem]"}`}>{tr.description}</p>}
        <Until a={a} lang={lang} /><Meta a={a} lang={lang} className="mt-auto pt-3" /><Tags a={a} lang={lang} />
      </div>
    </article>
  );
}
/** Horizontal list item: thumbnail beside the headline (sidebars, "more stories" stacks, section cards). */
export function CardRow({ a, lang, dark, kicker = true, desc, thumb = "w-28 sm:w-36", size = "text-[1.02rem]" }: { a: Item; lang: L; dark?: boolean; kicker?: boolean; desc?: boolean; thumb?: string; size?: string }) {
  const tr = a.translations[0];
  return (
    <article className="group relative flex gap-4">
      <Thumb a={a} lang={lang} badge={false} ratio="aspect-[4/3]" className={`shrink-0 ${thumb}`} rounded="rounded-lg" play={a.format === "VIDEO"} />
      <div className="min-w-0 flex-1">
        {kicker && <Kicker a={a} lang={lang} />}
        <h3 className={`h-sans ${kicker ? "mt-1" : ""} ${size} ${dark ? "text-white" : ""}`}><Link href={href(lang, a)} className="link-line after:absolute after:inset-0">{tr.title}</Link></h3>
        {desc && tr.description && <p className="mt-1.5 line-clamp-2 font-serif text-[0.92rem] leading-snug text-mute">{tr.description}</p>}
        <Meta a={a} lang={lang} className={dark ? "!text-silver/80" : ""} />
      </div>
    </article>
  );
}
/** Section heading in the portal style: orange bar, title, "View all →". */
export function SectionHead({ title, more, lang, children }: { title: string; more?: string; lang: L; dark?: boolean; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-3 text-[1.45rem] font-extrabold leading-tight tracking-tight"><span className="h-7 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />{title}</h2>
      {children}
      {more && <Link href={more} className="group/more inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-brand-ink">{T[lang].viewAll}<ArrowRight className="size-4 transition-transform group-hover/more:translate-x-0.5" aria-hidden /></Link>}
    </div>
  );
}
export function Grid({ items, lang, empty, bigFirst = true }: { items: Item[]; lang: L; empty: string; bigFirst?: boolean }) {
  if (!items.length) return <div className="grid place-items-center rounded-2xl border border-dashed border-rule bg-band/50 px-6 py-20 text-center"><Newspaper className="mb-3 size-8 text-mute/60" strokeWidth={1.5} aria-hidden /><p className="max-w-sm text-mute">{empty}</p></div>;
  const [first, ...rest] = items;
  return (
    <div className="space-y-7">
      {bigFirst && <Card a={first} lang={lang} big />}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{(bigFirst ? rest : items).map((a) => <Card key={a.id} a={a} lang={lang} />)}</div>
    </div>
  );
}
/** Numbered pagination with ellipses. */
export function Pager({ lang, path, params, page, pages }: { lang: L; path: string; params: Record<string, string | undefined>; page: number; pages: number }) {
  if (pages <= 1) return null;
  const t = T[lang], h = (p: number) => { const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]); q.set("page", String(p)); return `${path}?${q}`; };
  const nums = [...new Set([1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages))].sort((x, y) => x - y);
  const cell = "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5 border-t border-rule pt-8">
      {page > 1 ? <Link href={h(page - 1)} rel="prev" className={`${cell} border-rule hover:border-brand hover:text-brand-ink`}><ChevronLeft className="size-4" aria-hidden /><span className="hidden sm:inline">{t.prev}</span><span className="sr-only sm:hidden">{t.prev}</span></Link> : <span className={`${cell} border-transparent opacity-30`} aria-hidden><ChevronLeft className="size-4" /></span>}
      {nums.map((n, i) => <span key={n} className="contents">{i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-mute" aria-hidden>…</span>}
        {n === page ? <span aria-current="page" className={`${cell} border-brand bg-brand text-white max-sm:hidden`}>{n}</span> : <Link href={h(n)} aria-label={`${t.page} ${n}`} className={`${cell} border-rule hover:border-brand hover:text-brand-ink max-sm:hidden`}>{n}</Link>}</span>)}
      <span className="px-2 text-sm text-mute sm:hidden">{page} {t.of} {pages}</span>
      {page < pages ? <Link href={h(page + 1)} rel="next" className={`${cell} border-rule hover:border-brand hover:text-brand-ink`}><span className="hidden sm:inline">{t.next}</span><span className="sr-only sm:hidden">{t.next}</span><ChevronRight className="size-4" aria-hidden /></Link> : <span className={`${cell} border-transparent opacity-30`} aria-hidden><ChevronRight className="size-4" /></span>}
    </nav>
  );
}
/** Header band for listing pages (latest, popular, trending, investigations, announcements, categories, category, tag, search). */
export function PageHeader({ kicker, title, sub, children }: { kicker?: string; title: React.ReactNode; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-rule bg-band">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/[0.07] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="wrap relative py-10 md:py-14">
        {kicker && <p className="kicker mb-3 flex items-center gap-2"><span className="h-1.5 w-6 rounded-full bg-accent" aria-hidden />{kicker}</p>}
        <h1 className="headline max-w-4xl text-[2.25rem] !leading-[1.1] md:text-5xl">{title}</h1>
        {sub && <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-mute">{sub}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}
