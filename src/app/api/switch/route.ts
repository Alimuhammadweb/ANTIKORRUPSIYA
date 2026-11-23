import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { dec } from "@/lib/slug";
import { findCategory, findTag, slugOf } from "@/lib/queries";
import { isVisible } from "@/lib/visible";

// Language switch. Keeps the visitor on the same page:
//  article   -> the same article in the target language when a real translation exists, otherwise the original-language article under the new interface language
//  category / tag -> the same category / tag with the target language's slug
//  anything else  -> the same path in the target language
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams, to = q.get("to") ?? "", path = q.get("path") ?? "/", qs = q.get("qs");
  const go = (p: string) => { const r = NextResponse.redirect(new URL(p, req.url)); if (isLang(to)) r.cookies.set("site_lang", to, { path: "/", maxAge: 365 * 86400, sameSite: "lax" }); return r; }; // remembers the visitor's choice
  if (!isLang(to)) return go("/uz");
  const [, from, kind, raw] = path.split("/"), slug = raw ? dec(raw) : "";
  if (!isLang(from)) return go(`/${to}`);
  if (kind === "article" && slug) {
    const cur = await db.translation.findUnique({ where: { lang_slug: { lang: from, slug } }, include: { article: true } });
    if (!cur) return go(`/${to}`);
    const target = await db.translation.findUnique({ where: { articleId_lang: { articleId: cur.articleId, lang: to } }, include: { article: true } });
    if (target && isVisible(target.article)) return go(`/${to}/article/${target.slug}`);
    return go(`/${to}/article/${encodeURIComponent(cur.slug)}`); // no translation: the same article, shown in its original language
  }
  if ((kind === "category" || kind === "tag") && slug) {
    const item = kind === "category" ? await findCategory(from, slug) : await findTag(from, slug);
    return go(item ? `/${to}/${kind}/${encodeURIComponent(slugOf(item, to))}` : `/${to}`);
  }
  const rest = path.split("/").slice(2).join("/");
  return go(`/${to}${rest ? `/${rest}` : ""}${qs && kind === "search" ? `?${qs}` : ""}`);
}
