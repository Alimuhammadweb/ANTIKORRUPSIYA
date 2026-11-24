// Categories the Telegram bot may offer to the administrator. Header: Authorization: Bearer $BOT_API_SECRET
//   GET /api/bot/categories[?lang=uz|en|ru]
//   -> { ok: true, categories: [{ id, key, order, name, slug, names: {uz,en,ru}, slugs: {uz,en,ru} }] }
// Only ACTIVE categories are returned (inactive ones are rejected by POST /api/bot/posts), in the same order as the site shows them.
// `key` is the stable value the bot must send as the `category` field. `name` / `slug` are in the requested language (default uz).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { botGate } from "@/lib/bot-auth";
import { isLang, loc, type L } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await botGate(req); if (denied) return denied;
  const asked = req.nextUrl.searchParams.get("lang") ?? "uz", lang: L = isLang(asked) ? asked : "uz";
  const rows = await db.category.findMany({ where: { active: true }, orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true, key: true, order: true, names: true, slugs: true } });
  const categories = rows.map((c) => ({
    id: c.id, key: c.key, order: c.order,
    name: loc(c.names, lang) || c.key, slug: loc(c.slugs, lang) || c.key,
    names: { uz: loc(c.names, "uz"), en: loc(c.names, "en"), ru: loc(c.names, "ru") },
    slugs: { uz: loc(c.slugs, "uz"), en: loc(c.slugs, "en"), ru: loc(c.slugs, "ru") },
  }));
  return NextResponse.json({ ok: true, categories }, { headers: { "Cache-Control": "no-store" } });
}
