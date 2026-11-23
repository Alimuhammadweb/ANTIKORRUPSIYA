import Link from "next/link";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { fmtDateTime, type L } from "@/lib/i18n";
import { toLocalInput } from "@/lib/time";
import { Flash, PageHead, StatusBadge } from "@/components/admin/bits";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { setExpiry } from "./actions";

export default async function Announcements({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  await requirePerm("announcement.manage"); const { t, lang } = await adminT(); const sp = await searchParams, now = new Date();
  const rows = await db.article.findMany({ where: { format: "ANNOUNCEMENT" }, orderBy: { createdAt: "desc" }, take: 100, include: { translations: { select: { title: true, lang: true } } } });
  const state = (a: (typeof rows)[number]) => a.status !== "PUBLISHED" && a.status !== "SCHEDULED" ? null : a.expiresAt && a.expiresAt <= now ? "expired" : a.publishedAt && a.publishedAt > now ? "upcoming" : "active";
  return (
    <div>
      <PageHead title={t("nav_announcements")}><Link href="/admin/articles/new?format=ANNOUNCEMENT"><Button variant="primary">{t("new_announcement")}</Button></Link></PageHead>
      <p className="mb-4 text-sm text-mute">{t("announcements_help")}</p><Flash sp={sp} />
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>{t("title")}</th><th>{t("status")}</th><th>{t("announce_state")}</th><th>{t("published")}</th><th>{t("expires_at")}</th></tr></thead>
        <tbody>{rows.map((a) => { const s = state(a); return (
          <tr key={a.id}><td><Link href={`/admin/articles/${a.id}`} className="font-semibold hover:underline">{a.translations[0]?.title ?? `#${a.id}`}</Link></td><td><StatusBadge s={a.status} /></td>
            <td>{s ? <Badge tone={s === "active" ? "green" : s === "expired" ? "red" : "blue"}>{t(`ann_${s}`)}</Badge> : "—"}</td><td className="text-xs text-mute">{fmtDateTime(a.publishedAt, lang as L) || "—"}</td>
            <td><form action={setExpiry} className="flex gap-1"><input type="hidden" name="articleId" value={a.id} /><Input type="datetime-local" name="expiresAt" defaultValue={toLocalInput(a.expiresAt)} aria-label={t("expires_at")} className="w-52" /><Button size="sm" variant="outline">{t("save")}</Button></form></td></tr>); })}
          {!rows.length && <tr><td colSpan={5} className="p-8 text-center text-mute">{t("no_articles")}</td></tr>}</tbody></table></div>
    </div>
  );
}
