"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Film, Upload, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useT } from "./i18n-client";
import { ACCEPT, uploadFile, type MediaDTO } from "../media-client";
import { fmtSize } from "@/lib/i18n";

type Kind = "IMAGE" | "VIDEO" | "DOCUMENT";
export const Thumb = ({ m, className = "" }: { m: Pick<MediaDTO, "kind" | "path" | "alt" | "filename">; className?: string }) =>
  m.kind === "IMAGE" ? <img src={m.path} alt={m.alt ?? ""} loading="lazy" className={`object-cover ${className}`} />
  : <div className={`grid place-items-center bg-band text-mute ${className}`}>{m.kind === "VIDEO" ? <Film className="size-8" /> : <FileText className="size-8" />}</div>;

/** Modal: search the media library, upload new files (stored in the database) or reuse existing ones. */
export function MediaPicker({ kind, multiple, onPick, onClose }: { kind?: Kind; multiple?: boolean; onPick: (m: MediaDTO[]) => void; onClose: () => void }) {
  const { t } = useT();
  const [items, setItems] = useState<MediaDTO[]>([]), [q, setQ] = useState(""), [page, setPage] = useState(1), [pages, setPages] = useState(1), [sel, setSel] = useState<MediaDTO[]>([]);
  const [busy, setBusy] = useState<{ name: string; p: number; err?: string }[]>([]), [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const load = useCallback(async (query: string, pg: number, append: boolean) => {
    const r = await fetch(`/api/admin/media?q=${encodeURIComponent(query)}&page=${pg}&limit=24${kind ? `&kind=${kind}` : ""}`);
    if (!r.ok) return setErr(t("err_load"));
    const d = await r.json(); setErr(""); setPages(d.pages); setItems((p) => (append ? [...p, ...d.items] : d.items));
  }, [kind, t]);
  useEffect(() => { const id = setTimeout(() => { setPage(1); load(q, 1, false); }, 250); return () => clearTimeout(id); }, [q, load]);
  const toggle = (m: MediaDTO) => (multiple ? setSel((s) => (s.some((x) => x.id === m.id) ? s.filter((x) => x.id !== m.id) : [...s, m])) : onPick([m]));
  async function upload(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const i = busy.length; setBusy((b) => [...b, { name: f.name, p: 0 }]);
      try {
        const { media } = await uploadFile(f, (p) => setBusy((b) => b.map((x, j) => (j === i ? { ...x, p } : x))));
        setItems((p) => [media, ...p.filter((x) => x.id !== media.id)]); if (multiple) setSel((s) => [...s, media]); else return onPick([media]);
      } catch (e) { setBusy((b) => b.map((x, j) => (j === i ? { ...x, err: t(`err_${(e as Error).message}`) } : x))); }
    }
  }
  return (
    <div role="dialog" aria-modal="true" aria-label={t("media_library")} className="fade-in fixed inset-0 z-[80] grid place-items-center bg-black/60 p-3 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-rule bg-surface text-ink shadow-2xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-rule p-3">
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_media")} className="min-w-0 flex-1" aria-label={t("search_media")} />
          <input ref={file} type="file" hidden multiple={multiple} accept={ACCEPT[kind ?? "ANY"]} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          <Button type="button" variant="primary" onClick={() => file.current?.click()}><Upload className="size-4" />{t("upload")}</Button>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t("close")}><X className="size-4" /></Button>
        </div>
        {busy.length > 0 && <ul className="border-b border-rule p-2 text-xs">{busy.map((b, i) => <li key={i} className={b.err ? "text-red-600" : "text-mute"}>{b.name}: {b.err ?? `${Math.round(b.p * 100)}%`}</li>)}</ul>}
        {err && <p role="alert" className="p-3 text-sm text-red-600">{err}</p>}
        <div className="grid flex-1 grid-cols-2 gap-2 overflow-auto p-3 sm:grid-cols-4 md:grid-cols-6">
          {items.map((m) => { const on = sel.some((x) => x.id === m.id); return (
            <button type="button" key={m.id} onClick={() => toggle(m)} title={m.filename} aria-pressed={on} className={`relative overflow-hidden rounded-lg text-left outline transition-shadow hover:shadow-md ${on ? "outline-[3px] outline-accent" : "outline-1 outline-rule"}`}>
              <Thumb m={m} className="aspect-square w-full" />
              {on && <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-accent text-navy"><Check className="size-3" /></span>}
              <span className="block truncate px-1 py-0.5 text-[11px] text-mute">{m.filename} · {fmtSize(m.size)}</span>
            </button>); })}
          {!items.length && <p className="col-span-full py-12 text-center text-mute">{t("no_media")}</p>}
        </div>
        <div className="flex items-center justify-between border-t border-rule p-3">
          {page < pages ? <Button type="button" variant="outline" onClick={() => { setPage(page + 1); load(q, page + 1, true); }}>{t("load_more")}</Button> : <span />}
          {multiple && <Button type="button" disabled={!sel.length} onClick={() => onPick(sel)}>{t("insert_n", { n: sel.length })}</Button>}
        </div>
      </div>
    </div>
  );
}
