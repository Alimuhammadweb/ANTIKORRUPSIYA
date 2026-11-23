import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { loc, LANGS, LABEL } from "@/lib/i18n";
import { Flash, PageHead } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { saveSection, moveSection, addCategorySection, removeSection, addPick, removePick, movePick, ensureDefaults } from "./actions";

export default async function Homepage({ searchParams }: { searchParams: Promise<{ s?: string; q?: string; e?: string; ok?: string }> }) {
  await requirePerm("homepage.manage"); const { t, lang } = await adminT(); const sp = await searchParams, sid = Number(sp.s) || 0, q = (sp.q ?? "").trim().slice(0, 100);
  const [secs, cats, cands] = await Promise.all([
    db.homeSection.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { category: true, picks: { orderBy: { position: "asc" }, include: { article: { select: { id: true, status: true, translations: { select: { title: true }, take: 1 } } } } } } }),
    db.category.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    sid ? db.article.findMany({ where: { status: "PUBLISHED", ...(q ? { translations: { some: { title: { contains: q, mode: "insensitive" } } } } : {}) }, orderBy: { publishedAt: "desc" }, take: 8, include: { translations: { select: { title: true }, take: 1 } } }) : [],
  ]);
  const used = new Set(secs.flatMap((s) => (s.categoryId ? [s.categoryId] : [])));
  return (
    <div className="max-w-4xl">
      <PageHead title={t("nav_homepage")}>{LANGS.map((l) => <Link key={l} href={`/${l}`} target="_blank" className="rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-band">{t("preview")} {LABEL[l]}</Link>)}</PageHead>
      <p className="mb-4 text-sm text-mute">{t("homepage_help")}</p><Flash sp={sp} />
      {!secs.length && <form action={ensureDefaults} className="mb-4"><Button variant="primary">{t("create_default_sections")}</Button></form>}
      <div className="space-y-3">{secs.map((s, i) => (
        <Card key={s.id} className={s.enabled ? "" : "opacity-70"}>
          <CardHeader className="flex flex-wrap items-center gap-2"><span>{s.kind === "CATEGORY" ? `${t("home_CATEGORY")}: ${loc(s.category?.names, lang) || s.category?.key}` : t(`home_${s.kind}`)}</span>{!s.enabled && <Badge>{t("hidden")}</Badge>}
            <span className="ml-auto flex gap-1">
              <form action={moveSection}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><Button size="icon" variant="ghost" disabled={i === 0} aria-label={t("move_up")}><ArrowUp className="size-4" /></Button></form>
              <form action={moveSection}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><Button size="icon" variant="ghost" disabled={i === secs.length - 1} aria-label={t("move_down")}><ArrowDown className="size-4" /></Button></form>
              {s.kind === "CATEGORY" && <form action={removeSection}><input type="hidden" name="id" value={s.id} /><Button size="sm" variant="danger">{t("remove")}</Button></form>}</span></CardHeader>
          <CardBody className="space-y-3">
            <form action={saveSection} className="flex flex-wrap items-end gap-4 text-sm"><input type="hidden" name="id" value={s.id} />
              <label className="flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={s.enabled} />{t("show_section")}</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="manual" defaultChecked={s.manual} />{t("manual_picks")}</label>
              <label className="flex items-center gap-2">{t("how_many")}<Input type="number" name="count" min={1} max={24} defaultValue={s.count} className="w-20" /></label><Button size="sm">{t("save")}</Button></form>
            {s.manual && (<div>
              <ol className="space-y-1">{s.picks.map((p, k) => (
                <li key={p.id} className="flex items-center gap-2 rounded-lg border border-rule bg-surface p-2 text-sm"><span className="w-5 text-center font-semibold text-mute">{k + 1}</span><span className="min-w-0 flex-1 truncate">{p.article.translations[0]?.title ?? `#${p.article.id}`}</span>{p.article.status !== "PUBLISHED" && <Badge tone="amber">{t("not_public")}</Badge>}
                  <form action={movePick}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="up" /><button aria-label={t("move_up")} disabled={k === 0}><ArrowUp className="size-4" /></button></form>
                  <form action={movePick}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="down" /><button aria-label={t("move_down")} disabled={k === s.picks.length - 1}><ArrowDown className="size-4" /></button></form>
                  <form action={removePick}><input type="hidden" name="id" value={p.id} /><Button size="sm" variant="ghost">{t("remove")}</Button></form></li>))}</ol>
              {!s.picks.length && <p className="text-xs text-mute">{t("picks_empty")}</p>}
              <form className="mt-2 flex gap-2"><input type="hidden" name="s" value={s.id} /><Input name="q" defaultValue={sid === s.id ? q : ""} placeholder={t("search_title")} aria-label={t("search_title")} /><Button size="sm" variant="outline">{t("search")}</Button></form>
              {sid === s.id && <ul className="mt-2 divide-y divide-rule rounded-lg border border-rule">{cands.map((a) => <li key={a.id} className="flex items-center gap-2 p-1.5 text-sm"><span className="min-w-0 flex-1 truncate">{a.translations[0]?.title ?? `#${a.id}`}</span><form action={addPick}><input type="hidden" name="sectionId" value={s.id} /><input type="hidden" name="articleId" value={a.id} /><Button size="sm" variant="primary">{t("add")}</Button></form></li>)}{!cands.length && <li className="p-2 text-xs text-mute">{t("no_articles")}</li>}</ul>}</div>)}
          </CardBody></Card>))}</div>
      <Card className="mt-5"><CardHeader>{t("add_category_section")}</CardHeader><CardBody><form action={addCategorySection} className="flex gap-2"><Select name="categoryId" className="max-w-xs">{cats.filter((c) => !used.has(c.id)).map((c) => <option key={c.id} value={c.id}>{loc(c.names, lang) || c.key}</option>)}</Select><Button variant="primary">{t("add")}</Button></form></CardBody></Card>
    </div>
  );
}
