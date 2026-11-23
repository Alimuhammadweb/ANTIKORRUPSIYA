import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { adminT } from "@/lib/admin-i18n";
import { usageOf } from "@/lib/media";
import { fmtDateTime, fmtSize, type L } from "@/lib/i18n";
import { Flash, PageHead, StatusBadge } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { updateMedia, deleteMedia } from "../actions";

export default async function MediaItem({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string; ok?: string }> }) {
  const u = await requirePerm("media.upload"); const { t, lang } = await adminT(); const sp = await searchParams;
  const m = await db.media.findUnique({ where: { id: Number((await params).id) || 0 }, include: { uploadedBy: { select: { name: true } } } }); if (!m) notFound();
  const use = await usageOf(m), canEdit = can(u, "media.editAny") || m.uploadedById === u.id;
  return (
    <div className="max-w-4xl">
      <PageHead title={m.filename}><Link href="/admin/media" className="text-sm underline">← {t("nav_media")}</Link></PageHead><Flash sp={sp} />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-rule bg-band p-2">{m.kind === "IMAGE" ? <img src={m.path} alt={m.alt ?? ""} className="max-h-[28rem] w-full object-contain" /> : m.kind === "VIDEO" ? <video src={m.path} controls className="w-full" /> : <a href={m.path} target="_blank" rel="noopener noreferrer" className="block p-10 text-center underline">{t("open_file")}</a>}</div>
        <div className="space-y-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm"><dt className="text-mute">{t("media_type")}</dt><dd>{t(`kind_${m.kind}`)} ({m.mime})</dd><dt className="text-mute">{t("size")}</dt><dd>{fmtSize(m.size)}</dd><dt className="text-mute">{t("uploaded")}</dt><dd>{fmtDateTime(m.createdAt, lang as L)}{m.uploadedBy && ` · ${m.uploadedBy.name}`}</dd><dt className="text-mute">URL</dt><dd className="break-all"><a href={m.path} target="_blank" rel="noopener noreferrer" className="underline">{m.path}</a></dd></dl>
          {canEdit ? (
            <form action={updateMedia} className="space-y-3"><input type="hidden" name="id" value={m.id} />
              <Field label={t("filename")}><Input name="filename" defaultValue={m.filename} maxLength={200} /></Field><Field label={t("alt_text")}><Input name="alt" defaultValue={m.alt ?? ""} maxLength={300} /></Field>
              <Field label={t("caption")}><Input name="caption" defaultValue={m.caption ?? ""} maxLength={500} /></Field><Field label={t("credit")}><Input name="credit" defaultValue={m.credit ?? ""} maxLength={200} /></Field><Button variant="primary">{t("save")}</Button></form>) : <p className="text-sm text-mute">{t("read_only_media")}</p>}
        </div>
      </div>
      <Card className="mt-6"><CardHeader>{t("used_in", { n: use.length })}</CardHeader><CardBody>
        {!use.length ? <p className="text-sm text-mute">{t("not_used")}</p> : <ul className="divide-y divide-rule text-sm">{use.map((r, i) => <li key={i} className="flex items-center gap-3 py-2"><Link href={`/admin/articles/${r.id}`} className="min-w-0 flex-1 truncate hover:underline">{r.title}</Link><span className="text-xs text-mute">{t(`use_${r.where}`)}</span><StatusBadge s={r.status as "DRAFT"} /></li>)}</ul>}
        {use.length > 0 && <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm">{t("delete_blocked")}</p>}
        {can(u, "media.delete") && !use.length && <form action={deleteMedia} className="mt-3"><input type="hidden" name="id" value={m.id} /><ConfirmButton message={t("confirm_delete_media")} variant="danger">{t("delete")}</ConfirmButton></form>}</CardBody></Card>
    </div>
  );
}
