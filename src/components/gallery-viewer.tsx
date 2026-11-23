"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
type Item = { src: string; alt?: string; caption?: string; credit?: string };
type Labels = { gallery: string; close: string; prev: string; next: string; open: string };

/** Gallery grid; click opens a full-screen viewer with next / previous / close (buttons, arrow keys, Escape, swipe). */
export function GalleryViewer({ items, labels }: { items: Item[]; labels: Labels }) {
  const [open, setOpen] = useState<number | null>(null), closeBtn = useRef<HTMLButtonElement>(null), opener = useRef<HTMLElement | null>(null), touch = useRef(0);
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);
  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    addEventListener("keydown", k); document.body.style.overflow = "hidden"; closeBtn.current?.focus();
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; opener.current?.focus(); };
  }, [open === null, go]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = open === null ? null : items[open];
  return (
    <figure className="not-prose" aria-label={labels.gallery}>
      <div className={`grid gap-2 ${items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
        {items.map((it, i) => (
          <button key={i} type="button" aria-label={`${labels.open} ${i + 1}`} onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }} className="group relative block overflow-hidden rounded-lg bg-band text-left">
            <img src={it.src} alt={it.alt ?? ""} loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
            {it.caption && <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8 text-xs text-white">{it.caption}</span>}
          </button>))}
      </div>
      {cur && (
        <div role="dialog" aria-modal="true" aria-label={labels.gallery} className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)} onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - touch.current; if (Math.abs(d) > 50) go(d < 0 ? 1 : -1); }}>
          <div className="flex items-center justify-between p-3 text-sm"><span aria-live="polite">{open! + 1} / {items.length}</span>
            <button ref={closeBtn} type="button" onClick={() => setOpen(null)} aria-label={labels.close} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><X /></button></div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-12">
            {items.length > 1 && <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className="absolute left-1 grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><ChevronLeft /></button>}
            <img src={cur.src} alt={cur.alt ?? ""} className="max-h-full max-w-full rounded object-contain" />
            {items.length > 1 && <button type="button" onClick={() => go(1)} aria-label={labels.next} className="absolute right-1 grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><ChevronRight /></button>}
          </div>
          <p className="min-h-14 p-3 text-center text-sm">{[cur.caption, cur.credit].filter(Boolean).join(" — ")}</p>
        </div>)}
    </figure>
  );
}
