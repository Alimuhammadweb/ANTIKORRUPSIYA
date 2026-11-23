"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useT } from "./i18n-client";
import { MediaPicker, Thumb } from "./media-picker";
import type { MediaDTO } from "../media-client";

/** Cover image chooser. Submits coverId. */
export function CoverField({ initial }: { initial: MediaDTO | null }) {
  const { t } = useT(); const [m, setM] = useState(initial), [open, setOpen] = useState(false);
  return (
    <div>
      <input type="hidden" name="coverId" value={m?.id ?? ""} />
      {m ? <Thumb m={m} className="mb-3 aspect-[16/10] w-full rounded-lg" /> : <div className="mb-3 grid aspect-[16/10] place-items-center rounded-lg border border-dashed border-rule bg-band text-mute"><ImageIcon className="size-8" /></div>}
      <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>{m ? t("change") : t("choose_cover")}</Button>{m && <Button type="button" variant="ghost" size="sm" onClick={() => setM(null)}>{t("remove")}</Button>}</div>
      {open && <MediaPicker kind="IMAGE" onClose={() => setOpen(false)} onPick={([x]) => { setM(x); setOpen(false); }} />}
    </div>
  );
}
/** Ordered photo album (Telegram albums, photo stories). Submits albumIds in order. */
export function AlbumField({ initial }: { initial: MediaDTO[] }) {
  const { t } = useT(); const [list, setList] = useState(initial), [open, setOpen] = useState(false);
  const mv = (i: number, d: number) => setList((l) => { const n = [...l]; const j = i + d; if (j < 0 || j >= n.length) return l; [n[i], n[j]] = [n[j], n[i]]; return n; });
  return (
    <div>
      {list.map((m) => <input key={m.id} type="hidden" name="albumIds" value={m.id} />)}
      <ul className="mb-2 space-y-1">{list.map((m, i) => (
        <li key={m.id} className="flex items-center gap-2 rounded-lg border border-rule bg-surface p-1.5"><Thumb m={m} className="size-10 rounded" /><span className="min-w-0 flex-1 truncate text-xs">{m.filename}</span>
          <button type="button" aria-label={t("move_up")} onClick={() => mv(i, -1)}><ArrowUp className="size-4" /></button><button type="button" aria-label={t("move_down")} onClick={() => mv(i, 1)}><ArrowDown className="size-4" /></button>
          <button type="button" aria-label={t("remove")} onClick={() => setList((l) => l.filter((x) => x.id !== m.id))}><X className="size-4" /></button></li>))}</ul>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>{t("add_images")}</Button>
      {open && <MediaPicker kind="IMAGE" multiple onClose={() => setOpen(false)} onPick={(ms) => { setList((l) => [...l, ...ms.filter((x) => !l.some((y) => y.id === x.id))]); setOpen(false); }} />}
    </div>
  );
}
type TagOpt = { id: number; label: string; count?: number };
/** Searchable tag selection. Submits tagIds. */
export function TagPicker({ tags, initial }: { tags: TagOpt[]; initial: number[] }) {
  const { t } = useT(); const [sel, setSel] = useState<number[]>(initial), [q, setQ] = useState("");
  const shown = tags.filter((x) => x.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      {sel.map((id) => <input key={id} type="hidden" name="tagIds" value={id} />)}
      <div className="mb-2 flex flex-wrap gap-1">{sel.map((id) => { const g = tags.find((x) => x.id === id); return g ? <button type="button" key={id} onClick={() => setSel(sel.filter((x) => x !== id))} className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-ink">{g.label}<X className="size-3" /></button> : null; })}</div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_tags")} aria-label={t("search_tags")} />
      <ul className="mt-1.5 max-h-40 overflow-auto rounded-lg border border-rule">{shown.map((g) => (
        <li key={g.id}><label className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-band"><input type="checkbox" checked={sel.includes(g.id)} onChange={(e) => setSel(e.target.checked ? [...sel, g.id] : sel.filter((x) => x !== g.id))} />{g.label}</label></li>))}
        {!shown.length && <li className="px-2 py-2 text-xs text-mute">{t("no_tags")}</li>}</ul>
    </div>
  );
}
