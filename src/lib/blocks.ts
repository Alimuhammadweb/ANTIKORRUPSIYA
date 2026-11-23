import { parseVideoUrl } from "./embed";
// The article body is a TipTap document. This module validates it on save (server side) and extracts data from it.
export type Node = { type: string; attrs?: Record<string, any>; content?: Node[]; text?: string; marks?: { type: string; attrs?: Record<string, any> }[] };
export const EMPTY_DOC: Node = { type: "doc", content: [] };

export const safeUrl = (u: unknown): string | null => {
  const s = typeof u === "string" ? u.trim() : "";
  return /^(https?:\/\/|\/(?!\/)|mailto:)/i.test(s) && s.length < 2000 ? s : null;
};
const str = (v: unknown, n = 500) => (typeof v === "string" ? v.slice(0, n) : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : null);
const BLOCK = new Set(["paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "horizontalRule", "hardBreak", "image", "gallery", "video", "document", "table", "tableRow", "tableCell", "tableHeader"]);

function cleanItem(i: any) { const src = safeUrl(i?.src); return src ? { mediaId: num(i?.mediaId), src, alt: str(i?.alt, 300), caption: str(i?.caption), credit: str(i?.credit, 200) } : null; }

function clean(n: any, depth = 0): Node | null {
  if (!n || typeof n !== "object" || depth > 12 || typeof n.type !== "string") return null;
  if (n.type === "text") {
    if (typeof n.text !== "string" || !n.text) return null;
    const marks = (Array.isArray(n.marks) ? n.marks : []).flatMap((m: any) => {
      if (m?.type === "bold" || m?.type === "italic") return [{ type: m.type }];
      if (m?.type === "link") { const href = safeUrl(m.attrs?.href); return href ? [{ type: "link", attrs: { href } }] : []; }
      return [];
    });
    return marks.length ? { type: "text", text: n.text, marks } : { type: "text", text: n.text };
  }
  if (n.type !== "doc" && !BLOCK.has(n.type)) return null;
  const out: Node = { type: n.type }, a = n.attrs ?? {};
  switch (n.type) {
    case "heading": out.attrs = { level: [2, 3, 4].includes(Number(a.level)) ? Number(a.level) : 2 }; break;
    case "image": { const src = safeUrl(a.src); if (!src) return null; out.attrs = { mediaId: num(a.mediaId), src, alt: str(a.alt, 300), caption: str(a.caption), credit: str(a.credit, 200) }; return out; }
    case "gallery": { const items = (Array.isArray(a.items) ? a.items : []).slice(0, 60).map(cleanItem).filter(Boolean); if (!items.length) return null; out.attrs = { items }; return out; }
    case "video": { const raw = str(a.src, 2000), v = /^\/(?!\/).+\.(mp4|webm)$/i.test(raw) ? { src: raw, provider: "file", embed: raw } : parseVideoUrl(raw); if (!v) return null; out.attrs = { src: v.src, provider: v.provider, embed: v.embed, mediaId: num(a.mediaId), title: str(a.title, 200), caption: str(a.caption) }; return out; }
    case "document": { const src = safeUrl(a.src); if (!src) return null; out.attrs = { mediaId: num(a.mediaId), src, title: str(a.title, 200) || str(a.filename, 200), filename: str(a.filename, 200), size: num(a.size), mime: str(a.mime, 100) }; return out; }
    case "tableCell": case "tableHeader": out.attrs = { colspan: num(a.colspan) ?? 1, rowspan: num(a.rowspan) ?? 1 }; break;
    case "orderedList": out.attrs = { start: num(a.start) ?? 1 }; break;
  }
  if (Array.isArray(n.content)) out.content = n.content.map((c: any) => clean(c, depth + 1)).filter((c: Node | null): c is Node => !!c);
  return out;
}
/** Whitelist-validates a TipTap document. Unknown nodes/marks/attributes are dropped; unsafe URLs never survive. */
export function cleanDoc(input: unknown): Node {
  const r = clean(input);
  return r && r.type === "doc" ? { type: "doc", content: r.content ?? [] } : { type: "doc", content: [] };
}
/** Legacy plain-paragraph arrays (old bot posts) become a normal document. */
export const toDoc = (v: unknown): Node =>
  Array.isArray(v) ? { type: "doc", content: v.filter((b) => b?.text).map((b) => ({ type: "paragraph", content: [{ type: "text", text: String(b.text) }] })) } : v && typeof v === "object" ? (v as Node) : EMPTY_DOC;

const walk = (n: Node, f: (n: Node) => void) => { f(n); n.content?.forEach((c) => walk(c, f)); };
export function plainText(doc: unknown): string { const parts: string[] = []; walk(toDoc(doc), (n) => { if (n.type === "text" && n.text) parts.push(n.text); }); return parts.join(" "); }
export function findNodes(doc: unknown, type: string): Node[] { const r: Node[] = []; walk(toDoc(doc), (n) => { if (n.type === type) r.push(n); }); return r; }
export const firstVideo = (doc: unknown) => findNodes(doc, "video")[0]?.attrs as { src: string; provider: string; embed: string; title?: string } | undefined;
/** URLs of every media file the document uses; the media library blocks deleting these. */
export function mediaUrls(doc: unknown): string[] {
  const u: string[] = [];
  walk(toDoc(doc), (n) => { if (n.attrs?.src && typeof n.attrs.src === "string") u.push(n.attrs.src); n.attrs?.items?.forEach?.((i: any) => i?.src && u.push(i.src)); });
  return u;
}

/** True when a document has any visible text or a media block (image, gallery, video, document). Safe to use in the browser too. */
export function docHasContent(n: unknown, depth = 0): boolean {
  const o = n as { type?: unknown; text?: unknown; content?: unknown } | null;
  if (!o || typeof o !== "object" || depth > 12) return false;
  if (o.type === "text") return typeof o.text === "string" && o.text.trim().length > 0;
  if (o.type === "image" || o.type === "gallery" || o.type === "video" || o.type === "document") return true;
  return Array.isArray(o.content) && o.content.some((c) => docHasContent(c, depth + 1));
}
