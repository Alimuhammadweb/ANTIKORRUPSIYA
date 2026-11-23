import Link from "next/link";
import { CalendarDays, Clock, Eye, RefreshCw } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { T, fmtDay, fmtViews, loc, type L } from "@/lib/i18n";

const NAME: Record<L, string> = { uz: "O‘zbekcha", ru: "Русский", en: "English" }; // same names as the header language menu
import { slugOf, type Item } from "@/lib/queries";
import { mediaUrls, plainText } from "@/lib/blocks";
import { DocRender } from "./doc-render";
import { GalleryViewer } from "./gallery-viewer";
import { ShareBar, ReadingProgress } from "./article-extras";
import { Card, SectionHead, formatLabel } from "./listing";

export type FullArticle = Prisma.ArticleGetPayload<{ include: { cover: true; category: true; tags: true; author: { select: { name: true } }; images: { include: { media: true } }; translations: { select: { lang: true; slug: true } } } }>;
type Tr = { lang: string; slug: string; title: string; description: string; blocks: unknown };

/** The full article page body, shared by the public page and the admin preview. */
export function ArticleView({ a, tr, lang, related = [], url, preview, popularTags = [] }: { a: FullArticle; tr: Tr; lang: L; related?: Item[]; url?: string; preview?: boolean; popularTags?: { id: number; names: unknown; slugs: unknown }[] }) {
  const t = T[lang], inBody = new Set(mediaUrls(tr.blocks)), album = a.images.filter((i) => !inBody.has(i.media.path)).sort((x, y) => x.position - y.position);
  const edited = a.publishedAt && a.updatedAt.getTime() - a.publishedAt.getTime() > 60_000, others = a.translations.filter((x) => x.lang !== lang);
  const words = plainText(tr.blocks).split(/\s+/).filter(Boolean).length, mins = Math.max(1, Math.round(words / 190));
  const labels = { share: t.share, shareVia: t.shareVia, native: t.nativeShare, copy: t.copy, copied: t.copied };
  const fmt = formatLabel({ format: (a as unknown as { format: string }).format } as Item, lang);
  return (
    <>
      <ReadingProgress label={t.readProgress} />
      <article className="pb-4">
        <header className="wrap max-w-4xl pt-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="text-[13px] text-mute"><ol className="flex flex-wrap items-center gap-x-2 gap-y-1"><li><Link href={`/${lang}`} className="hover:text-ink hover:underline">{t.home}</Link></li>
            {a.category && <><li aria-hidden>/</li><li><Link href={`/${lang}/category/${slugOf(a.category, lang)}`} className="font-semibold text-accent-ink hover:underline">{loc(a.category.names, lang)}</Link></li></>}</ol></nav>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {a.category && <Link href={`/${lang}/category/${slugOf(a.category, lang)}`} className="rounded-md bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-navy">{loc(a.category.names, lang)}</Link>}
            {fmt && <span className="rounded-md border border-rule px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-mute">{fmt}</span>}
          </div>
          <h1 className="headline mt-4 text-[2.1rem] !leading-[1.12] !tracking-[-0.02em] sm:text-5xl lg:text-[3.4rem]">{tr.title}</h1>
          {tr.description && <p className="mt-5 font-serif text-xl leading-relaxed text-mute md:text-[1.45rem] md:leading-snug">{tr.description}</p>}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-rule py-4">
            {a.author?.name && <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-navy text-base font-bold text-accent ring-2 ring-accent/30" aria-hidden>{a.author.name.trim().charAt(0).toUpperCase()}</span><div className="leading-tight"><p className="text-[11px] font-semibold uppercase tracking-wider text-mute">{t.by}</p><p className="text-sm font-bold">{a.author.name}</p></div></div>}
            <p className="meta !text-[13px] flex flex-wrap gap-x-5 gap-y-2">
              {a.publishedAt && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 opacity-80" aria-hidden />{t.published}: <time dateTime={a.publishedAt.toISOString()}>{fmtDay(a.publishedAt, lang)}</time></span>}
              {edited && <span className="inline-flex items-center gap-1.5"><RefreshCw className="size-4 opacity-80" aria-hidden />{t.updated}: <time dateTime={a.updatedAt.toISOString()}>{fmtDay(a.updatedAt, lang)}</time></span>}
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4 opacity-80" aria-hidden />{mins} {t.minRead}</span><span className="inline-flex items-center gap-1.5"><Eye className="size-4 opacity-80" aria-hidden />{fmtViews(a.views, lang)} {t.views}</span></p>
            {others.length > 0 && <p className="ml-auto flex flex-wrap gap-1.5 text-xs" aria-label={t.language}>{others.map((o) => <a key={o.lang} href={preview ? `?lang=${o.lang}` : `/${o.lang}/article/${o.slug}`} hrefLang={o.lang} className="rounded-full border border-rule px-3 py-1 font-semibold transition-colors hover:border-accent hover:text-accent-ink">{NAME[o.lang as L]}</a>)}</p>}
          </div>
        </header>
        {a.cover && <figure className="wrap mt-8 max-w-5xl"><img src={a.cover.path} alt={a.cover.alt ?? tr.title} fetchPriority="high" className="w-full rounded-xl shadow-[var(--shadow-card)]" />{(a.cover.caption || a.cover.credit) && <figcaption className="meta mt-3 !text-[13px]">{[a.cover.caption, a.cover.credit].filter(Boolean).join(" — ")}</figcaption>}</figure>}
        <div className="wrap mt-10 grid max-w-5xl gap-x-10 lg:grid-cols-[3.5rem_minmax(0,1fr)_3.5rem]">
          <div className="no-print hidden lg:block">{url && <div className="sticky top-28"><ShareBar rail title={tr.title} url={url} labels={labels} /></div>}</div>
          <div className="mx-auto w-full max-w-[43rem] min-w-0">
            <DocRender doc={tr.blocks} lang={lang} />
            {album.length > 0 && <section className="mt-10" aria-label={t.gallery}><GalleryViewer items={album.map((i) => ({ src: i.media.path, alt: i.media.alt ?? "", caption: i.media.caption ?? "", credit: i.media.credit ?? "" }))} labels={{ gallery: t.gallery, close: t.close, prev: t.prevImage, next: t.nextImage, open: t.openImage }} /></section>}
            {a.tags.length > 0 && <p className="mt-10 flex flex-wrap gap-2 border-t border-rule pt-6 text-sm">{a.tags.map((g) => <Link key={g.id} href={`/${lang}/tag/${slugOf(g, lang)}`} className="rounded-full bg-band px-3.5 py-1.5 font-semibold text-mute transition-colors hover:bg-brand hover:text-white">#{loc(g.names, lang)}</Link>)}</p>}
            {url && <div className="no-print mt-8 rounded-xl border border-rule bg-band/60 p-4 lg:hidden"><ShareBar title={tr.title} url={url} labels={labels} /></div>}
          </div>
        </div>
      </article>
      {related.length > 0 && <section className="no-print mt-16 border-t border-rule bg-band py-14"><div className="wrap"><SectionHead title={t.related} lang={lang} /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <Card key={r.id} a={r} lang={lang} />)}</div></div></section>}
      {popularTags.length > 0 && <section aria-label={t.popularTags} className="no-print border-t border-rule py-10"><div className="wrap"><SectionHead title={t.popularTags} lang={lang} /><ul className="flex flex-wrap gap-2.5">{popularTags.map((g) => <li key={g.id}><Link href={`/${lang}/tag/${slugOf(g as never, lang)}`} className="inline-flex items-center rounded-full border border-rule bg-surface px-4 py-2 text-sm font-semibold shadow-sm transition-colors hover:border-brand hover:bg-brand hover:text-white">#{loc(g.names, lang)}</Link></li>)}</ul></div></section>}
    </>
  );
}
