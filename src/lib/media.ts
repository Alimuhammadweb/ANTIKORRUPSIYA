import { createHash, randomUUID } from "crypto";
import type { Media, MediaKind } from "@prisma/client";
import { db } from "./db";
import { mediaUrls } from "./blocks";

const MB = 1024 * 1024;
// Files are stored in PostgreSQL and uploaded through the application, so the limits are deliberately modest.
export const LIMIT: Record<MediaKind, number> = { IMAGE: 10 * MB, VIDEO: 50 * MB, DOCUMENT: 20 * MB };
export const ALLOWED: Record<string, { kind: MediaKind; ext: string }> = {
  "image/jpeg": { kind: "IMAGE", ext: "jpg" }, "image/png": { kind: "IMAGE", ext: "png" }, "image/webp": { kind: "IMAGE", ext: "webp" },
  "video/mp4": { kind: "VIDEO", ext: "mp4" }, "video/webm": { kind: "VIDEO", ext: "webm" }, "application/pdf": { kind: "DOCUMENT", ext: "pdf" },
};
/** Real content type from the first bytes. The declared type is never trusted. */
export function sniff(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length >= 12 && b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (b.length >= 8 && b.subarray(4, 8).toString() === "ftyp") return "video/mp4";
  if (b.length >= 4 && b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  if (b.length >= 5 && b.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  return null;
}
/** Pixel size of PNG, JPEG and WebP files, read from the file header. Null for other types or unreadable headers. */
export function imageSize(b: Buffer, mime: string): { width: number; height: number } | null {
  try {
    if (mime === "image/png" && b.length >= 24) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (mime === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xff) { i++; continue; }
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
      return null;
    }
    if (mime === "image/webp" && b.length >= 30) {
      const t = b.subarray(12, 16).toString();
      if (t === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
      if (t === "VP8L") { const v = b.readUInt32LE(21); return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 }; }
      if (t === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
  } catch { /* fall through */ }
  return null;
}
export const cleanName = (s: string) => s.replace(/[\u0000-\u001f\\/]+/g, "").trim().slice(0, 200) || "file";
/** Public URL of a stored file. The file itself is served from PostgreSQL by GET /api/media/[file]. */
export const mediaPath = (publicId: string, ext: string) => `/api/media/${publicId}.${ext}`;

export type Stored = { media: Media; reused: boolean };
/** The one way a file enters the library: validate on the server (real type from the bytes, size limit), store the bytes in PostgreSQL next to their metadata. Identical bytes are stored once. */
export async function storeBuffer(buf: Buffer, filename: string, userId?: number | null): Promise<Stored> {
  const mime = sniff(buf), t = mime ? ALLOWED[mime] : null;
  if (!mime || !t) throw new Error("unsupported_type");
  if (buf.length < 1) throw new Error("empty_file");
  if (buf.length > LIMIT[t.kind]) throw new Error("too_large");
  const sha = createHash("sha256").update(buf).digest("hex");
  const dup = await db.media.findUnique({ where: { sha256: sha } }); if (dup) return { media: dup, reused: true };
  const publicId = randomUUID(), dim = imageSize(buf, mime);
  try {
    const media = await db.media.create({ data: { publicId, path: mediaPath(publicId, t.ext), kind: t.kind, mime, size: buf.length, width: dim?.width, height: dim?.height, sha256: sha, filename: cleanName(filename), uploadedById: userId ?? null, file: { create: { data: buf as unknown as Uint8Array<ArrayBuffer> } } } });
    return { media, reused: false };
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") { const again = await db.media.findUnique({ where: { sha256: sha } }); if (again) return { media: again, reused: true }; } // concurrent upload of the same bytes
    throw e;
  }
}
/** Server-side store for a File (upload API, Telegram bot). */
export async function storeFile(file: File, userId?: number): Promise<Media> {
  const t = ALLOWED[file.type]; if (t && file.size > LIMIT[t.kind]) throw new Error("too_large"); // cheap early check before the bytes are read
  return (await storeBuffer(Buffer.from(await file.arrayBuffer()), file.name, userId)).media;
}
/** Deleting the row also deletes the bytes (cascade). Callers check usageOf() first. */
export async function removeMedia(m: Pick<Media, "id">) { await db.media.delete({ where: { id: m.id } }); }

export type Usage = { id: number; title: string; where: string; status: string }[];
/** Everything that references this file: covers, albums and links inside article bodies. */
export async function usageOf(m: Pick<Media, "id" | "path">): Promise<Usage> {
  const [covers, albums, bodies] = await Promise.all([
    db.article.findMany({ where: { coverId: m.id }, select: { id: true, status: true, translations: { select: { title: true }, take: 1 } } }),
    db.articleImage.findMany({ where: { mediaId: m.id }, select: { article: { select: { id: true, status: true, translations: { select: { title: true }, take: 1 } } } } }),
    db.$queryRaw<{ articleId: number; title: string; blocks: unknown; status: string }[]>`
      SELECT t."articleId", t."title", t."blocks", a."status"::text AS status FROM "Translation" t JOIN "Article" a ON a."id" = t."articleId" WHERE strpos(t."blocks"::text, ${m.path}) > 0`,
  ]);
  const r: Usage = [];
  covers.forEach((a) => r.push({ id: a.id, title: a.translations[0]?.title ?? `#${a.id}`, where: "cover", status: a.status }));
  albums.forEach(({ article: a }) => r.push({ id: a.id, title: a.translations[0]?.title ?? `#${a.id}`, where: "album", status: a.status }));
  bodies.filter((b) => mediaUrls(b.blocks).includes(m.path)).forEach((b) => r.push({ id: b.articleId, title: b.title, where: "body", status: b.status }));
  return r;
}
export const usageCount = async (m: Pick<Media, "id" | "path">) => (await usageOf(m)).length;
