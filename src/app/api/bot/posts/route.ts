// Contract for the Telegram bot (multipart/form-data). Header: Authorization: Bearer $BOT_API_SECRET
//  text (required) · title? · lang? (uz|en|ru, default uz) · category? (key of an ACTIVE category, see GET /api/bot/categories; an unknown or inactive key is refused with 422 "unknown_category") · tags? (comma-separated tag keys)
//  Idempotency-Key header? (retries return the same article; falls back to mg:<media_group_id>) · media_group_id? · cover_index? (default 0)
//  images: 0..n files in album order (JPEG/PNG/WebP)
// The post is saved to the database immediately and appears in Admin -> Posts (marked "Telegram"); there is no separate queue. It starts as a draft;
// set BOT_AUTO_PUBLISH=1 to publish bot posts straight away. Sending the same post twice never creates a second record (idempotency key, album id, or content fingerprint).
// Success: { ok: true, articleId, status: "DRAFT" | "PUBLISHED", published: boolean, images, duplicate? }  (201 for a new article, 200 with duplicate: true for a repeat)
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import type { Media } from "@prisma/client";
import { db } from "@/lib/db";
import { storeFile, removeMedia } from "@/lib/media";
import { botGate } from "@/lib/bot-auth";
import { cleanDoc } from "@/lib/blocks";
import { slugify } from "@/lib/slug";

const MAX_IMAGES = 10;
/** Response for a submission that already exists: the same article, with its real current status (so the bot never claims it is public when it is not). */
async function duplicateOf(key: string) {
  const dup = await db.telegramSubmission.findUnique({ where: { idempotencyKey: key }, select: { articleId: true, article: { select: { status: true } } } });
  return dup ? NextResponse.json({ ok: true, articleId: dup.articleId, duplicate: true, status: dup.article.status, published: dup.article.status === "PUBLISHED" }) : null;
}
export async function POST(req: NextRequest) {
  const denied = await botGate(req); if (denied) return denied;

  const f = await req.formData().catch(() => null); if (!f) return NextResponse.json({ error: "multipart body required" }, { status: 400 });
  const text = String(f.get("text") ?? "").trim().slice(0, 20000); if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  const lang = (["uz", "en", "ru"].includes(String(f.get("lang"))) ? String(f.get("lang")) : "uz") as "uz" | "en" | "ru";
  const group = f.get("media_group_id") ? String(f.get("media_group_id")).slice(0, 100) : null;
  const files = f.getAll("images").filter((x): x is File => typeof x !== "string" && x.size > 0).slice(0, MAX_IMAGES);
  let key: string | null = (req.headers.get("idempotency-key") || (group ? `mg:${group}` : "")).slice(0, 200) || null;
  if (!key) { // no key from the bot: fingerprint the content so an accidental resend is still recognised
    const h = createHash("sha256").update(`${lang}\n${text}`); for (const file of files) h.update(Buffer.from(await file.arrayBuffer()));
    key = `h:${h.digest("hex")}`;
  }
  if (key) { const dup = await duplicateOf(key); if (dup) return dup; }

  // Validate the category BEFORE any file is stored: a typo must never silently create an uncategorised article.
  const catKey = String(f.get("category") ?? "").trim();
  const cat = catKey ? await db.category.findFirst({ where: { key: catKey, active: true } }) : null;
  if (catKey && !cat) return NextResponse.json({ error: "unknown_category", message: `category "${catKey.slice(0, 80)}" does not exist or is not active` }, { status: 422 });

  const stored: Media[] = [];
  try {
    for (const file of files) { const m = await storeFile(file); if (m.kind !== "IMAGE") throw new Error(`not an image: ${file.name}`); stored.push(m); }
    const title = (String(f.get("title") ?? "").trim() || text.split("\n")[0]).slice(0, 200);
    const tags = await db.tag.findMany({ where: { key: { in: String(f.get("tags") ?? "").split(",").map((s) => s.trim()).filter(Boolean) } }, select: { id: true } });
    const publishNow = process.env.BOT_AUTO_PUBLISH === "1";
    const cover = stored[Math.min(Math.max(Number(f.get("cover_index")) || 0, 0), Math.max(stored.length - 1, 0))];
    const blocks = cleanDoc({ type: "doc", content: text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] })) });
    const article = await db.article.create({ data: {
      format: stored.length > 1 ? "PHOTO_NEWS" : "NEWS", status: publishNow ? "PUBLISHED" : "DRAFT", publishedAt: publishNow ? new Date() : null, categoryId: cat?.id, coverId: cover?.id, tags: { connect: tags },
      images: { create: stored.map((m, i) => ({ mediaId: m.id, position: i })) },
      translations: { create: { lang, title, slug: `${slugify(title) || "post"}-${randomUUID().slice(0, 6)}`, description: text.slice(0, 200), blocks: blocks as object } },
      submission: { create: { idempotencyKey: key, originalText: text, mediaGroupId: group, status: publishNow ? "PUBLISHED" : "RECEIVED" } } } });
    await db.activity.create({ data: { userId: null, action: `Telegram post saved (${stored.length} image(s))${publishNow ? ", published" : ""}`, articleId: article.id } });
    return NextResponse.json({ ok: true, articleId: article.id, images: stored.length, status: article.status, published: article.status === "PUBLISHED" }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002" && key) { // concurrent retry of the same submission: the winner already created it
      const dup = await duplicateOf(key); if (dup) return dup;
    }
    // roll back files only if nothing else (e.g. another submission with identical bytes) references them
    await Promise.all(stored.map(async (m) => { const used = (await db.articleImage.count({ where: { mediaId: m.id } })) + (await db.article.count({ where: { coverId: m.id } })); if (!used) await removeMedia(m).catch(() => {}); }));
    return NextResponse.json({ error: (e as Error).message }, { status: 422 }); // never reported as processed
  }
}
