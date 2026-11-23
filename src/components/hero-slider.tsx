"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, UserRound } from "lucide-react";
export type Slide = { id: number; href: string; img?: string; badge?: string; badgeHref?: string; blue?: boolean; title: string; description: string; author: string; date: string; mins: string };
/** Featured stories. One slide shows a static card; several show a slider with clickable indicators (auto-advances every 7 s, pauses on hover/focus, off for reduced motion). */
export function HeroSlider({ slides, label, readMore, slideLabel }: { slides: Slide[]; label: string; readMore: string; slideLabel: string }) {
  const [i, setI] = useState(0), [paused, setPaused] = useState(false), n = slides.length;
  const go = useCallback((k: number) => setI((k + n) % n), [n]);
  useEffect(() => {
    if (n < 2 || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 7000); return () => clearInterval(t);
  }, [n, paused]);
  return (
    <section aria-roledescription={n > 1 ? "carousel" : undefined} aria-label={label} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      className="relative isolate grid h-full overflow-hidden rounded-2xl bg-navy text-white shadow-[var(--shadow-lift)]">
      {slides.map((s, k) => (
        <article key={s.id} aria-roledescription={n > 1 ? "slide" : undefined} aria-label={n > 1 ? `${slideLabel} ${k + 1} / ${n}` : undefined} aria-hidden={k !== i} inert={k !== i}
          className={`group relative col-start-1 row-start-1 flex min-h-[27rem] flex-col justify-end transition-opacity duration-700 sm:min-h-[30rem] lg:min-h-[33rem] ${k === i ? "z-[1] opacity-100" : "pointer-events-none z-0 opacity-0"}`}>
          {s.img ? <img src={s.img} alt="" decoding="async" fetchPriority={k === 0 ? "high" : "auto"} className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]" /> : <div className="art absolute inset-0 -z-20" />}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/75 to-navy/10 lg:bg-gradient-to-r lg:from-navy lg:via-navy/70 lg:to-transparent" />
          <div className="relative flex flex-col items-start p-5 pb-16 sm:p-8 sm:pb-16 lg:max-w-[40rem] lg:p-11 lg:pb-20">
            {s.badge && (s.badgeHref ? <Link href={s.badgeHref} tabIndex={k === i ? 0 : -1} className={`relative z-10 mb-4 inline-flex rounded-md px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-navy ${s.blue ? "bg-brand" : "bg-accent !text-navy"}`}>{s.badge}</Link> : <span className="mb-4 inline-flex rounded-md bg-brand px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-wider">{s.badge}</span>)}
            <h2 className="headline text-[1.85rem] !leading-[1.13] sm:text-[2.4rem] lg:text-[3.1rem]"><Link href={s.href} className="after:absolute after:inset-0">{s.title}</Link></h2>
            {s.description && <p className="mt-3 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-white/85 sm:text-[1.05rem]">{s.description}</p>}
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-white/90">
              {s.author && <span className="inline-flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-white text-navy"><UserRound className="size-4" aria-hidden /></span><b className="font-semibold">{s.author}</b></span>}
              <span className="hidden h-4 w-px bg-white/30 sm:block" aria-hidden /><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 opacity-80" aria-hidden />{s.date}</span>
              <span className="hidden h-4 w-px bg-white/30 sm:block" aria-hidden /><span className="inline-flex items-center gap-1.5"><Clock className="size-4 opacity-80" aria-hidden />{s.mins}</span>
            </p>
          </div>
          <Link href={s.href} tabIndex={k === i ? 0 : -1} className="absolute bottom-5 right-5 z-10 hidden items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-white hover:text-navy sm:inline-flex lg:bottom-8 lg:right-8">{readMore}<ArrowRight className="size-4" aria-hidden /></Link>
        </article>))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-5 sm:px-8 lg:px-11 lg:pb-8">
        {n > 1 ? <div className="pointer-events-auto flex gap-2" role="group" aria-label={label}>{slides.map((s, k) => (
          <button key={s.id} type="button" aria-label={`${slideLabel} ${k + 1}`} aria-current={k === i} onClick={() => go(k)} className="group/i -my-3 py-3"><span className={`block h-1 w-10 rounded-full transition-all sm:w-[4.4rem] ${k === i ? "bg-accent" : "bg-white/30 group-hover/i:bg-white/60"}`} /></button>))}</div> : <span />}
        <Link href={slides[i].href} className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white hover:text-navy sm:hidden">{readMore}<ArrowRight className="size-4" aria-hidden /></Link>
      </div>
    </section>
  );
}
