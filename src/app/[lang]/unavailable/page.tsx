import type { Metadata } from "next";
import Link from "next/link";
import { Languages } from "lucide-react";
import { notFound } from "next/navigation";
import { isLang, T, LABEL } from "@/lib/i18n";
import { db } from "@/lib/db";
import { isVisible } from "@/lib/visible";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: true } };
/** Shown when a visitor switches to a language the article has not been translated into. Never shows wrong-language content silently. */
export default async function Unavailable({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ from?: string; slug?: string }> }) {
  const { lang } = await params; if (!isLang(lang)) notFound(); const sp = await searchParams, t = T[lang];
  const orig = sp.from && isLang(sp.from) && sp.slug ? await db.translation.findUnique({ where: { lang_slug: { lang: sp.from, slug: sp.slug } }, include: { article: true } }) : null;
  return (
    <main className="wrap grid place-items-center py-24 text-center md:py-32">
      <span className="grid size-16 place-items-center rounded-2xl bg-accent/15 text-accent-ink"><Languages className="size-8" aria-hidden /></span>
      <h1 className="headline mt-6 max-w-xl text-3xl md:text-4xl">{t.unavailableTitle}</h1><p className="mt-3 max-w-md font-serif text-lg text-mute">{t.unavailableBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-semibold">
        {orig && isVisible(orig.article) && <Link href={`/${orig.lang}/article/${orig.slug}`} className="inline-flex h-11 items-center rounded-full border border-navy px-5 transition-colors hover:bg-navy hover:text-white dark:border-white/30 dark:hover:bg-white/10">{t.openOriginal} ({LABEL[orig.lang]})</Link>}
        <Link href={`/${lang}`} className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-navy transition-colors hover:bg-accent-strong">{t.backHome}</Link></div></main>
  );
}
