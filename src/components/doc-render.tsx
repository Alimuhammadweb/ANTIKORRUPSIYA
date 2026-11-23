import { toDoc, safeUrl, type Node } from "@/lib/blocks";
import { fmtSize, T, type L } from "@/lib/i18n";
import { GalleryViewer } from "./gallery-viewer";
import { FileText, Download } from "lucide-react";

const cap = (a: { caption?: string; credit?: string }) => [a.caption, a.credit].filter(Boolean).join(" — ");
function Text({ n }: { n: Node }) {
  return <>{(n.marks ?? []).reduce<React.ReactNode>((acc, m) => m.type === "bold" ? <strong>{acc}</strong> : m.type === "italic" ? <em>{acc}</em> : m.type === "link" ? <a href={safeUrl(m.attrs?.href) ?? "#"} rel="noopener noreferrer nofollow">{acc}</a> : acc, n.text)}</>;
}
function R({ n, lang }: { n: Node; lang: L }): React.ReactNode {
  const kids = n.content?.map((c, i) => <R key={i} n={c} lang={lang} />), a = n.attrs ?? {}, t = T[lang];
  switch (n.type) {
    case "text": return <Text n={n} />;
    case "hardBreak": return <br />;
    case "heading": { const H = `h${Math.min(Math.max(a.level ?? 2, 2), 4)}` as "h2"; return <H>{kids}</H>; }
    case "paragraph": return <p>{kids}</p>;
    case "blockquote": return <blockquote>{kids}</blockquote>;
    case "bulletList": return <ul>{kids}</ul>;
    case "orderedList": return <ol start={a.start ?? 1}>{kids}</ol>;
    case "listItem": return <li>{kids}</li>;
    case "horizontalRule": return <hr />;
    case "image": return <figure><img src={a.src} alt={a.alt ?? ""} loading="lazy" />{cap(a) && <figcaption>{cap(a)}</figcaption>}</figure>;
    case "gallery": return <GalleryViewer items={a.items ?? []} labels={{ gallery: t.gallery, close: t.close, prev: t.prevImage, next: t.nextImage, open: t.openImage }} />;
    case "video": return (
      <figure className="not-prose">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          {a.provider === "file"
            ? <video src={a.src} controls preload="metadata" playsInline className="absolute inset-0 size-full" aria-label={a.title || t.video} />
            : <iframe src={a.embed} title={a.title || t.video} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 size-full" />}
        </div>
        {(a.caption || a.title) && <figcaption>{a.caption || a.title}</figcaption>}
      </figure>);
    case "document": return (
      <a href={a.src} download={a.filename || undefined} target="_blank" rel="noopener noreferrer" className="doc-file not-prose">
        <FileText className="size-8 shrink-0 text-accent-ink" aria-hidden />
        <span className="min-w-0 flex-1"><strong className="block truncate">{a.title || a.filename}</strong><span className="text-sm text-mute">{[a.filename, a.mime === "application/pdf" ? "PDF" : a.mime, a.size ? fmtSize(a.size) : ""].filter(Boolean).join(" · ")}</span></span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"><Download className="size-4" aria-hidden />{t.download}</span>
      </a>);
    case "table": return <div className="doc-table" role="region" tabIndex={0}><table><tbody>{kids}</tbody></table></div>;
    case "tableRow": return <tr>{kids}</tr>;
    case "tableHeader": return <th colSpan={a.colspan ?? 1} rowSpan={a.rowspan ?? 1}>{kids}</th>;
    case "tableCell": return <td colSpan={a.colspan ?? 1} rowSpan={a.rowspan ?? 1}>{kids}</td>;
    default: return null;
  }
}
/** Renders a stored article body. Only whitelisted block types are rendered; nothing is injected as raw HTML. */
export const DocRender = ({ doc, lang }: { doc: unknown; lang: L }) => <div className="doc">{toDoc(doc).content?.map((c, i) => <R key={i} n={c} lang={lang} />)}</div>;
export { toDoc };
