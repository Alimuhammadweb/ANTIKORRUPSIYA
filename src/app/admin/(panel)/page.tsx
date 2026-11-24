import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { parseRange, viewsByDay, topArticles, topCategories, viewsByFormat } from "@/lib/analytics";
import { loc, type L } from "@/lib/i18n";
import { DailyChart, BarList } from "@/components/charts";
import { PageHead } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import Link from "next/link";

export default async function Analytics({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; days?: string }> }) {
  await requirePerm("analytics.view"); const { t, lang } = await adminT(); const sp = await searchParams;
  const preset = Number(sp.days) || 0, r = preset ? parseRange(undefined, undefined, preset) : parseRange(sp.from, sp.to, 30), ymd = (d: Date) => d.toISOString().slice(0, 10);
  const [daily, top, cats, fmts, life] = await Promise.all([viewsByDay(r), topArticles(r, 10), topCategories(r), viewsByFormat(r), db.article.aggregate({ _sum: { views: true }, _count: true })]);
  const total = daily.reduce((s, d) => s + d.views, 0), best = daily.reduce((m, d) => (d.views > m.views ? d : m), { day: "—", views: 0 });
  return (
    <div className="max-w-5xl"><PageHead title={t("nav_analytics")} />
      <form className="mb-5 flex flex-wrap items-end gap-2 rounded-xl border border-rule bg-surface p-3 text-sm font-medium shadow-[var(--shadow-card)]"><label>{t("from")}<Input type="date" name="from" defaultValue={ymd(r.from)} className="mt-1" /></label><label>{t("to")}<Input type="date" name="to" defaultValue={ymd(r.to)} className="mt-1" /></label><Button>{t("apply")}</Button>
        {[7, 30, 90].map((d) => <Link key={d} href={`/admin/analytics?days=${d}`} className="inline-flex h-10 items-center rounded-lg border border-rule bg-surface px-3 text-xs font-semibold shadow-sm transition-colors hover:bg-band">{t("last_days", { n: d })}</Link>)}</form>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{([["views_period", total], ["avg_daily", Math.round(total / Math.max(1, daily.length))], ["best_day", `${best.views} (${best.day})`], ["views_all_time", life._sum.views ?? 0]] as [string, string | number][]).map(([k, v]) => <div key={k} className="bg-paper p-4"><p className="text-xs text-mute">{t(k)}</p><p className="text-xl font-extrabold tabular-nums">{v}</p></div>)}</div>
      <Card className="mb-5"><CardHeader>{t("views_over_time")}</CardHeader><CardBody><DailyChart data={daily} label={t("views_over_time")} /></CardBody></Card>
      <div className="grid gap-5 md:grid-cols-2">
        <Card><CardHeader>{t("top_articles")}</CardHeader><CardBody>{top.length ? <BarList label={t("top_articles")} rows={top.map((a) => ({ label: a.title, value: a.views, href: `/admin/articles/${a.id}` }))} /> : <p className="text-sm text-mute">{t("nothing_yet")}</p>}</CardBody></Card>
        <Card><CardHeader>{t("top_categories")}</CardHeader><CardBody>{cats.length ? <BarList label={t("top_categories")} rows={cats.map((c) => ({ label: loc(c.names, lang as L) || c.key, value: c.views }))} /> : <p className="text-sm text-mute">{t("nothing_yet")}</p>}</CardBody></Card>
        <Card><CardHeader>{t("by_format")}</CardHeader><CardBody>{fmts.length ? <BarList label={t("by_format")} rows={fmts.map((f) => ({ label: t(`format_${f.format}`), value: f.views }))} /> : <p className="text-sm text-mute">{t("nothing_yet")}</p>}</CardBody></Card>
        <Card><CardHeader>{t("how_counted")}</CardHeader><CardBody><p className="text-sm text-mute">{t("analytics_note")}</p></CardBody></Card>
      </div>
    </div>
  );
}
