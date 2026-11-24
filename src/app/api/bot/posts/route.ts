// Contract for the Telegram bot (multipart/form-data). One language (Uzbek Cyrillic), one request, one published post.
// Headers: Authorization: Bearer $BOT_API_SECRET · X-Telegram-User-Id (must be listed in TELEGRAM_ADMIN_IDS on the server) · Idempotency-Key?
// Fields:  title (required) · text (required) · category? (key of an ACTIVE category, see GET /api/bot/categories; unknown -> 422 "unknown_category")
//          tags? (comma-separated tag keys) · media_group_id? · cover_index? (default 0) · images: 0..n files (JPEG/PNG/WebP)
// The post is saved as PUBLISHED with publishedAt = now and is publicly visible at once: there is no approval step.
// Sending the same post twice never creates a second record (idempotency key, album id, or content fingerprint).
// Success: { ok: true, articleId, status: "PUBLISHED", published: true, title, url, path, images, duplicate? }  (201 new, 200 with duplicate: true for a repeat)
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import type { Media } from "@prisma/client";
import { db } from "@/lib/db";
import { storeFile, removeMedia } from "@/lib/media";
import { botGate, telegramAdmin } from "@/lib/bot-auth";
import { cleanDoc } from "@/lib/blocks";
import { slugify } from "@/lib/slug";
import { SITE_URL } from "@/lib/settings";

const MAX_IMAGES = 10;
const view = (slug: string) => ({ path: `/uz/article/${slug}`, url: `${SITE_URL}/uz/article/${slug}` });
/** Response for a submission that already exists: the same article with its real current status and link. */
async function duplicateOf(key: string) {
  const dup = await db.telegramSubmission.findUnique({ where: { idempotencyKey: key }, select: { articleId: true, article: { select: { status: true, translations: { where: { lang: "uz" }, select: { title: true, slug: true }, take: 1 } } } } });
  if (!dup) return null;
  const tr = dup.article.translations[0];
  return NextResponse.json({ ok: true, articleId: dup.articleId, duplicate: true, status: dup.article.status, published: dup.article.status === "PUBLISHED", title: tr?.title ?? "", ...(tr ? view(tr.slug) : {}) });
}
export async function POST(req: NextRequest) {
  const denied = await botGate(req); if (denied) return denied;
  const admin = telegramAdmin(req); if (admin instanceof NextResponse) return admin;

  const f = await req.formData().catch(() => null); if (!f) return NextResponse.json({ error: "multipart body required" }, { status: 400 });
  const text = String(f.get("text") ?? "").trim().slice(0, 20000), title = String(f.get("title") ?? "").trim().slice(0, 200);
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  const group = f.get("media_group_id") ? String(f.get("media_group_id")).slice(0, 100) : null;
  const files = f.getAll("images").filter((x): x is File => typeof x !== "string" && x.size > 0).slice(0, MAX_IMAGES);
  let key: string | null = (req.headers.get("idempotency-key") || (group ? `mg:${group}` : "")).slice(0, 200) || null;
  if (!key) { // no key from the bot: fingerprint the content so an accidental resend is still recognised
    const h = createHash("sha256").update(`${title}\n${text}`); for (const file of files) h.update(Buffer.from(await file.arrayBuffer()));
    key = `h:${h.digest("hex")}`;
  }
  const dup = await duplicateOf(key); if (dup) return dup;

  // Validate the category BEFORE any file is stored: a typo must never silently create an uncategorised article.
  const catKey = String(f.get("category") ?? "").trim();
  const cat = catKey ? await db.category.findFirst({ where: { key: catKey, active: true } }) : null;
  if (catKey && !cat) return NextResponse.json({ error: "unknown_category", message: `category "${catKey.slice(0, 80)}" does not exist or is not active` }, { status: 422 });

  const stored: Media[] = [];
  try {
    for (const file of files) { const m = await storeFile(file); if (m.kind !== "IMAGE") throw new Error(`not an image: ${file.name}`); stored.push(m); }
    const tags = await db.tag.findMany({ where: { key: { in: String(f.get("tags") ?? "").split(",").map((s) => s.trim()).filter(Boolean) } }, select: { id: true } });
    const cover = stored[Math.min(Math.max(Number(f.get("cover_index")) || 0, 0), Math.max(stored.length - 1, 0))];
    const blocks = cleanDoc({ type: "doc", content: text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => ({ type: "paragraph", content: p.split("\n").flatMap((line, i) => [...(i ? [{ type: "hardBreak" }] : []), ...(line ? [{ type: "text", text: line }] : [])]) })) });
    const slug = `${slugify(title) || "post"}-${randomUUID().slice(0, 6)}`;
    const article = await db.article.create({ data: {
      format: stored.length > 1 ? "PHOTO_NEWS" : "NEWS", status: "PUBLISHED", publishedAt: new Date(), categoryId: cat?.id, coverId: cover?.id, tags: { connect: tags },
      images: { create: stored.map((m, i) => ({ mediaId: m.id, position: i })) },
      translations: { create: { lang: "uz", title, slug, description: text.replace(/\s+/g, " ").slice(0, 200), blocks: blocks as object } },
      submission: { create: { idempotencyKey: key, originalText: text, mediaGroupId: group, telegramUserId: admin.id, status: "PUBLISHED" } } } });
    await db.activity.create({ data: { userId: null, action: `Telegram post published by ${admin.id} (${stored.length} image(s))`, articleId: article.id } });
    return NextResponse.json({ ok: true, articleId: article.id, images: stored.length, status: article.status, published: true, title, ...view(slug) }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") { // concurrent retry of the same submission: the winner already created it
      const dup2 = await duplicateOf(key); if (dup2) return dup2;
    }
    // roll back files only if nothing else (e.g. another submission with identical bytes) references them
    await Promise.all(stored.map(async (m) => { const used = (await db.articleImage.count({ where: { mediaId: m.id } })) + (await db.article.count({ where: { coverId: m.id } })); if (!used) await removeMedia(m).catch(() => {}); }));
    return NextResponse.json({ error: (e as Error).message }, { status: 422 }); // never reported as processed
  }
}
