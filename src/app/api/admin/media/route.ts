import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
// Media library listing for the picker dialogs and the library grid (search + type filter + paging).
export async function GET(req: NextRequest) {
  if (!(await apiUser())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams, q = (sp.get("q") ?? "").slice(0, 100), kind = sp.get("kind"), page = Math.max(1, Number(sp.get("page")) || 1), take = Math.min(60, Number(sp.get("limit")) || 24);
  const where: Prisma.MediaWhereInput = { ...(["IMAGE", "VIDEO", "DOCUMENT"].includes(kind ?? "") ? { kind: kind as "IMAGE" } : {}),
    ...(q ? { OR: ["filename", "caption", "alt", "credit"].map((f) => ({ [f]: { contains: q, mode: "insensitive" as const } })) } : {}) };
  const [items, total] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take, select: { id: true, path: true, alt: true, caption: true, credit: true, filename: true, kind: true, mime: true, size: true, createdAt: true } }),
    db.media.count({ where }),
  ]);
  return NextResponse.json({ items, total, pages: Math.max(1, Math.ceil(total / take)) });
}
