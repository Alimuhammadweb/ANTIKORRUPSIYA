"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ICONS, type IconName } from "./nav-icons";
export type NavGroup = { label: string; items: { href: string; text: string; icon: IconName }[] };
/** Sidebar navigation with the current section highlighted. */
export function AdminNav({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const path = usePathname() ?? "", all = groups.flatMap((g) => g.items.map((i) => i.href));
  const on = (h: string) => path === h || (h !== "/admin" && path.startsWith(`${h}/`) && !all.some((o) => o !== h && o.length > h.length && (path === o || path.startsWith(`${o}/`))));
  return (
    <div className="space-y-5">{groups.map((g) => (
      <div key={g.label}><p className="mb-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-silver/60">{g.label}</p>
        <ul className="space-y-0.5">{g.items.map(({ href, text, icon }) => { const Icon = ICONS[icon], a = on(href); return (
          <li key={href}><Link href={href} onClick={onNavigate} aria-current={a ? "page" : undefined} className={`group relative flex items-center gap-3 rounded-lg px-3 py-[7px] text-[13.5px] font-medium transition-colors ${a ? "bg-white/10 text-white" : "text-silver hover:bg-white/5 hover:text-white"}`}>
            {a && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-accent" aria-hidden />}<Icon className={`size-[18px] shrink-0 ${a ? "text-accent" : "text-silver/70 group-hover:text-silver"}`} aria-hidden />{text}</Link></li>); })}</ul></div>))}</div>
  );
}
/** Mobile: hamburger + slide-in drawer holding the same navigation. */
export function AdminDrawer({ groups, label, close, footer }: { groups: NavGroup[]; label: string; close: string; footer: React.ReactNode }) {
  const [open, setOpen] = useState(false), path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); addEventListener("keydown", k); document.body.style.overflow = "hidden"; return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; }; }, [open]);
  return (
    <div className="lg:hidden">
      <button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg text-ink hover:bg-band"><Menu className="size-5" aria-hidden /></button>
      {open && <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" tabIndex={-1} aria-label={close} onClick={() => setOpen(false)} className="fade-in absolute inset-0 bg-black/60" />
        <div className="drawer relative flex h-full w-[min(19rem,88vw)] flex-col bg-navy text-white shadow-2xl">
          <div className="flex items-center justify-between px-4 py-4"><img src="/brand/logo.png" alt="ANTIKORRUPSIYA" className="h-8 w-auto" /><button type="button" aria-label={close} onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-white/10"><X className="size-5" aria-hidden /></button></div>
          <div className="flex-1 overflow-y-auto px-3 pb-4"><AdminNav groups={groups} /></div>
          <div className="border-t border-white/10 p-4">{footer}</div>
        </div></div>}
    </div>
  );
}
