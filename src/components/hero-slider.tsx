"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
export type Slide = { id: number; href: string; img?: string; badge?: string; badgeHref?: string; title: string; description: string; date: string; dateTime?: string; mins: string };

/** Display time of one slide. The progress bar's CSS animation IS the timer: when it finishes, the next slide opens. */
const SLIDE_MS = 6000;
/** Long (often all-caps) headlines step down in size so every slide fits the same card without moving the layout. */
const titleSize = (s: string) =>
  s.length <= 56 ? "text-[1.9rem] sm:text-[2.5rem] xl:text-[3.2rem]"
  : s.length <= 96 ? "text-[1.65rem] sm:text-[2.15rem] lg:text-[2rem] xl:text-[2.65rem]"
  : "text-[1.45rem] sm:text-[1.8rem] lg:text-[1.65rem] xl:text-[2.15rem]";

/** Featured stories carousel. Auto-advances, pauses on mouse hover and keyboard focus, restarts the timer on manual selection,
 *  and neither auto-plays nor animates for visitors who prefer reduced motion. */
export function HeroSlider({ slides, label, readMore, slideLabel }: { slides: Slide[]; label: string; readMore: string; slideLabel: string }) {
  const n = slides.length;
  const [{ i, run }, setState] = useState({ i: 0, run: 0 }); // `run` restarts the progress animation even when the same indicator is clicked again
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)"), f = () => setReduced(m.matches);
    f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f);
  }, []);
  const cur = i < n ? i : 0;
  const go = (k: number) => setState((s) => ({ i: (k + n) % n, run: s.run + 1 }));
  // A chosen indicator starts filling at once, even though the pointer is still over the card; the next hover pauses it again.
  const choose = (k: number) => { go(k); setHover(false); };
  return (
    <section aria-roledescription={n > 1 ? "carousel" : undefined} aria-label={label}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)} onPointerLeave={() => setHover(false)}
      onFocus={(e) => setFocus(e.target.matches(":focus-visible"))} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocus(false)}
      className="relative isolate grid h-full min-w-0 overflow-hidden rounded-xl bg-night text-white shadow-[var(--shadow-lift)]">
      {slides.map((s, k) => {
        const on = k === cur;
        return (
          <article key={s.id} data-slide aria-roledescription={n > 1 ? "slide" : undefined} aria-label={n > 1 ? `${slideLabel} ${k + 1} / ${n}` : undefined} aria-hidden={!on} inert={!on}
            className={`group relative col-start-1 row-start-1 flex min-h-[31rem] min-w-0 flex-col justify-end transition-opacity duration-700 ease-in-out sm:min-h-[29rem] lg:justify-start ${on ? "z-[1] opacity-100" : "pointer-events-none z-0 opacity-0"}`}>
            {s.img ? <img src={s.img} alt="" decoding="async" fetchPriority={k === 0 ? "high" : "auto"} className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.02]" /> : <div className="art absolute inset-0 -z-20" />}
            {/* readability overlays: solid navy behind the text, opening up towards the right of the photograph */}
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/80 to-night/15 lg:bg-[linear-gradient(90deg,rgb(7_21_47/.97)_0%,rgb(7_21_47/.92)_40%,rgb(7_21_47/.7)_62%,rgb(7_21_47/.12)_83%,rgb(7_21_47/.05)_100%)]" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-night/85 to-transparent" />

            <div className="relative flex w-full flex-col items-start [text-shadow:0_1px_14px_rgb(7_21_47/.75)] px-5 pb-[7.5rem] pt-16 sm:px-8 sm:pb-24 lg:flex-1 lg:px-10 lg:pb-[3.9rem] lg:pt-8">
              {s.badge && (() => {
                const cls = "absolute left-5 top-5 z-10 inline-flex max-w-[80%] rounded-md bg-brand px-3 py-1.5 text-[12px] font-bold uppercase leading-4 tracking-wide text-white sm:left-8 lg:static lg:mb-5";
                return s.badgeHref ? <Link href={s.badgeHref} className={`${cls} transition-colors hover:bg-white hover:text-night`}>{s.badge}</Link> : <span className={cls}>{s.badge}</span>;
              })()}
              <h2 title={s.title} className={`headline line-clamp-4 max-w-[38rem] !font-bold !leading-[1.15] !tracking-[-0.015em] ${titleSize(s.title)}`}><Link href={s.href} className="after:absolute after:inset-0">{s.title}</Link></h2>
              {s.description && <p className="mt-3.5 line-clamp-2 max-w-[30rem] text-[15px] leading-relaxed text-white/90 sm:text-[1.1rem] sm:leading-[1.55]">{s.description}</p>}
              <p className="mt-5 flex flex-wrap items-center gap-y-2 text-[13.5px] text-white/90 lg:mt-auto lg:pt-4">
                <span className="inline-flex items-center gap-2"><CalendarDays className="size-[17px]" aria-hidden /><time dateTime={s.dateTime}>{s.date}</time></span>
                <span className="mx-4 h-5 w-px bg-white/30" aria-hidden />
                <span className="inline-flex items-center gap-2"><Clock className="size-[17px]" aria-hidden />{s.mins}</span>
              </p>
            </div>
            <Link href={s.href} className="absolute bottom-5 right-5 z-20 inline-flex h-11 items-center gap-2.5 rounded-full border border-white/25 bg-night/70 px-5 text-sm font-semibold backdrop-blur transition-colors hover:bg-white hover:text-night lg:bottom-11 lg:right-7 lg:px-6">{readMore}<ArrowRight className="size-4" aria-hidden /></Link>
          </article>
        );
      })}
      {n > 1 && (
        <div className="pointer-events-none absolute bottom-[5.25rem] left-5 right-5 z-10 flex sm:bottom-6 sm:left-8 sm:right-48 lg:left-10" role="group" aria-label={label}>
          {slides.map((s, k) => (
            <button key={s.id} type="button" aria-label={`${slideLabel} ${k + 1}`} aria-current={k === cur ? "true" : undefined} onClick={() => choose(k)}
              className="group/i pointer-events-auto mr-2 min-w-0 max-w-[4.4rem] flex-1 py-2.5 last:mr-0">
              <span className="block h-1 overflow-hidden rounded-full bg-white/30 transition-colors group-hover/i:bg-white/55">
                {k === cur && <span key={run} data-progress onAnimationEnd={() => go(cur + 1)} className={`block h-full w-full origin-left rounded-full bg-accent-soft ${reduced ? "" : "hero-progress"}`} style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: hover || focus ? "paused" : "running" }} />}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
