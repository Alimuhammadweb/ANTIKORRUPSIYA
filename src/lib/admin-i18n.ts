import type { L } from "./i18n";
import { DICT, type AKey } from "./admin-dict";
export { type AKey };
export const ADMIN_LANG_COOKIE = "alang";
/** The admin panel is Uzbek Cyrillic only (DICT.uz). */
export async function adminLang(): Promise<L> { return "uz"; }
export type TFn = (k: AKey | (string & {}), vars?: Record<string, string | number>) => string;
export const makeT = (lang: L): TFn => (k, vars) => {
  let s = (DICT[lang] as Record<string, string>)[k] ?? (DICT.en as Record<string, string>)[k] ?? k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, String(b));
  return s;
};
/** Server-side translator for the admin panel (language comes from the staff member's cookie). */
export async function adminT() { const lang = await adminLang(); return { lang, t: makeT(lang) }; }
