import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ALLOWED } from "@/lib/media";

// Serves a stored file straight from PostgreSQL. Only the exact, unguessable URL of a file works (/api/media/<uuid>.<ext>);
// the content type comes from the type validated at upload (never from the request), and ranges are supported for video.
const NAME = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp|mp4|webm|pdf)$/;
export async function GET(req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const m = NAME.exec((await params).file); if (!m) return new NextResponse(null, { status: 404 });
  const media = await db.media.findUnique({ where: { publicId: m[1] }, select: { id: true, mime: true, size: true, sha256: true, filename: true, createdAt: true } });
  if (!media || ALLOWED[media.mime]?.ext !== m[2]) return new NextResponse(null, { status: 404 });

  const etag = `"${media.sha256 ?? `${media.id}-${media.createdAt.getTime()}`}"`;
  const headers: Record<string, string> = {
    "Content-Type": media.mime, "Accept-Ranges": "bytes", ETag: etag, "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(media.filename || "file")}`,
    ...(media.mime === "application/pdf" ? {} : { "Content-Security-Policy": "default-src 'none'; sandbox" }),
  };
  if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": headers["Cache-Control"] } });

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, media.size - Number(range[2]));
    let end = range[1] && range[2] ? Number(range[2]) : media.size - 1;
    end = Math.min(end, media.size - 1);
    if (start > end || start >= media.size) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${media.size}` } });
    const rows = await db.$queryRaw<{ chunk: Uint8Array }[]>`SELECT substring("data" from ${start + 1}::int for ${end - start + 1}::int) AS chunk FROM "MediaFile" WHERE "mediaId" = ${media.id}`;
    if (!rows[0]) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(rows[0].chunk), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${media.size}`, "Content-Length": String(end - start + 1) } });
  }
  const f = await db.mediaFile.findUnique({ where: { mediaId: media.id } });
  if (!f) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(f.data), { headers: { ...headers, "Content-Length": String(f.data.length) } });
}
