import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { fmtDate, fmtSize, type L } from "@/lib/i18n";
import { Flash, PageHead, AdminPager } from "@/components/admin/bits";
import { MediaUploadButton } from "@/components/admin/media-upload-button";
import { Thumb } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

const PER = 24;
export default async function Library({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; page?: string; e?: string; ok?: string }> }) {
  await requirePerm("media.upload"); const { t, lang } = await adminT(); const sp = await searchParams, q = (sp.q ?? "").trim().slice(0, 100), page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.MediaWhereInput = { ...(["IMAGE", "VIDEO", "DOCUMENT"].includes(sp.kind ?? "") ? { kind: sp.kind as "IMAGE" } : {}), ...(q ? { OR: ["filename", "caption", "alt", "credit"].map((f) => ({ [f]: { contains: q, mode: "insensitive" as const } })) } : {}) };
  const [items, total] = await Promise.all([db.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER }), db.media.count({ where })]);
  return (
    <div>
      <PageHead title={t("nav_media")}><MediaUploadButton /></PageHead><Flash sp={sp} />
      <form className="mb-5 flex flex-wrap gap-2 rounded-xl border border-rule bg-surface p-3 shadow-[var(--shadow-card)]"><Input name="q" defaultValue={q} placeholder={t("search_media")} aria-label={t("search_media")} className="max-w-xs" />
        <Select name="kind" defaultValue={sp.kind ?? ""} aria-label={t("media_type")} className="w-40"><option value="">{t("all_types")}</option>{["IMAGE", "VIDEO", "DOCUMENT"].map((k) => <option key={k} value={k}>{t(`kind_${k}`)}</option>)}</Select><Button>{t("filter")}</Button></form>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{items.map((m) => (
        <li key={m.id} className="overflow-hidden rounded-xl border border-rule bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"><Link href={`/admin/media/${m.id}`} className="block hover:bg-band"><Thumb m={m} className="aspect-square w-full" />
          <div className="p-2 text-xs"><p className="truncate font-semibold">{m.filename}</p><p className="text-mute">{t(`kind_${m.kind}`)} · {fmtSize(m.size)}</p><p className="text-mute">{fmtDate(m.createdAt, lang as L)}</p>{(m.alt || m.caption || m.credit) && <p className="truncate text-mute">{[m.alt, m.caption, m.credit].filter(Boolean).join(" · ")}</p>}</div></Link></li>))}
        {!items.length && <li className="col-span-full py-16 text-center text-mute">{t("no_media")}</li>}</ul>
      <AdminPager base="/admin/media" params={{ q, kind: sp.kind }} page={page} pages={Math.max(1, Math.ceil(total / PER))} prev={t("prev")} next={t("next")} />
    </div>
  );
}
