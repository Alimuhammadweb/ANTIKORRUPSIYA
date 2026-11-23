// One-time import for databases created before media moved into PostgreSQL.
// For every Media row that has no stored bytes yet, download the file from the URL it used to have, store the bytes in PostgreSQL,
// give it a new /api/media/<id>.<ext> URL and rewrite that URL everywhere it is referenced (Media.path and article bodies).
// Usage: npm run media:import   (needs DATABASE_URL and network access to the old file URLs; safe to run repeatedly)
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { ALLOWED, sniff, imageSize, mediaPath, LIMIT } from "../src/lib/media";

const db = new PrismaClient();
const SITE = (process.env.SITE_URL ?? "").replace(/\/$/, "");

async function main() {
  const rows = await db.media.findMany({ where: { file: null }, orderBy: { id: "asc" } });
  console.log(`${rows.length} file(s) to import`);
  let ok = 0, failed = 0;
  for (const m of rows) {
    const url = /^https?:\/\//i.test(m.path) ? m.path : `${SITE}${m.path}`;
    try {
      if (!/^https?:\/\//i.test(url)) throw new Error("no absolute URL (set SITE_URL for relative paths)");
      const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer()), mime = sniff(buf), t = mime ? ALLOWED[mime] : null;
      if (!mime || !t) throw new Error("unsupported content");
      if (buf.length > LIMIT[t.kind]) console.warn(`  #${m.id}: ${buf.length} bytes is above the current upload limit; imported anyway`);
      const sha = createHash("sha256").update(buf).digest("hex"), dim = imageSize(buf, mime), path = mediaPath(m.publicId, t.ext);
      const clash = await db.media.findFirst({ where: { sha256: sha, NOT: { id: m.id } }, select: { id: true } });
      await db.$transaction(async (tx) => {
        await tx.mediaFile.create({ data: { mediaId: m.id, data: buf } });
        await tx.media.update({ where: { id: m.id }, data: { path, mime, kind: t.kind, size: buf.length, width: dim?.width, height: dim?.height, sha256: clash ? null : sha } });
        // article bodies embed the file URL: point them at the new one
        await tx.$executeRaw`UPDATE "Translation" SET "blocks" = replace("blocks"::text, ${m.path}, ${path})::jsonb WHERE strpos("blocks"::text, ${m.path}) > 0`;
      });
      ok++; console.log(`  #${m.id} ${m.filename}: imported (${buf.length} bytes)`);
    } catch (e) { failed++; console.error(`  #${m.id} ${m.filename}: FAILED - ${(e as Error).message}`); }
  }
  console.log(`done: ${ok} imported, ${failed} failed${failed ? " (failed files keep their old URL; re-run after fixing)" : ""}`);
}
main().finally(() => db.$disconnect());
