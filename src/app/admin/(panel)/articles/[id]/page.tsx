import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { adminT } from "@/lib/admin-i18n";
import { allowedNext, canEditArticle, canViewArticle, type Status } from "@/lib/workflow";
import { toDoc } from "@/lib/blocks";
import { toLocalInput } from "@/lib/time";
import { fmtDateTime, loc, LANGS, LABEL, isLang, type L } from "@/lib/i18n";
import { Editor } from "@/components/editor/editor";
import { CoverField, AlbumField, TagPicker } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { SubmitButton } from "@/components/admin/submit-button";
import { StatusBadge, Flash } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveArticle, changeStatus, deleteArticle } from "../actions";
import { addTrending, removeTrending } from "../../trending/actions";

const FORMATS = ["NEWS", "PHOTO_NEWS", "GALLERY", "INVESTIGATION", "VIDEO", "INTERVIEW", "ANNOUNCEMENT"];
type SP = { lang?: string; e?: string; ok?: string };
export default async function Edit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const u = await requirePerm("article.create"); const { t, lang: ui } = await adminT();
  const { id } = await params, sp = await searchParams;
  const a = id === "new" ? null : await db.article.findUnique({ where: { id: Number(id) || 0 }, include: { translations: true, tags: true, cover: true, submission: { select: { id: true } }, images: { orderBy: { position: "asc" }, include: { media: true } }, author: { select: { name: true } } } });
  if (id !== "new" && (!a || !canViewArticle(u, a))) notFound();
  // Posts are written once, normally in Uzbek: open the language the post already has. ?lang= is only used to add a real translation.
  const main = a?.translations.find((x) => x.lang === "uz") ?? a?.translations[0];
  const lang: L = isLang(sp.lang ?? "") ? (sp.lang as L) : ((main?.lang as L | undefined) ?? "uz");
  const editable = !a || canEditArticle(u, a), tr = a?.translations.find((x) => x.lang === lang);
  const [cats, tags, log] = await Promise.all([db.category.findMany({ orderBy: { order: "asc" } }), db.tag.findMany({ orderBy: { key: "asc" }, include: { _count: { select: { articles: true } } } }), a ? db.activity.findMany({ where: { articleId: a.id }, orderBy: { createdAt: "desc" }, take: 12, include: { user: true } }) : []]);
  const next = a ? allowedNext(u, a) : [], dto = (m: NonNullable<typeof a>["cover"]) => m && { id: m.id, path: m.path, kind: m.kind, mime: m.mime, size: m.size, filename: m.filename, alt: m.alt, caption: m.caption, credit: m.credit };
  const mayPublish = can(u, "article.publish") || !!u.canPublish, live = a?.status === "PUBLISHED";
  const hid = (to: string) => <><input type="hidden" name="articleId" value={a!.id} /><input type="hidden" name="lang" value={lang} /><input type="hidden" name="to" value={to} /></>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link href="/admin/articles" className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-ink"><ArrowLeft className="size-4" aria-hidden />{t("back_to_posts")}</Link>
        <h1 className="text-xl font-extrabold tracking-tight">{a ? t("post_edit_title") : t("post_create_title")}</h1>
        {a && <><StatusBadge s={a.status as Status} />{a.submission && <Badge tone="blue">{t("source_telegram")}</Badge>}<span className="text-xs text-mute">{t("by_author", { name: a.author?.name ?? "—" })}</span>
          <span className="ml-auto flex gap-2">
            {live && tr && <Link href={`/${lang}/article/${tr.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-band">{t("post_view_site")}<ExternalLink className="size-3.5" aria-hidden /></Link>}
            <Link href={`/admin/articles/${a.id}/preview?lang=${lang}`} target="_blank" className="inline-flex items-center rounded-lg border border-rule bg-surface px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-band">{t("preview")}</Link></span></>}
      </div>
      <Flash sp={sp} />
      {a?.status === "REJECTED" && a.reviewNote && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm"><strong>{t("rejected_note")}:</strong> {a.reviewNote}</p>}
      {!editable ? <p className="rounded-xl border border-rule bg-band p-4 text-sm">{t("read_only_article")}</p> : (
        <form action={saveArticle} className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <input type="hidden" name="articleId" value={a?.id ?? 0} /><input type="hidden" name="lang" value={lang} />
          <div className="min-w-0 space-y-3">
            <Input name="title" required maxLength={300} defaultValue={tr?.title} placeholder={t("headline")} aria-label={t("headline")} className="h-12 text-xl font-extrabold" />
            <Editor key={`${a?.id}-${lang}`} name="doc" initial={toDoc(tr?.blocks)} required />
            <Field label={t("summary_optional")}><Textarea name="description" rows={2} maxLength={800} defaultValue={tr?.description} /></Field>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card><CardBody className="space-y-3">
              {/* DOM order matters: pressing Enter in a text field triggers the FIRST submit button, which must be the harmless "save". */}
              <div className="flex flex-col-reverse gap-2">
                <SubmitButton name="intent" value="save" variant={live ? "primary" : "outline"} className="h-11 w-full">{a ? t("post_save_changes") : t("post_save_draft")}</SubmitButton>
                {!live && <SubmitButton name="intent" value="publish" variant="primary" className="h-11 w-full text-[15px]">{mayPublish ? t("post_publish") : t("post_submit_review")}</SubmitButton>}
              </div>
              <Field label={t("category")}><Select name="categoryId" defaultValue={a?.categoryId ?? ""}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{loc(c.names, ui) || c.key}</option>)}</Select></Field>
            </CardBody></Card>
            <Card><CardHeader>{t("cover")}</CardHeader><CardBody><CoverField initial={dto(a?.cover ?? null)} /></CardBody></Card>
            <details className="group rounded-xl border border-rule bg-surface shadow-[var(--shadow-card)]">
              <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-bold tracking-tight">{t("more_options")}</summary>
              <div className="space-y-4 border-t border-rule p-5">
                <Field label={t("format")}><Select name="format" defaultValue={a?.format ?? "NEWS"}>{FORMATS.map((f) => <option key={f} value={f}>{t(`format_${f}`)}</option>)}</Select></Field>
                <Field label={t("tags")}><TagPicker tags={tags.map((g) => ({ id: g.id, label: loc(g.names, ui) || g.key, count: g._count.articles }))} initial={a?.tags.map((g) => g.id) ?? []} /></Field>
                <Field label={t("album")}><AlbumField initial={(a?.images ?? []).map((i) => dto(i.media)!)} /></Field>
                <Field label={t("slug")} hint={t("slug_hint")}><Input name="slug" defaultValue={tr?.slug} maxLength={100} /></Field>
                <Field label={t("expires_at")} hint={t("expires_hint")}><Input type="datetime-local" name="expiresAt" defaultValue={toLocalInput(a?.expiresAt)} /></Field>
                <Field label={t("seo_title")}><Input name="seoTitle" maxLength={200} defaultValue={tr?.seoTitle ?? ""} /></Field>
                <Field label={t("seo_description")}><Input name="seoDescription" maxLength={400} defaultValue={tr?.seoDescription ?? ""} /></Field>
              </div>
            </details>
          </aside>
        </form>)}
      {a && (
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            {live && <Card><CardBody className="flex flex-wrap items-center gap-3"><form action={changeStatus}>{hid("DRAFT")}<ConfirmButton variant="outline" title={t("post_unpublish")} message={t("confirm_unpublish")} confirmLabel={t("post_unpublish")}>{t("post_unpublish")}</ConfirmButton></form></CardBody></Card>}
            {next.filter((to) => !(live && to === "DRAFT") && to !== "PUBLISHED").length > 0 || (!live && next.includes("PUBLISHED")) || (can(u, "trending.manage") && live) ? (
              <details className="rounded-xl border border-rule bg-surface shadow-[var(--shadow-card)]"><summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-bold tracking-tight">{t("more_publishing")}</summary>
                <div className="space-y-3 border-t border-rule p-5">
                  <div className="flex flex-wrap items-start gap-2">
                    {next.filter((to) => to !== "SCHEDULED" && to !== "REJECTED" && !(live && to === "DRAFT")).map((to) => (
                      <form key={to} action={changeStatus}>{hid(to)}<Button variant="outline">{t(`do_${to}`)}</Button></form>))}
                    {next.includes("REJECTED") && (
                      <form action={changeStatus} className="flex gap-2">{hid("REJECTED")}<Input name="note" placeholder={t("reject_reason")} aria-label={t("reject_reason")} className="w-56" /><Button variant="danger">{t("do_REJECTED")}</Button></form>)}
                    {next.includes("SCHEDULED") && (
                      <form action={changeStatus} className="flex gap-2">{hid("SCHEDULED")}<Input type="datetime-local" name="publishAt" required aria-label={t("publish_at")} className="w-56" /><Button variant="outline">{t("do_SCHEDULED")}</Button></form>)}
                  </div>
                  {a.status === "SCHEDULED" && <p className="text-sm text-mute">{t("scheduled_for", { date: fmtDateTime(a.publishedAt, ui) })}</p>}
                  {can(u, "trending.manage") && live && (
                    <form action={a.trending ? removeTrending : addTrending}><input type="hidden" name="articleId" value={a.id} /><input type="hidden" name="back" value={`/admin/articles/${a.id}?lang=${lang}`} />
                      <Button variant="outline">{a.trending ? t("remove_trending") : t("add_trending")}</Button></form>)}
                </div></details>) : null}
            {log.length > 0 && <details className="rounded-xl border border-rule bg-surface shadow-[var(--shadow-card)]"><summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-bold tracking-tight">{t("article_history")}</summary><ul className="divide-y divide-rule border-t border-rule px-5 text-sm">{log.map((l) => <li key={l.id} className="flex justify-between gap-3 py-1.5"><span>{l.user?.name ?? t("system")}: {l.action}</span><span className="shrink-0 text-xs text-mute">{fmtDateTime(l.createdAt, ui)}</span></li>)}</ul></details>}
            <details className="rounded-xl border border-rule bg-surface shadow-[var(--shadow-card)]"><summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-bold tracking-tight">{t("other_languages")}</summary>
              <div className="space-y-2 border-t border-rule p-5 text-sm"><p className="text-mute">{t("other_languages_hint")}</p>
                <div className="flex flex-wrap gap-2">{LANGS.filter((l) => l !== lang).map((l) => <Link key={l} href={`/admin/articles/${a.id}?lang=${l}`} className="rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-band">{a.translations.some((x) => x.lang === l) ? t("edit_translation", { lang: LABEL[l] }) : t("add_translation", { lang: LABEL[l] })}</Link>)}</div></div></details>
          </div>
          {can(u, "article.delete") && (
            <Card className="self-start"><CardHeader>{t("danger_zone")}</CardHeader><CardBody>
              <form action={deleteArticle}><input type="hidden" name="articleId" value={a.id} />
                <ConfirmButton variant="danger" className="w-full" title={t("confirm_title_delete")} message={`${t("confirm_delete_post", { title: tr?.title ?? main?.title ?? `#${a.id}` })}${live ? `\n\n${t("confirm_delete_published")}` : ""}`}>{t("delete")}</ConfirmButton></form>
            </CardBody></Card>)}
        </div>)}
    </div>
  );
}
