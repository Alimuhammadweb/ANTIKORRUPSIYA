import { LANGS, type L } from "./i18n";
import { slugify } from "./slug";
export type Loc = Record<L, string>;
export const readLoc = (f: FormData, field: string, max = 200): Loc => Object.fromEntries(LANGS.map((l) => [l, String(f.get(`${field}_${l}`) ?? "").trim().slice(0, max)])) as Loc;
/** Localized slugs: typed value, else generated from the name. Returns null if any language ends up empty. */
export function buildSlugs(names: Loc, typed: Loc): Loc | null {
  const out = {} as Loc; for (const l of LANGS) { const s = slugify(typed[l] || names[l]); if (!s) return null; out[l] = s; } return out;
}
/** Is any slug already used by another item (in the same language) or equal to another item's key? */
export function slugClash(slugs: Loc, others: { key: string; slugs: unknown }[]): boolean {
  return others.some((o) => LANGS.some((l) => ((o.slugs as Partial<Loc> | null)?.[l] ?? o.key) === slugs[l]));
}
