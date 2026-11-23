const CYR: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h", і: "i", ї: "yi", є: "ye", ҷ: "j" };
const MARKS = new RegExp("[\\u0300-\\u036f]", "g");
/** URL slug from any title: Cyrillic is transliterated, so every slug is plain ASCII and safe in URLs. */
export function slugify(s: string, max = 80): string {
  const t = s.toLowerCase().replace(/[ʻʼ'’`]/g, "").split("").map((c) => (c in CYR ? CYR[c] : c)).join("").normalize("NFKD").replace(MARKS, "");
  return t.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/g, "");
}
/** Decode a dynamic route segment safely (it may arrive percent-encoded). */
export const dec = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
