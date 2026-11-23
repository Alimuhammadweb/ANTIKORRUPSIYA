"use client";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2, ImageIcon, Minus, Images, Video, FileText, Table2, ArrowUp, ArrowDown, X, Plus } from "lucide-react";
import { ImageBlock, GalleryBlock, VideoBlock, DocumentBlock } from "./nodes";
import { MediaPicker } from "../admin/media-picker";
import { useT } from "../admin/i18n-client";
import { Input } from "../ui/field";
import { Button } from "../ui/button";
import { parseVideoUrl } from "@/lib/embed";
import { safeUrl, docHasContent } from "@/lib/blocks";
import type { MediaDTO } from "../media-client";

type Dlg = null | "image" | "gallery" | "video-lib" | "document" | "gallery-add";
const item = (m: MediaDTO) => ({ mediaId: m.id, src: m.path, alt: m.alt ?? "", caption: m.caption ?? "", credit: m.credit ?? "" });

export function Editor({ name, initial, required }: { name: string; initial: object; required?: boolean }) {
  const { t } = useT();
  const [json, setJson] = useState(JSON.stringify(initial)), [dlg, setDlg] = useState<Dlg>(null), [linkOpen, setLink] = useState<string | null>(null), [videoUrl, setVideoUrl] = useState<string | null>(null), [verr, setVerr] = useState("");
  const ed = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] } }), Link.configure({ openOnClick: false }), ImageBlock, GalleryBlock, VideoBlock, DocumentBlock, Table.configure({ resizable: false }), TableRow, TableHeader, TableCell],
    content: initial, immediatelyRender: false,
    onUpdate: ({ editor }) => setJson(JSON.stringify(editor.getJSON())),
    editorProps: { attributes: { class: "doc ed min-h-[28rem] px-5 py-4 outline-none", "aria-label": t("article_body") } },
  });
  // Until the editor is ready the field still carries the current content, so a quick submit can never wipe the body.
  if (!ed) return <div className="rounded-xl border border-rule bg-surface"><input type="hidden" name={name} value={json} /><div className="min-h-[30rem]" aria-busy="true" /></div>;
  const filled = docHasContent(JSON.parse(json));
  const c = () => ed.chain().focus();
  const ins = (content: object) => c().insertContent(content).run();
  const B = ({ on, Icon, label, active }: { on: () => void; Icon: typeof Bold; label: string; active?: boolean }) =>
    <button type="button" aria-label={label} title={label} aria-pressed={active} onClick={on} className={`grid size-8 place-items-center rounded-md transition-colors ${active ? "bg-navy text-white dark:bg-accent dark:text-navy" : "text-mute hover:bg-band hover:text-ink"}`}><Icon className="size-4" /></button>;
  const sel = ed.state.selection, node = sel instanceof NodeSelection ? sel.node : null, nt = node?.type.name;
  const set = (type: string, attrs: object) => ed.chain().focus().updateAttributes(type, attrs).run();
  const inTable = ed.isActive("table");
  const TB = ({ on, label }: { on: () => void; label: string }) => <button type="button" onClick={on} className="rounded-md border border-rule bg-surface px-2.5 py-1 text-xs font-semibold hover:bg-band">{label}</button>;
  return (
    <div className="relative rounded-xl border border-rule bg-surface shadow-[var(--shadow-card)] focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/15">
      <input type="hidden" name={name} value={json} />
      {required && <input aria-hidden tabIndex={-1} required value={filled ? "1" : ""} onChange={() => {}} ref={(el) => el?.setCustomValidity(filled ? "" : t("err_body_required"))} className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0" />}
      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-rule bg-surface/95 p-1.5 backdrop-blur" role="toolbar" aria-label={t("editor_toolbar")}>
        <B label={t("bold")} Icon={Bold} active={ed.isActive("bold")} on={() => c().toggleBold().run()} />
        <B label={t("italic")} Icon={Italic} active={ed.isActive("italic")} on={() => c().toggleItalic().run()} />
        <B label={t("heading")} Icon={Heading2} active={ed.isActive("heading", { level: 2 })} on={() => c().toggleHeading({ level: 2 }).run()} />
        <B label={t("subheading")} Icon={Heading3} active={ed.isActive("heading", { level: 3 })} on={() => c().toggleHeading({ level: 3 }).run()} />
        <B label={t("bullet_list")} Icon={List} active={ed.isActive("bulletList")} on={() => c().toggleBulletList().run()} />
        <B label={t("numbered_list")} Icon={ListOrdered} active={ed.isActive("orderedList")} on={() => c().toggleOrderedList().run()} />
        <B label={t("quote")} Icon={Quote} active={ed.isActive("blockquote")} on={() => c().toggleBlockquote().run()} />
        <B label={t("divider")} Icon={Minus} on={() => c().setHorizontalRule().run()} />
        <B label={t("link")} Icon={Link2} active={ed.isActive("link")} on={() => setLink(ed.getAttributes("link").href ?? "https://")} />
        <span className="mx-1.5 h-5 w-px bg-rule" />
        <B label={t("insert_image")} Icon={ImageIcon} on={() => setDlg("image")} />
        <B label={t("insert_gallery")} Icon={Images} on={() => setDlg("gallery")} />
        <B label={t("insert_video")} Icon={Video} on={() => { setVideoUrl(""); setVerr(""); }} />
        <B label={t("insert_document")} Icon={FileText} on={() => setDlg("document")} />
        <B label={t("insert_table")} Icon={Table2} on={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
      </div>
      {linkOpen !== null && (
        <div className="flex gap-2 border-b border-rule p-2"><Input value={linkOpen} onChange={(e) => setLink(e.target.value)} placeholder="https://…" aria-label={t("link")} />
          <Button type="button" size="sm" onClick={() => { const u = safeUrl(linkOpen); if (!linkOpen) c().unsetLink().run(); else if (u) c().extendMarkRange("link").setLink({ href: u }).run(); setLink(null); }}>OK</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { c().unsetLink().run(); setLink(null); }}>{t("remove")}</Button></div>)}
      {videoUrl !== null && (
        <div className="space-y-2 border-b border-rule p-2">
          <div className="flex flex-wrap gap-2"><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={t("video_url_ph")} aria-label={t("video_url")} className="min-w-0 flex-1" />
            <Button type="button" size="sm" onClick={() => { const v = parseVideoUrl(videoUrl); if (!v) return setVerr(t("err_video_url")); ins({ type: "video", attrs: { src: v.src, provider: v.provider, embed: v.embed } }); setVideoUrl(null); }}>{t("insert")}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setDlg("video-lib")}>{t("from_library")}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setVideoUrl(null)}>{t("cancel")}</Button></div>
          {verr && <p role="alert" className="text-xs text-red-600">{verr}</p>}</div>)}
      {inTable && (
        <div className="flex flex-wrap gap-1 border-b border-rule bg-band p-1" role="toolbar" aria-label={t("table")}>
          <TB label={t("col_add")} on={() => c().addColumnAfter().run()} /><TB label={t("col_del")} on={() => c().deleteColumn().run()} />
          <TB label={t("row_add")} on={() => c().addRowAfter().run()} /><TB label={t("row_del")} on={() => c().deleteRow().run()} />
          <TB label={t("header_row")} on={() => c().toggleHeaderRow().run()} /><TB label={t("table_del")} on={() => c().deleteTable().run()} /></div>)}
      {node && nt === "image" && (
        <div className="grid gap-2 border-b border-rule bg-band p-2 md:grid-cols-3">
          <Input value={node.attrs.alt ?? ""} onChange={(e) => set("image", { alt: e.target.value })} placeholder={t("alt_text")} aria-label={t("alt_text")} />
          <Input value={node.attrs.caption ?? ""} onChange={(e) => set("image", { caption: e.target.value })} placeholder={t("caption")} aria-label={t("caption")} />
          <Input value={node.attrs.credit ?? ""} onChange={(e) => set("image", { credit: e.target.value })} placeholder={t("credit")} aria-label={t("credit")} /></div>)}
      {node && nt === "video" && (
        <div className="grid gap-2 border-b border-rule bg-band p-2 md:grid-cols-2">
          <Input value={node.attrs.title ?? ""} onChange={(e) => set("video", { title: e.target.value })} placeholder={t("title")} aria-label={t("title")} />
          <Input value={node.attrs.caption ?? ""} onChange={(e) => set("video", { caption: e.target.value })} placeholder={t("caption")} aria-label={t("caption")} /></div>)}
      {node && nt === "document" && (
        <div className="border-b border-rule bg-band p-2"><Input value={node.attrs.title ?? ""} onChange={(e) => set("document", { title: e.target.value })} placeholder={t("doc_title")} aria-label={t("doc_title")} /></div>)}
      {node && nt === "gallery" && (
        <div className="space-y-2 border-b border-rule bg-band p-2">
          {(node.attrs.items as ReturnType<typeof item>[]).map((it, i, all) => {
            const upd = (p: Partial<typeof it>) => set("gallery", { items: all.map((x, j) => (j === i ? { ...x, ...p } : x)) });
            const mv = (d: number) => { const n = [...all]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; set("gallery", { items: n }); };
            return (
              <div key={`${it.src}-${i}`} className="flex items-center gap-2"><img src={it.src} alt="" className="size-12 object-cover" />
                <Input value={it.caption} onChange={(e) => upd({ caption: e.target.value })} placeholder={t("caption")} aria-label={t("caption")} />
                <Input value={it.credit} onChange={(e) => upd({ credit: e.target.value })} placeholder={t("credit")} aria-label={t("credit")} className="max-w-48" />
                <button type="button" aria-label={t("move_up")} onClick={() => mv(-1)}><ArrowUp className="size-4" /></button><button type="button" aria-label={t("move_down")} onClick={() => mv(1)}><ArrowDown className="size-4" /></button>
                <button type="button" aria-label={t("remove")} onClick={() => (all.length > 1 ? set("gallery", { items: all.filter((_, j) => j !== i) }) : c().deleteSelection().run())}><X className="size-4" /></button></div>);
          })}
          <Button type="button" size="sm" variant="outline" onClick={() => setDlg("gallery-add")}><Plus className="size-4" />{t("add_images")}</Button></div>)}
      <EditorContent editor={ed} />
      {dlg === "image" && <MediaPicker kind="IMAGE" onClose={() => setDlg(null)} onPick={([m]) => { ins({ type: "image", attrs: item(m) }); setDlg(null); }} />}
      {dlg === "gallery" && <MediaPicker kind="IMAGE" multiple onClose={() => setDlg(null)} onPick={(ms) => { ins({ type: "gallery", attrs: { items: ms.map(item) } }); setDlg(null); }} />}
      {dlg === "gallery-add" && <MediaPicker kind="IMAGE" multiple onClose={() => setDlg(null)} onPick={(ms) => { set("gallery", { items: [...node!.attrs.items, ...ms.map(item)] }); setDlg(null); }} />}
      {dlg === "video-lib" && <MediaPicker kind="VIDEO" onClose={() => setDlg(null)} onPick={([m]) => { ins({ type: "video", attrs: { src: m.path, provider: "file", embed: m.path, mediaId: m.id, title: m.caption ?? "" } }); setDlg(null); setVideoUrl(null); }} />}
      {dlg === "document" && <MediaPicker kind="DOCUMENT" onClose={() => setDlg(null)} onPick={([m]) => { ins({ type: "document", attrs: { src: m.path, mediaId: m.id, title: m.caption || m.filename, filename: m.filename, size: m.size, mime: m.mime } }); setDlg(null); }} />}
    </div>
  );
}
