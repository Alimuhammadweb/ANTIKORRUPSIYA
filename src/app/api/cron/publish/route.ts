import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
// Publishes scheduled articles whose time has come. Vercel Cron calls this with "Authorization: Bearer $CRON_SECRET"; any scheduler can do the same.
// (The public site also treats a due SCHEDULED article as visible, so readers never wait for this job.)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const due = await db.article.findMany({ where: { status: "SCHEDULED", publishedAt: { lte: new Date() } }, select: { id: true } });
  for (const a of due) {
    const r = await db.article.updateMany({ where: { id: a.id, status: "SCHEDULED" }, data: { status: "PUBLISHED" } });
    if (r.count) { await db.telegramSubmission.updateMany({ where: { articleId: a.id }, data: { status: "PUBLISHED" } }); await logActivity(null, "scheduled publication: published automatically", a.id); }
  }
  return NextResponse.json({ published: due.length });
}
