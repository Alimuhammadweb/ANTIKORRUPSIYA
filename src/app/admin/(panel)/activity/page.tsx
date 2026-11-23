import Link from "next/link";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { fmtDateTime, type L } from "@/lib/i18n";
import { PageHead, AdminPager } from "@/components/admin/bits";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const PER = 40;
export default async function Activity({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePerm("article.review"); const { t, lang } = await adminT(); const sp = await searchParams, q = (sp.q ?? "").trim().slice(0, 80), page = Math.max(1, Number(sp.page) || 1);
  const where = q ? { OR: [{ action: { contains: q, mode: "insensitive" as const } }, { user: { name: { contains: q, mode: "insensitive" as const } } }] } : {};
  const [rows, total] = await Promise.all([db.activity.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { user: { select: { name: true } } } }), db.activity.count({ where })]);
  return (
    <div className="max-w-4xl"><PageHead title={t("nav_activity")} />
      <form className="mb-4 flex gap-2"><Input name="q" defaultValue={q} placeholder={t("search")} aria-label={t("search")} className="max-w-xs" /><Button>{t("filter")}</Button></form>
      <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface text-sm shadow-[var(--shadow-card)]">{rows.map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2 p-2"><span><strong>{l.user?.name ?? t("system")}</strong>: {l.articleId ? <Link href={`/admin/articles/${l.articleId}`} className="hover:underline">{l.action}</Link> : l.action}</span><span className="text-xs text-mute">{fmtDateTime(l.createdAt, lang as L)}</span></li>)}{!rows.length && <li className="p-8 text-center text-mute">{t("nothing_yet")}</li>}</ul>
      <AdminPager base="/admin/activity" params={{ q }} page={page} pages={Math.max(1, Math.ceil(total / PER))} prev={t("prev")} next={t("next")} /></div>
  );
}
