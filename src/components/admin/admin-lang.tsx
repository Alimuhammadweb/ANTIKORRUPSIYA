"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { LANGS, LABEL } from "@/lib/i18n";
import { setAdminLang } from "@/app/admin/lang-action";
import { useT } from "./i18n-client";
export function AdminLangSwitch({ onDark }: { onDark?: boolean }) {
  const p = usePathname(), sp = useSearchParams(), { lang } = useT();
  const back = `${p}${sp.size ? `?${sp}` : ""}`;
  return (
    <form action={setAdminLang} className={`inline-flex gap-0.5 rounded-lg p-0.5 ${onDark ? "bg-white/10" : "bg-band"}`}>
      <input type="hidden" name="back" value={back} />
      {LANGS.map((l) => <button key={l} name="lang" value={l} aria-pressed={l === lang} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${l === lang ? (onDark ? "bg-white text-navy" : "bg-surface text-ink shadow-sm") : (onDark ? "text-silver hover:text-white" : "text-mute hover:text-ink")}`}>{LABEL[l]}</button>)}
    </form>
  );
}
