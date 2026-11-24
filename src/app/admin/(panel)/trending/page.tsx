import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { Flash, PageHead } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { addTrending, removeTrending, moveTrending } from "./actions";

export default async function Trending({ searchParams }: { searchParams: Promise<{ q?: string; e?: string; ok?: string }> }) {
  await requirePerm("trending.manage"); const { t } = await adminT(); const sp = await searchParams, q = (sp.q ?? "").trim().slice(0, 100);
  const [list, cands] = await Promise.all([
    db.article.findMany({ where: { trending: true }, orderBy: [{ trendingOrder: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }], include: { translations: { select: { title: true, lang: true } } } }),
    db.article.findMany({ where: { status: "PUBLISHED", trending: false, ...(q ? { translations: { some: { title: { contains: q, mode: "insensitive" } } } } : {}) }, orderBy: { publishedAt: "desc" }, take: 10, include: { translations: { select: { title: true }, take: 1 } } }),
  ]);
  const title = (a: (typeof list)[number]) => a.translations[0]?.title ?? `#${a.id}`;
  return (
    <div className="max-w-3xl">
      <PageHead title={t("nav_trending")}><Link href="/uz/trending" target="_blank" className="rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-band">{t("preview")}</Link></PageHead>
      <p className="mb-4 text-sm text-mute">{t("trending_help")}</p><Flash sp={sp} />
      <Card className="mb-6"><CardHeader>{t("trending_current", { n: list.length })}</CardHeader><CardBody>
        {!list.length && <p className="text-sm text-mute">{t("trending_empty")}</p>}
        <ol className="space-y-1">{list.map((a, i) => (
          <li key={a.id} className="flex items-center gap-2 rounded-lg border border-rule bg-surface p-2.5"><span className="w-6 text-center text-sm text-mute">{i + 1}</span><Link href={`/admin/articles/${a.id}`} className="min-w-0 flex-1 truncate hover:underline">{title(a)}</Link>
            <form action={moveTrending}><input type="hidden" name="articleId" value={a.id} /><input type="hidden" name="dir" value="up" /><Button size="icon" variant="ghost" disabled={i === 0} aria-label={t("move_up")}><ArrowUp className="size-4" /></Button></form>
            <form action={moveTrending}><input type="hidden" name="articleId" value={a.id} /><input type="hidden" name="dir" value="down" /><Button size="icon" variant="ghost" disabled={i === list.length - 1} aria-label={t("move_down")}><ArrowDown className="size-4" /></Button></form>
            <form action={removeTrending}><input type="hidden" name="articleId" value={a.id} /><Button size="sm" variant="danger">{t("remove")}</Button></form></li>))}</ol></CardBody></Card>
      <Card><CardHeader>{t("trending_add")}</CardHeader><CardBody>
        <form className="mb-3 flex gap-2"><Input name="q" defaultValue={q} placeholder={t("search_title")} aria-label={t("search_title")} /><Button>{t("search")}</Button></form>
        <ul className="divide-y divide-rule">{cands.map((a) => <li key={a.id} className="flex items-center gap-2 py-2"><span className="min-w-0 flex-1 truncate text-sm">{a.translations[0]?.title ?? `#${a.id}`}</span>
          <form action={addTrending}><input type="hidden" name="articleId" value={a.id} /><Button size="sm" variant="primary">{t("add")}</Button></form></li>)}{!cands.length && <li className="py-2 text-sm text-mute">{t("no_articles")}</li>}</ul></CardBody></Card>
    </div>
  );
}
