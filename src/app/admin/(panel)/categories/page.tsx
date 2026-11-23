import Link from "next/link";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { loc, LANGS, LABEL } from "@/lib/i18n";
import { Flash, PageHead } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { saveCategory, deleteCategory } from "./actions";

export default async function Categories({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string; e?: string; ok?: string }> }) {
  await requirePerm("taxonomy.manage"); const { t, lang } = await adminT(); const sp = await searchParams;
  const rows = await db.category.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }], include: { _count: { select: { articles: true } } } });
  const cur = rows.find((r) => r.id === Number(sp.edit)), form = cur || sp.new;
  const g = (j: unknown, l: string) => ((j as Record<string, string>) ?? {})[l] ?? "";
  return (
    <div className="max-w-4xl">
      <PageHead title={t("nav_categories")}><Link href="/admin/categories?new=1"><Button variant="primary">{t("new_category")}</Button></Link></PageHead><Flash sp={sp} />
      {form && (
        <Card className="mb-6"><CardHeader>{cur ? t("edit") : t("new_category")}</CardHeader><CardBody>
          <form action={saveCategory} className="space-y-4"><input type="hidden" name="id" value={cur?.id ?? 0} />
            {!cur && <Field label={t("key")} hint={t("key_hint")}><Input name="key" maxLength={60} className="max-w-xs" /></Field>}
            <div className="grid gap-4 md:grid-cols-3">{LANGS.map((l) => (
              <fieldset key={l} className="space-y-2 rounded-xl border border-rule p-3"><legend className="px-1 text-xs font-bold">{LABEL[l]}</legend>
                <Field label={t("name")}><Input name={`name_${l}`} required maxLength={120} defaultValue={g(cur?.names, l)} /></Field>
                <Field label={t("slug")}><Input name={`slug_${l}`} maxLength={100} defaultValue={g(cur?.slugs, l)} /></Field>
                <Field label={t("description")}><Textarea name={`desc_${l}`} rows={3} maxLength={600} defaultValue={g(cur?.descriptions, l)} /></Field></fieldset>))}</div>
            <div className="flex flex-wrap items-center gap-4"><Field label={t("display_order")}><Input type="number" name="order" min={0} defaultValue={cur?.order ?? rows.length} className="w-28" /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={cur?.active ?? true} />{t("active")}</label></div>
            <div className="flex gap-2"><Button variant="primary">{t("save")}</Button><Link href="/admin/categories" className="inline-flex h-10 items-center rounded-lg border border-rule bg-surface px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-band">{t("cancel")}</Link></div></form></CardBody></Card>)}
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>#</th><th>{t("name")}</th><th>{t("key")}</th><th>{t("status")}</th><th className="text-right">{t("nav_articles")}</th><th /></tr></thead>
        <tbody>{rows.map((c) => (
          <tr key={c.id}><td className="text-mute">{c.order}</td><td className="font-semibold">{loc(c.names, lang) || c.key}</td><td className="text-mute">{c.key}</td><td><Badge tone={c.active ? "green" : "gray"}>{c.active ? t("active") : t("inactive")}</Badge></td><td className="text-right tabular-nums">{c._count.articles}</td>
            <td className="flex justify-end gap-2 p-2"><Link href={`/admin/categories?edit=${c.id}`} className="rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-band">{t("edit")}</Link>
              <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={t("confirm_delete")} size="sm" variant="danger" disabled={c._count.articles > 0} title={c._count.articles ? t("err_category_in_use") : undefined}>{t("delete")}</ConfirmButton></form></td></tr>))}</tbody></table></div>
    </div>
  );
}
