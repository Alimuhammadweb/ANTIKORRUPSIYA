import { LANGS, type L } from "./i18n";
import { SITE_URL } from "./settings";
/** Canonical + hreflang alternates for a page that exists in every language under the same relative path. */
export const alternatesFor = (lang: L, rest: string) => ({ canonical: `${SITE_URL}/${lang}${rest}`, languages: { ...Object.fromEntries(LANGS.map((l) => [l === "uz" ? "uz-Cyrl" : l, `${SITE_URL}/${l}${rest}`])), "x-default": `${SITE_URL}/uz${rest}` } });
