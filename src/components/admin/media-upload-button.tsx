"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "./i18n-client";
import { ACCEPT, uploadFile } from "../media-client";

/** Library page uploader: several files, per-file progress, duplicates reused. */
export function MediaUploadButton() {
  const { t } = useT(), router = useRouter(), ref = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<{ name: string; p: number; msg?: string; err?: boolean }[]>([]);
  async function go(files: FileList | null) {
    if (!files) return; const base = rows.length;
    setRows((r) => [...r, ...Array.from(files).map((f) => ({ name: f.name, p: 0 }))]);
    for (const [i, f] of Array.from(files).entries()) {
      const set = (v: Partial<(typeof rows)[number]>) => setRows((r) => r.map((x, j) => (j === base + i ? { ...x, ...v } : x)));
      try { const { reused } = await uploadFile(f, (p) => set({ p })); set({ p: 1, msg: reused ? t("already_in_library") : t("uploaded") }); }
      catch (e) { set({ err: true, msg: t(`err_${(e as Error).message}`) }); }
    }
    router.refresh();
  }
  return (
    <div>
      <input ref={ref} type="file" multiple hidden accept={ACCEPT.ANY} onChange={(e) => { go(e.target.files); e.target.value = ""; }} />
      <Button type="button" variant="primary" onClick={() => ref.current?.click()}><Upload className="size-4" />{t("upload_files")}</Button>
      {rows.length > 0 && <ul className="mt-2 space-y-1 text-xs" aria-live="polite">{rows.map((r, i) => <li key={i} className={r.err ? "text-red-600" : "text-mute"}>{r.name}: {r.msg ?? `${Math.round(r.p * 100)}%`}</li>)}</ul>}
    </div>
  );
}
