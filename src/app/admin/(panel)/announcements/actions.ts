"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { fromLocalInput } from "@/lib/time";
export async function setExpiry(f: FormData) {
  const u = await requirePerm("announcement.manage"); const id = Number(f.get("articleId")), at = String(f.get("expiresAt") ?? "");
  const exp = at ? fromLocalInput(at) : null; if (at && !exp) redirect("/admin/announcements?e=invalid");
  const a = await db.article.findFirst({ where: { id, format: "ANNOUNCEMENT" } }); if (!a) redirect("/admin/announcements?e=not_found");
  await db.article.update({ where: { id }, data: { expiresAt: exp } }); await logActivity(u.id, exp ? `announcement expiry set to ${exp.toISOString()}` : "announcement expiry cleared", id);
  redirect("/admin/announcements?ok=1");
}
