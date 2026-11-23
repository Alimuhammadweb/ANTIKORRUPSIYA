import Link from "next/link";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { fmtDateTime, LANGS, LABEL, type L } from "@/lib/i18n";
import { toLocalInput } from "@/lib/time";
import { Flash, PageHead } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { saveBreaking, toggleBreaking, deleteBreaking } from "./actions";

export default async function Breaking({ searchParams }: { searchParams: Promise<{ edit?: string; e?: string; ok?: string }> }) {
  await requirePerm("breaking.manage"); const { t, lang } = await adminT(); const sp = await searchParams, now = new Date();
  const [rows, arts] = await Promise.all([db.breakingNews.findMany({ orderBy: [{ lang: "asc" }, { sortOrder: "asc" }, { startsAt: "desc" }], include: { article: { select: { translations: { select: { title: true, lang: true } } } } } }),
    db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 60, include: { translations: { select: { title: true, lang: true } } } })]);
  const cur = rows.find((r) => r.id === Number(sp.edit));
  const live = (r: (typeof rows)[number]) => r.active && r.startsAt <= now && (!r.endsAt || r.endsAt > now);
  return (
    <div className="max-w-4xl">
      <PageHead title={t("nav_breaking")} />
      <Flash sp={sp} />
      <Card className="mb-6"><CardHeader>{cur ? t("edit") : t("breaking_new")}</CardHeader><CardBody>
        <form action={saveBreaking} className="grid gap-3 md:grid-cols-2"><input type="hidden" name="id" value={cur?.id ?? 0} />
          <Field label={t("text")} className="md:col-span-2"><Input name="text" required maxLength={240} defaultValue={cur?.text} /></Field>
          <Field label={t("language")}><Select name="lang" defaultValue={cur?.lang ?? lang}>{LANGS.map((l) => <option key={l} value={l}>{LABEL[l]}</option>)}</Select></Field>
          <Field label={t("related_article")}><Select name="articleId" defaultValue={cur?.articleId ?? ""}><option value="">—</option>{arts.map((a) => <option key={a.id} value={a.id}>{(a.translations[0]?.title ?? `#${a.id}`).slice(0, 70)} [{a.translations.map((x) => x.lang).join(",")}]</option>)}</Select></Field>
          <Field label={t("starts_at")}><Input type="datetime-local" name="startsAt" defaultValue={toLocalInput(cur?.startsAt ?? new Date())} /></Field>
          <Field label={t("ends_at")} hint={t("optional")}><Input type="datetime-local" name="endsAt" defaultValue={toLocalInput(cur?.endsAt)} /></Field>
          <Field label={t("display_order")}><Input type="number" name="sortOrder" min={0} defaultValue={cur?.sortOrder ?? 0} /></Field>
          <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" name="active" defaultChecked={cur?.active ?? true} />{t("active")}</label>
          <div className="flex gap-2 md:col-span-2"><Button variant="primary">{t("save")}</Button>{cur && <Link href="/admin/breaking" className="inline-flex h-10 items-center rounded-lg border border-rule bg-surface px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-band">{t("cancel")}</Link>}</div></form></CardBody></Card>
      {LANGS.map((l) => { const list = rows.filter((r) => r.lang === l), shown = list.filter(live); return (
        <Card key={l} className="mb-4"><CardHeader>{LABEL[l]}</CardHeader><CardBody>
          <div className="mb-3 overflow-hidden rounded-lg bg-breaking text-white" aria-label={t("ticker_preview")}>{shown.length ? <p className="flex gap-6 overflow-x-auto whitespace-nowrap px-3 py-1.5 text-sm"><strong>{t("breaking_label")}</strong>{shown.map((r) => <span key={r.id}>{r.text}</span>)}</p> : <p className="px-3 py-1.5 text-sm opacity-80">{t("ticker_hidden")}</p>}</div>
          <ul className="divide-y divide-rule text-sm">{list.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 py-2"><span className="min-w-0 flex-1"><span className="font-semibold">{r.text}</span><br /><span className="text-xs text-mute">#{r.sortOrder} · {fmtDateTime(r.startsAt, lang as L)}{r.endsAt ? ` → ${fmtDateTime(r.endsAt, lang as L)}` : ""}</span></span>
              <Badge tone={live(r) ? "green" : "gray"}>{live(r) ? t("live") : r.active ? t("not_live") : t("inactive")}</Badge>
              <Link href={`/admin/breaking?edit=${r.id}`} className="rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-band">{t("edit")}</Link>
              <form action={toggleBreaking}><input type="hidden" name="id" value={r.id} /><Button size="sm" variant="outline">{r.active ? t("deactivate") : t("activate")}</Button></form>
              <form action={deleteBreaking}><input type="hidden" name="id" value={r.id} /><ConfirmButton message={t("confirm_delete")} size="sm" variant="danger">{t("delete")}</ConfirmButton></form></li>))}
            {!list.length && <li className="py-2 text-mute">{t("nothing_yet")}</li>}</ul></CardBody></Card>); })}
    </div>
  );
}
