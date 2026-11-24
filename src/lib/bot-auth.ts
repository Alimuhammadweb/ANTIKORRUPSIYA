import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { limited } from "./ratelimit";

/**
 * Shared gate for every /api/bot/* route: rate limit per client IP, then a constant-time check of
 * "Authorization: Bearer $BOT_API_SECRET". Returns an error response to send back, or null when the caller may proceed.
 */
export async function botGate(req: NextRequest): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (await limited(`bot:${ip}`, 120, 60_000)) return NextResponse.json({ error: "rate limited" }, { status: 429, headers: { "Retry-After": "60" } });
  const given = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? ""), secret = Buffer.from(process.env.BOT_API_SECRET ?? "");
  if (!secret.length || given.length !== secret.length || !timingSafeEqual(given, secret)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
