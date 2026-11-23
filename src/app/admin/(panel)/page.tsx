import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { adminT } from "@/lib/admin-i18n";
import { viewsByDay, parseRange } from "@/lib/analytics";
import { DailyChart } from "@/components/charts";
import { PageHead } from "@/components/admin/bits";
import { FileText, Eye, FilePen, Hourglass, CalendarClock, Newspaper } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { fmtDateTime, type L } from "@/lib/i18n";

export default async function Dashboard() {
  const u = await requirePerm(); const { t, lang } = await adminT();
  const scope: Prisma.ArticleWhereInput = can(u, "article.editAny") ? {} : { authorId: u.id }; // journalists see their own numbers
  const wide = can(u, "article.editAny"), range = parseRange(undefined, undefined, 30);
  const [total, published, drafts, pending, scheduled, views, top, recent, log, daily] = await Promise.all([
    db.article.count({ where: scope }), db.article.count({ where: { ...scope, status: "PUBLISHED" } }), db.article.count({ where: { ...scope, status: "DRAFT" } }),
    db.article.count({ where: { ...scope, status: "PENDING" } }), db.article.count({ where: { ...scope, status: "SCHEDULED" } }),
    db.article.aggregate({ where: scope, _sum: { views: true } }),
    db.article.findMany({ where: { ...scope, status: "PUBLISHED" }, orderBy: { views: "desc" }, take: 5, include: { translations: { take: 1, orderBy: { lang: "desc" } } } }),
    db.article.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 5, include: { translations: { take: 1, orderBy: { lang: "desc" } } } }),
    db.activity.findMany({ where: wide ? {} : { userId: u.id }, orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
    viewsByDay(range),
  ]);
  const sum = (n: number) => daily.slice(-n).reduce((s, r) => s + r.views, 0);
  const stats = [["stat_total", total, FileText, "text-sky-600 bg-sky-500/10"], ["stat_published", published, Newspaper, "text-emerald-600 bg-emerald-500/10"], ["stat_drafts", drafts, FilePen, "text-slate-500 bg-slate-500/10"], ["stat_pending", pending, Hourglass, "text-amber-600 bg-amber-500/10"], ["stat_scheduled", scheduled, CalendarClock, "text-violet-600 bg-violet-500/10"], ["stat_views", views._sum.views ?? 0, Eye, "text-accent-ink bg-accent/15"]] as const;
  return (
    <div className="space-y-6">
      <PageHead title={t("welcome_back", { name: u.name.split(" ")[0] })} sub={t("nav_dashboard")} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{stats.map(([k, v, Icon, tone]) => (
        <div key={k} className="rounded-xl border border-rule bg-surface p-4 shadow-[var(--shadow-card)]"><span className={`grid size-9 place-items-center rounded-lg ${tone}`}><Icon className="size-[18px]" aria-hidden /></span><p className="mt-4 text-2xl font-extrabold tabular-nums tracking-tight">{v.toLocaleString("ru-RU")}</p><p className="mt-0.5 text-xs font-medium text-mute">{t(k)}</p></div>))}</div>
      {wide && (
        <Card><CardHeader>{t("views_30d")}</CardHeader><CardBody>
          <p className="mb-3 text-sm text-mute">{t("views_summary", { d1: sum(1), d7: sum(7), d30: sum(30) })}</p><DailyChart data={daily} label={t("views_30d")} /></CardBody></Card>)}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card><CardHeader>{t("most_viewed")}</CardHeader><CardBody><Rows empty={t("nothing_yet")} rows={top.map((a) => ({ k: a.id, href: `/admin/articles/${a.id}`, text: a.translations[0]?.title ?? `#${a.id}`, meta: String(a.views) }))} /></CardBody></Card>
        <Card><CardHeader>{t("latest_posts")}</CardHeader><CardBody><Rows empty={t("nothing_yet")} rows={recent.map((a) => ({ k: a.id, href: `/admin/articles/${a.id}`, text: a.translations[0]?.title ?? `#${a.id}`, meta: t(`status_${a.status}`) }))} /></CardBody></Card>
        <Card><CardHeader>{t("recent_activity")}</CardHeader><CardBody><Rows empty={t("nothing_yet")} rows={log.map((l) => ({ k: l.id, href: l.articleId ? `/admin/articles/${l.articleId}` : undefined, text: `${l.user?.name ?? t("system")}: ${l.action}`, meta: fmtDateTime(l.createdAt, lang as L) }))} /></CardBody></Card>
      </div>
      {wide && <p className="text-sm"><Link href="/admin/analytics" className="font-semibold text-accent-ink hover:underline">{t("nav_analytics")} →</Link></p>}
    </div>
  );
}
function Rows({ rows, empty }: { rows: { k: number; href?: string; text: string; meta: string }[]; empty: string }) {
  if (!rows.length) return <p className="py-4 text-center text-sm text-mute">{empty}</p>;
  return <ul className="-my-2 divide-y divide-rule text-sm">{rows.map((r) => <li key={r.k} className="flex justify-between gap-3 py-2.5">{r.href ? <Link href={r.href} className="min-w-0 truncate font-medium hover:text-accent-ink hover:underline">{r.text}</Link> : <span className="min-w-0 truncate">{r.text}</span>}<span className="shrink-0 text-xs tabular-nums text-mute">{r.meta}</span></li>)}</ul>;
}
