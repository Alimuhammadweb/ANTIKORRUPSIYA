import { NextRequest, NextResponse } from "next/server";
import { apiUser } from "@/lib/auth";
import { storeFile } from "@/lib/media";
import { limited } from "@/lib/ratelimit";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";

// Upload API: the browser sends the file (multipart field "file") to the application, which validates it
// on the server and stores the bytes in PostgreSQL. Identical bytes are stored once and reused.
export async function POST(req: NextRequest) {
  const u = await apiUser("media.upload"); if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (await limited(`upload:${u.id}`, 120, 60_000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const f = await req.formData().catch(() => null), file = f?.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    const before = await db.media.count();
    const m = await storeFile(file, u.id), reused = (await db.media.count()) === before;
    if (!reused) await logActivity(u.id, `uploaded media ${m.filename}`);
    return NextResponse.json({ media: m, reused }, { status: reused ? 200 : 201 });
  } catch (e) {
    const code = (e as Error).message;
    return NextResponse.json({ error: ["unsupported_type", "empty_file", "too_large"].includes(code) ? code : "upload_failed" }, { status: ["too_large"].includes(code) ? 413 : 422 });
  }
}
