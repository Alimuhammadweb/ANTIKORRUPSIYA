"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home, Menu, Search, X } from "lucide-react";
type Lk = { href: string; text: string };
/** Full-height slide-in menu for small screens: search, sections, a Categories accordion, language and theme. Escape / outside tap closes; focus stays inside while open. */
export function MobileNav({ home, links, cats, allHref, labels, searchAction, children }: { home: string; links: Lk[]; cats: Lk[]; allHref: string; labels: { menu: string; close: string; sections: string; categories: string; all: string; search: string; searchPh: string; language: string }; searchAction: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false), [cat, setCat] = useState(false), panel = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null), path = usePathname() ?? "";
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow, opener = btn.current; document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("[data-close]")?.focus();
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab" || !panel.current) return;
      const els = [...panel.current.querySelectorAll<HTMLElement>("a[href],button,input")].filter((x) => x.offsetParent !== null), a = els[0], z = els[els.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    addEventListener("keydown", k);
    return () => { removeEventListener("keydown", k); document.body.style.overflow = prev; opener?.focus(); };
  }, [open]);
  const on = (h: string) => (h === home ? path === h : path === h || path.startsWith(`${h}/`));
  const row = (a: boolean) => `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[16px] font-semibold transition-colors ${a ? "bg-brand text-white" : "text-white/90 hover:bg-white/10"}`;
  return (
    <div className="lg:hidden">
      <button ref={btn} type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={labels.menu} onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full text-white transition-colors hover:bg-white/10"><Menu className="size-6" aria-hidden /></button>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={labels.menu} id="mobile-menu">
          <button type="button" aria-label={labels.close} tabIndex={-1} onClick={() => setOpen(false)} className="fade-in absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <div ref={panel} className="drawer relative flex h-full w-[min(22rem,92vw)] flex-col overflow-y-auto bg-night text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <Link href={home} aria-label="ANTIKORRUPSIYA"><img src="/brand/logo.png" alt="ANTIKORRUPSIYA" className="h-8 w-auto" /></Link>
              <button type="button" data-close onClick={() => setOpen(false)} aria-label={labels.close} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><X className="size-6" aria-hidden /></button>
            </div>
            <form action={searchAction} role="search" className="px-4 pt-4"><label className="relative block"><span className="sr-only">{labels.search}</span><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-silver" aria-hidden />
              <input name="q" placeholder={labels.searchPh} className="h-11 w-full rounded-full border border-white/15 bg-white/10 pl-10 pr-4 text-[15px] text-white placeholder:text-silver/80 focus-visible:border-accent focus-visible:outline-none" /></label></form>
            <nav aria-label={labels.sections} className="space-y-1 px-3 py-4">
              {links.map((l) => <Link key={l.href} href={l.href} aria-current={on(l.href) ? "page" : undefined} className={row(on(l.href))}>{l.href === home && <Home className="size-5" aria-hidden />}{l.text}</Link>)}
              <button type="button" aria-expanded={cat} aria-controls="m-cats" onClick={() => setCat(!cat)} className={row(false)}>{labels.categories}<ChevronDown className={`ml-auto size-5 transition-transform ${cat ? "rotate-180" : ""}`} aria-hidden /></button>
              {cat && <div id="m-cats" className="ml-3 space-y-0.5 border-l border-white/15 pl-3">{cats.map((c) => <Link key={c.href} href={c.href} className="block rounded-lg px-3 py-2.5 text-[15px] text-silver transition-colors hover:bg-white/10 hover:text-white">{c.text}</Link>)}<Link href={allHref} className="block rounded-lg px-3 py-2.5 text-[15px] font-bold text-accent hover:bg-white/10">{labels.all} →</Link></div>}
            </nav>
            <div className="mt-auto space-y-3 border-t border-white/10 px-4 py-4"><p className="kicker kicker-dark">{labels.language}</p>{children}</div>
          </div>
        </div>)}
    </div>
  );
}
