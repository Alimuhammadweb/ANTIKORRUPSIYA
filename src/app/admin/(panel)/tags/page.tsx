import Link from "next/link";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { loc, LANGS, LABEL } from "@/lib/i18n";
import { Flash, PageHead } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { saveTag, deleteTag } from "./actions";

export default async function Tags({ searchParams }: { searchParams: Promise<{ q?: string; edit?: string; e?: string; ok?: string }> }) {
  await requirePerm("taxonomy.manage"); const { t, lang } = await adminT(); const sp = await searchParams, q = (sp.q ?? "").trim().slice(0, 80);
  const rows = await db.tag.findMany({ orderBy: { key: "asc" }, include: { _count: { select: { articles: true } } } });
  const shown = q ? rows.filter((r) => LANGS.some((l) => loc(r.names, l).toLowerCase().includes(q.toLowerCase())) || r.key.includes(q.toLowerCase())) : rows;
  const cur = rows.find((r) => r.id === Number(sp.edit)), g = (j: unknown, l: string) => ((j as Record<string, string>) ?? {})[l] ?? "";
  return (
    <div className="max-w-4xl"><PageHead title={t("nav_tags")} /><Flash sp={sp} />
      <Card className="mb-6"><CardHeader>{cur ? t("edit") : t("new_tag")}</CardHeader><CardBody>
        <form action={saveTag} className="space-y-3"><input type="hidden" name="id" value={cur?.id ?? 0} />
          <div className="grid gap-3 md:grid-cols-3">{LANGS.map((l) => <fieldset key={l} className="space-y-2 rounded-xl border border-rule p-3"><legend className="px-1 text-xs font-bold">{LABEL[l]}</legend>
            <Field label={t("name")}><Input name={`name_${l}`} required maxLength={80} defaultValue={g(cur?.names, l)} /></Field><Field label={t("slug")}><Input name={`slug_${l}`} maxLength={100} defaultValue={g(cur?.slugs, l)} /></Field></fieldset>)}</div>
          <div className="flex gap-2"><Button variant="primary">{t("save")}</Button>{cur && <Link href="/admin/tags" className="inline-flex h-10 items-center rounded-lg border border-rule bg-surface px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-band">{t("cancel")}</Link>}</div></form></CardBody></Card>
      <form className="mb-3 flex gap-2"><Input name="q" defaultValue={q} placeholder={t("search_tags")} aria-label={t("search_tags")} className="max-w-xs" /><Button>{t("search")}</Button></form>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>{t("name")}</th>{LANGS.map((l) => <th key={l} className="p-2">{LABEL[l]}</th>)}<th className="text-right">{t("usage")}</th><th /></tr></thead>
        <tbody>{shown.map((x) => <tr key={x.id}><td className="font-semibold">{loc(x.names, lang) || x.key}</td>{LANGS.map((l) => <td key={l} className="p-2 text-mute">{loc(x.names, l)}</td>)}<td className="text-right tabular-nums">{x._count.articles}</td>
          <td className="flex justify-end gap-2 p-2"><Link href={`/admin/tags?edit=${x.id}`} className="rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-band">{t("edit")}</Link><form action={deleteTag}><input type="hidden" name="id" value={x.id} /><ConfirmButton message={t("confirm_delete_tag", { n: x._count.articles })} size="sm" variant="danger">{t("delete")}</ConfirmButton></form></td></tr>)}
          {!shown.length && <tr><td colSpan={6} className="p-8 text-center text-mute">{t("no_tags")}</td></tr>}</tbody></table></div></div>
  );
}
