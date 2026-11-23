import { Node } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { fmtSize } from "@/lib/i18n";

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
type Attrs = Record<string, any>;
const capLine = (a: Attrs) => [a.caption, a.credit].filter(Boolean).join(" — ");

/** Image with library id, caption and credit. */
export const ImageBlock = Image.extend({
  addAttributes() { return { ...this.parent?.(), mediaId: { default: null }, caption: { default: "" }, credit: { default: "" } }; },
  addNodeView() {
    return ({ node }) => {
      const dom = el("figure", "ed-block"), img = el("img"), cap = el("figcaption", "ed-cap"); dom.append(img, cap);
      const paint = (a: Attrs) => { img.src = a.src; img.alt = a.alt ?? ""; cap.textContent = capLine(a); };
      paint(node.attrs);
      return { dom, update: (n) => (n.type.name !== "image" ? false : (paint(n.attrs), true)) };
    };
  },
});
/** A set of images: ordered, each with caption and credit. Opens in a viewer on the public page. */
export const GalleryBlock = Node.create({
  name: "gallery", group: "block", atom: true, draggable: true, selectable: true,
  addAttributes() { return { items: { default: [] } }; },
  parseHTML() { return [{ tag: "div[data-gallery]" }]; },
  renderHTML() { return ["div", { "data-gallery": "" }]; },
  addNodeView() {
    return ({ node }) => {
      const dom = el("div", "ed-block ed-gallery"), grid = el("div", "ed-grid"), badge = el("div", "ed-badge");
      dom.append(grid, badge);
      const paint = (a: Attrs) => { grid.replaceChildren(...(a.items as Attrs[]).slice(0, 8).map((i) => { const m = el("img"); m.src = i.src; m.alt = i.alt ?? ""; return m; })); badge.textContent = `${(a.items as Attrs[]).length}`; };
      paint(node.attrs);
      return { dom, update: (n) => (n.type.name !== "gallery" ? false : (paint(n.attrs), true)) };
    };
  },
});
/** Uploaded video (library) or an external video URL (YouTube / Vimeo / direct https file). */
export const VideoBlock = Node.create({
  name: "video", group: "block", atom: true, draggable: true, selectable: true,
  addAttributes() { return { src: { default: "" }, provider: { default: "file" }, embed: { default: "" }, mediaId: { default: null }, title: { default: "" }, caption: { default: "" } }; },
  parseHTML() { return [{ tag: "div[data-video]" }]; },
  renderHTML() { return ["div", { "data-video": "" }]; },
  addNodeView() {
    return ({ node }) => {
      const dom = el("div", "ed-block ed-file"), t = el("strong"), s = el("span", "ed-cap"); dom.append(t, s);
      const paint = (a: Attrs) => { t.textContent = `▶ ${a.title || a.provider}`; s.textContent = a.src; };
      paint(node.attrs);
      return { dom, update: (n) => (n.type.name !== "video" ? false : (paint(n.attrs), true)) };
    };
  },
});
/** Downloadable document (PDF) with title and file information. */
export const DocumentBlock = Node.create({
  name: "document", group: "block", atom: true, draggable: true, selectable: true,
  addAttributes() { return { src: { default: "" }, mediaId: { default: null }, title: { default: "" }, filename: { default: "" }, size: { default: null }, mime: { default: "application/pdf" } }; },
  parseHTML() { return [{ tag: "div[data-document]" }]; },
  renderHTML() { return ["div", { "data-document": "" }]; },
  addNodeView() {
    return ({ node }) => {
      const dom = el("div", "ed-block ed-file"), t = el("strong"), s = el("span", "ed-cap"); dom.append(t, s);
      const paint = (a: Attrs) => { t.textContent = `📄 ${a.title || a.filename}`; s.textContent = [a.filename, a.size ? fmtSize(a.size) : ""].filter(Boolean).join(" · "); };
      paint(node.attrs);
      return { dom, update: (n) => (n.type.name !== "document" ? false : (paint(n.attrs), true)) };
    };
  },
});
