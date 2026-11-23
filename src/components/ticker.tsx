import Link from "next/link";
import { db } from "@/lib/db";
import { visible } from "@/lib/visible";
import { T, type L } from "@/lib/i18n";
// Shows only active, currently valid items in this language; renders nothing when there are none.
// Long headlines scroll as a marquee (pauses on hover/focus; static + scrollable for reduced-motion users).
export async function Ticker({ lang }: { lang: L }) {
  const now = new Date();
  const all = await db.breakingNews.findMany({ where: { lang: { in: lang === "uz" ? ["uz"] : [lang, "uz"] }, active: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, orderBy: [{ sortOrder: "asc" }, { startsAt: "desc" }], take: 20 });
  const items = (all.some((i) => i.lang === lang) ? all.filter((i) => i.lang === lang) : all).slice(0, 10); // no items in this language: show the Uzbek ones
  if (!items.length) return null;
  const found = await db.translation.findMany({ where: { articleId: { in: items.flatMap((i) => (i.articleId ? [i.articleId] : [])) }, article: visible() }, select: { articleId: true, slug: true, lang: true } });
  const links = found.filter((x) => x.lang === lang || !found.some((y) => y.articleId === x.articleId && y.lang === lang)).sort((a, b) => Number(b.lang === lang) - Number(a.lang === lang));
  const chars = items.reduce((n, i) => n + i.text.length, 0), moving = chars > 70, dur = Math.max(24, Math.round(chars * 0.32));
  const Row = ({ dup }: { dup?: boolean }) => (
    <ul className="flex shrink-0 items-center" {...(dup ? { "data-dup": "", "aria-hidden": true } : {})}>
      {items.map((i) => { const l = links.find((x) => x.articleId === i.articleId); return (
        <li key={i.id} className="flex shrink-0 items-center text-[13.5px] font-medium">
          {l ? <Link href={`/${lang}/article/${l.slug}`} tabIndex={dup ? -1 : undefined} className="transition-colors hover:text-accent-ink hover:underline">{i.text}</Link> : <span>{i.text}</span>}
          <span aria-hidden className="mx-5 size-1 rounded-full bg-accent" />
        </li>); })}
    </ul>
  );
  return (
    <div className="border-b border-rule bg-surface" role="region" aria-label={T[lang].breaking}>
      <div className="wrap flex h-11 items-center gap-4">
        <strong className="inline-flex shrink-0 items-center gap-2 rounded-full bg-breaking py-1 pl-2.5 pr-3 text-[11px] font-bold uppercase tracking-wider text-white"><span className="live-dot" aria-hidden />{T[lang].breaking}</strong>
        <div className={`marquee relative min-w-0 flex-1 overflow-hidden ${moving ? "[mask-image:linear-gradient(90deg,transparent,#000_2rem,#000_calc(100%-2rem),transparent)]" : ""}`}>
          {moving ? <div className="marquee-track" style={{ "--dur": `${dur}s` } as React.CSSProperties}><Row /><Row dup /></div> : <div className="flex overflow-x-auto no-scrollbar"><Row /></div>}
        </div>
      </div>
    </div>
  );
}
