"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LANGS, type L } from "@/lib/i18n";
import { useDropdown } from "./use-dropdown";

const NAME: Record<L, string> = { uz: "O‘zbekcha", ru: "Русский", en: "English" };
const ORDER: L[] = ["uz", "ru", "en"];
const Flag = ({ l }: { l: L }) => (
  <svg viewBox="0 0 30 20" className="h-[15px] w-[22px] shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/.12)]" aria-hidden preserveAspectRatio="none">
    {l === "uz" && <><rect width="30" height="20" fill="#fff" /><rect width="30" height="6.2" fill="#0099b5" /><rect y="13.8" width="30" height="6.2" fill="#1eb53a" /><rect y="6.2" width="30" height=".8" fill="#ce1126" /><rect y="13" width="30" height=".8" fill="#ce1126" /><circle cx="5.2" cy="3.1" r="1.9" fill="#fff" /><circle cx="6" cy="3.1" r="1.6" fill="#0099b5" /></>}
    {l === "ru" && <><rect width="30" height="20" fill="#fff" /><rect y="6.67" width="30" height="6.67" fill="#0039a6" /><rect y="13.33" width="30" height="6.67" fill="#d52b1e" /></>}
    {l === "en" && <><rect width="30" height="20" fill="#012169" /><path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="4" /><path d="M0 0 30 20M30 0 0 20" stroke="#c8102e" strokeWidth="1.6" /><path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6.5" /><path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3.6" /></>}
  </svg>
);
/** Language selector. `dropdown` (header): button + menu. `list` (mobile drawer): the three options in a row of buttons. Selecting a language reloads the same page in that language
 *  (the server maps article / category / tag URLs to the target language's own slug). */
export function LangSwitch({ lang, variant = "dropdown", compact, label = "Language" }: { lang: string; variant?: "dropdown" | "list"; compact?: boolean; label?: string }) {
  const p = usePathname(), sp = useSearchParams(), qs = sp.toString(), { open, setOpen, ref, onKeyDown, onBlur } = useDropdown();
  const cur = (LANGS as readonly string[]).includes(lang) ? (lang as L) : "uz";
  const href = (l: L) => `/api/switch?to=${l}&path=${encodeURIComponent(p)}${qs ? `&qs=${encodeURIComponent(qs)}` : ""}`;
  if (variant === "list") return (
    <div role="radiogroup" aria-label={label} className="grid gap-1.5">
      {ORDER.map((l) => <a key={l} href={href(l)} hrefLang={l} role="radio" aria-checked={l === cur} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition-colors ${l === cur ? "bg-white text-navy" : "bg-white/5 text-silver hover:bg-white/10 hover:text-white"}`}><Flag l={l} />{NAME[l]}{l === cur && <Check className="ml-auto size-4" aria-hidden />}</a>)}
    </div>
  );
  return (
    <div ref={ref} onKeyDown={onKeyDown} onBlur={onBlur} className="relative">
      <button type="button" data-trigger aria-haspopup="menu" aria-expanded={open} aria-label={`${label}: ${NAME[cur]}`} onClick={() => setOpen(!open)}
        className={`inline-flex h-8 items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] pl-3 pr-2.5 text-[14px] font-medium text-white transition-colors hover:border-white/30 hover:bg-white/15 ${open ? "!border-accent/70 bg-white/15" : ""}`}>
        <Globe className="size-4 text-white" aria-hidden />{compact ? cur.toUpperCase() : NAME[cur]}<ChevronDown className={`size-4 text-white transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label={label} className="menu-panel absolute right-0 top-full z-[60] mt-2 w-52 p-1.5">
          {ORDER.map((l) => <a key={l} href={href(l)} hrefLang={l} role="menuitemradio" aria-checked={l === cur} data-item className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${l === cur ? "bg-navy text-white dark:bg-white/10" : "text-ink hover:bg-band"}`}><Flag l={l} />{NAME[l]}{l === cur && <Check className="ml-auto size-4" aria-hidden />}</a>)}
        </div>)}
    </div>
  );
}
