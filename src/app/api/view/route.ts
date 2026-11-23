import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visible } from "@/lib/visible";
import { limited } from "@/lib/ratelimit";
// Counts one view per browser per article per 30 minutes (cookie `v<id>` = "seen"; it holds no identity). Per-IP flood limit as a second guard.
// Bots that do not run JavaScript never call this endpoint. Only public articles count.
export async function POST(req: NextRequest) {
  const id = Number((await req.json().catch(() => ({}))).id);
  if (!Number.isInteger(id) || id < 1) return new NextResponse(null, { status: 400 });
  const name = `v${id}`;
  if (req.cookies.get(name)) return new NextResponse(null, { status: 204 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (await limited(`view:${ip}:${id}`, 5, 30 * 60_000)) return new NextResponse(null, { status: 204 });
  if (!(await db.article.findFirst({ where: { id, ...visible() }, select: { id: true } }))) return new NextResponse(null, { status: 404 });
  const day = new Date(new Date().toISOString().slice(0, 10));
  await db.$transaction([
    db.article.update({ where: { id }, data: { views: { increment: 1 } } }),
    db.articleView.upsert({ where: { articleId_day: { articleId: id, day } }, update: { count: { increment: 1 } }, create: { articleId: id, day, count: 1 } }),
  ]);
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(name, "1", { maxAge: 1800, httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  return res;
}
