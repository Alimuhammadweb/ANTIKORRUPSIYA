import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { adminT } from "@/lib/admin-i18n";
import { allowedNext, STATUSES, type Status } from "@/lib/workflow";
import { StatusBadge, PageHead, AdminPager, Flash } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { fmtDateTime, loc, type L } from "@/lib/i18n";
import { changeStatus, deleteArticle } from "./actions";

const PER = 20, TABS = ["", "PUBLISHED", "DRAFT"] as const;
type SP = { q?: string; status?: string; page?: string; e?: string; ok?: string };
/** Posts: the one place for everything, whether it came from the admin panel or the Telegram bot. */
export default async function Articles({ searchParams }: { searchParams: Promise<SP> }) {
  const u = await requirePerm(); const { t, lang } = await adminT(); const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1), q = (sp.q ?? "").trim().slice(0, 100), status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : undefined;
  const where: Prisma.ArticleWhereInput = { ...(can(u, "article.editAny") ? {} : { authorId: u.id }), ...(status ? { status } : {}), ...(q ? { translations: { some: { OR: [{ title: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } } } : {}) };
  const [rows, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { translations: { select: { lang: true, title: true, slug: true } }, category: true, author: { select: { name: true } }, submission: { select: { id: true } } } }),
    db.article.count({ where }),
  ]);
  const tab = (s: string) => `/admin/articles?${new URLSearchParams({ ...(q ? { q } : {}), ...(s ? { status: s } : {}) })}`;
  return (
    <div>
      <PageHead title={t("nav_articles")} sub={t("posts_sub")}>{can(u, "article.create") && <Link href="/admin/articles/new"><Button variant="primary">{t("post_create_title")}</Button></Link>}</PageHead>
      <Flash sp={sp} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-1 rounded-full border border-rule bg-surface p-1 shadow-sm" role="group">{TABS.map((s) => <Link key={s} href={tab(s)} aria-current={(status ?? "") === s ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${(status ?? "") === s ? "bg-navy text-white dark:bg-accent dark:text-navy" : "text-mute hover:text-ink"}`}>{s ? t(`status_${s}`) : t("tab_all")}</Link>)}</div>
        <form className="ml-auto flex gap-2">{status && <input type="hidden" name="status" value={status} />}<Input name="q" defaultValue={q} placeholder={t("search_title")} aria-label={t("search_title")} className="w-64" /><Button>{t("filter")}</Button></form>
      </div>
      <div className="tbl-wrap">
        <table className="tbl"><thead><tr><th>{t("title")}</th><th>{t("status")}</th><th>{t("col_source")}</th><th>{t("category")}</th><th>{t("author")}</th><th>{t("updated")}</th><th /></tr></thead>
          <tbody>{rows.map((a) => {
            const tr = a.translations.find((x) => x.lang === "uz") ?? a.translations[0], title = tr?.title ?? `#${a.id}`, next = allowedNext(u, a), live = a.status === "PUBLISHED";
            const hid = (to: string) => <><input type="hidden" name="articleId" value={a.id} /><input type="hidden" name="to" value={to} /><input type="hidden" name="back" value="list" /></>;
            return (
              <tr key={a.id}><td className="max-w-sm p-2"><Link href={`/admin/articles/${a.id}`} className="font-semibold hover:underline">{title}</Link></td><td><StatusBadge s={a.status} /></td>
                <td>{a.submission ? <Badge tone="blue">{t("source_telegram")}</Badge> : <span className="text-xs text-mute">{t("source_admin")}</span>}</td>
                <td className="text-mute">{a.category ? loc(a.category.names, lang as L) : "—"}</td><td className="text-mute">{a.author?.name ?? "—"}</td><td className="text-xs text-mute">{fmtDateTime(a.updatedAt, lang as L)}</td>
                <td><div className="flex items-center justify-end gap-1.5">
                  <Link href={`/admin/articles/${a.id}`} className="inline-flex h-8 items-center rounded-lg border border-rule bg-surface px-3 text-xs font-semibold shadow-sm hover:bg-band">{t("edit")}</Link>
                  {live && tr && <Link href={`/${tr.lang}/article/${tr.slug}`} target="_blank" aria-label={t("post_view_site")} title={t("post_view_site")} className="grid size-8 place-items-center rounded-lg border border-rule bg-surface shadow-sm hover:bg-band"><ExternalLink className="size-3.5" aria-hidden /></Link>}
                  {!live && next.includes("PUBLISHED") && <form action={changeStatus}>{hid("PUBLISHED")}<SubmitButton size="sm" variant="primary">{t("post_publish")}</SubmitButton></form>}
                  {live && next.includes("DRAFT") && <form action={changeStatus}>{hid("DRAFT")}<ConfirmButton size="sm" variant="outline" title={t("post_unpublish")} message={t("confirm_unpublish")} confirmLabel={t("post_unpublish")}>{t("post_unpublish")}</ConfirmButton></form>}
                  {can(u, "article.delete") && <form action={deleteArticle}><input type="hidden" name="articleId" value={a.id} /><ConfirmButton size="sm" variant="danger" title={t("confirm_title_delete")} message={`${t("confirm_delete_post", { title })}${live ? `\n\n${t("confirm_delete_published")}` : ""}`}>{t("delete")}</ConfirmButton></form>}
                </div></td></tr>); })}
            {!rows.length && <tr><td colSpan={7} className="p-8 text-center text-mute">{t("no_articles")}</td></tr>}</tbody></table>
      </div>
      <AdminPager base="/admin/articles" params={{ q, status }} page={page} pages={Math.max(1, Math.ceil(total / PER))} prev={t("prev")} next={t("next")} />
    </div>
  );
}
