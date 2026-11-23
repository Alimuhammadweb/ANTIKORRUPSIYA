"use client";
import { createContext, useContext, useMemo } from "react";
import type { L } from "@/lib/i18n";
import { DICT } from "@/lib/admin-dict";
type TFn = (k: string, vars?: Record<string, string | number>) => string;
const Ctx = createContext<{ t: TFn; lang: L }>({ t: (k) => k, lang: "en" });
export function AdminI18nProvider({ lang, children }: { lang: L; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: ((k, vars) => {
    let s = (DICT[lang] as Record<string, string>)[k] ?? (DICT.en as Record<string, string>)[k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, String(b));
    return s;
  }) as TFn }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);
