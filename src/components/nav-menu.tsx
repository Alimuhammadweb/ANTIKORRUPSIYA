"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home } from "lucide-react";
import { useDropdown } from "./use-dropdown";
type Lk = { href: string; text: string };
/** Desktop primary navigation: section links + a working Categories dropdown. The current section is shown as a blue pill. */
export function NavMenu({ links, home, cats, categoriesLabel, allLabel, allHref }: { links: Lk[]; home: string; cats: Lk[]; categoriesLabel: string; allLabel: string; allHref: string }) {
  const path = usePathname() ?? "", { open, setOpen, ref, onKeyDown, onBlur } = useDropdown();
  const on = (h: string) => (h === home ? path === h : path === h || path.startsWith(`${h}/`));
  const catOn = path.startsWith(`${home}/category`) || path === allHref;
  const pill = (a: boolean) => `inline-flex h-[2.65rem] items-center gap-2.5 rounded-lg px-[1.15rem] text-[16px] font-medium transition-colors ${a ? "bg-brand text-white shadow-[0_4px_14px_-4px_rgb(20_86_214/.7)]" : "text-white hover:bg-white/10"}`;
  return (
    <ul className="flex items-center gap-[1.1rem]">
      {links.map((l) => <li key={l.href}><Link href={l.href} aria-current={on(l.href) ? "page" : undefined} className={pill(on(l.href))}>{l.href === home && <Home className="size-[18px]" aria-hidden />}{l.text}</Link></li>)}
      <li><div ref={ref} onKeyDown={onKeyDown} onBlur={onBlur} className="relative">
        <button type="button" data-trigger aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className={pill(catOn || open) + (open && !catOn ? " !bg-white/10" : "")}>{categoriesLabel}<ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden /></button>
        {open && (
          <div role="menu" aria-label={categoriesLabel} className="menu-panel absolute left-0 top-full z-[60] mt-2 w-[26rem] max-w-[90vw] p-2">
            <div className="grid max-h-[60vh] grid-cols-2 gap-0.5 overflow-y-auto">{cats.map((c) => <Link key={c.href} href={c.href} role="menuitem" data-item className="rounded-lg px-3 py-2.5 text-sm font-semibold outline-none transition-colors hover:bg-band hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-accent">{c.text}</Link>)}</div>
            <Link href={allHref} role="menuitem" data-item className="mt-1 flex items-center justify-between rounded-lg border-t border-rule px-3 pb-2 pt-3 text-sm font-bold text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent">{allLabel} <span aria-hidden>→</span></Link>
          </div>)}
      </div></li>
      <li aria-hidden className="ml-1 hidden h-6 w-px bg-white/25 xl:block" />
    </ul>
  );
}
