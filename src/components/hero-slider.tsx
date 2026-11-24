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
      className="relative isolate grid h-full overflow-hidden rounded-[0.95rem] bg-masthead text-white shadow-[var(--shadow-lift)]">
      {slides.map((s, k) => (
        <article key={s.id} aria-roledescription={n > 1 ? "slide" : undefined} aria-label={n > 1 ? `${slideLabel} ${k + 1} / ${n}` : undefined} aria-hidden={k !== i} inert={k !== i}
          className={`group relative col-start-1 row-start-1 flex min-h-[27rem] flex-col justify-end transition-opacity duration-700 sm:min-h-[30rem] lg:min-h-[29rem] ${k === i ? "z-[1] opacity-100" : "pointer-events-none z-0 opacity-0"}`}>
          {s.img ? <img src={s.img} alt="" decoding="async" fetchPriority={k === 0 ? "high" : "auto"} className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]" /> : <div className="art absolute inset-0 -z-20" />}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-masthead via-masthead/75 to-masthead/10 lg:bg-gradient-to-r lg:from-masthead/95 lg:via-masthead/55 lg:to-transparent" />
          <div className="relative flex flex-col items-start p-5 pb-16 sm:p-8 sm:pb-16 lg:max-w-[40rem] lg:p-10 lg:pb-[4rem]">
            {s.badge && (s.badgeHref ? <Link href={s.badgeHref} tabIndex={k === i ? 0 : -1} className={`relative z-10 mb-5 inline-flex rounded-md px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-navy ${s.blue ? "bg-brand" : "bg-accent !text-navy"}`}>{s.badge}</Link> : <span className="mb-5 inline-flex rounded-md bg-brand px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wide">{s.badge}</span>)}
            <h2 className="headline text-[1.85rem] !leading-[1.2] sm:text-[2.4rem] lg:text-[3rem]"><Link href={s.href} className="after:absolute after:inset-0">{s.title}</Link></h2>
            {s.description && <p className="mt-5 line-clamp-3 max-w-[33rem] text-[15px] leading-relaxed text-white/90 sm:text-[1.05rem] lg:text-[1.25rem] lg:leading-[1.45]">{s.description}</p>}
            <p className="mt-7 flex flex-wrap items-center gap-x-4 lg:mt-7 gap-y-2 text-[13px] text-white/90 lg:text-[14.5px]">
              {s.author && <span className="inline-flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-white text-navy"><UserRound className="size-4" aria-hidden /></span><b className="font-semibold">{s.author}</b></span>}
              <span className="hidden h-4 w-px bg-white/30 sm:block" aria-hidden /><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 opacity-80" aria-hidden />{s.date}</span>
              <span className="hidden h-4 w-px bg-white/30 sm:block" aria-hidden /><span className="inline-flex items-center gap-1.5"><Clock className="size-[1.1rem] opacity-80" aria-hidden />{s.mins}</span>
            </p>
          </div>
          <Link href={s.href} tabIndex={k === i ? 0 : -1} className="absolute bottom-5 right-5 z-10 hidden items-center gap-2 rounded-xl border border-white/30 bg-masthead/50 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-white hover:text-navy sm:inline-flex lg:bottom-[2.9rem] lg:right-7 lg:h-11 lg:py-0 lg:text-[15px]">{readMore}<ArrowRight className="size-4" aria-hidden /></Link>
        </article>))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-5 sm:px-8 lg:px-10 lg:pb-[1.6rem]">
        {n > 1 ? <div className="pointer-events-auto flex gap-2 lg:gap-[0.55rem]" role="group" aria-label={label}>{slides.map((s, k) => (
          <button key={s.id} type="button" aria-label={`${slideLabel} ${k + 1}`} aria-current={k === i} onClick={() => go(k)} className="group/i -my-3 py-3"><span className={`block h-1 w-10 rounded-full transition-all sm:w-[4.4rem] ${k === i ? "bg-[#f6a55c]" : "bg-white/35 group-hover/i:bg-white/60"}`} /></button>))}</div> : <span />}
        <Link href={slides[i].href} className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white hover:text-navy sm:hidden">{readMore}<ArrowRight className="size-4" aria-hidden /></Link>
      </div>
    </section>
  );
}
