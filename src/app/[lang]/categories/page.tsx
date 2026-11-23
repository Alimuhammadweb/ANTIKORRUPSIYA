import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isLang, T, loc } from "@/lib/i18n";
import { slugOf, base } from "@/lib/queries";
import { PageHeader } from "@/components/listing";
import { alternatesFor } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const { lang } = await params; return isLang(lang) ? { title: `${T[lang].categories} — ANTIKORRUPSIYA`, alternates: alternatesFor(lang, "/categories") } : {}; }
export default async function Categories({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLang(lang)) notFound();
  const cats = await db.category.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  const counts = await Promise.all(cats.map((c) => db.article.count({ where: base(lang, { categoryId: c.id }) })));
  return (
    <main><PageHeader kicker="ANTIKORRUPSIYA" title={T[lang].categories} sub={T[lang].categoriesIntro} />
      <ul className="wrap grid gap-5 py-10 sm:grid-cols-2 md:py-14 lg:grid-cols-3">{cats.map((c, i) => (
        <li key={c.id}><Link href={`/${lang}/category/${slugOf(c, lang)}`} className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-surface p-6 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-lift)]">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left scale-x-[0.18] bg-accent transition-transform duration-300 group-hover:scale-x-100" />
          <span className="font-serif text-4xl font-bold leading-none text-accent/80 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <h2 className="headline mt-5 text-2xl">{loc(c.names, lang)}</h2>
          <p className="mt-2 line-clamp-3 flex-1 font-serif text-[0.98rem] leading-relaxed text-mute">{loc(c.descriptions, lang)}</p>
          <p className="mt-6 flex items-center justify-between border-t border-rule pt-4 text-sm font-semibold"><span className="text-mute">{counts[i]} {T[lang].results}</span><ArrowUpRight className="size-5 text-accent-ink transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden /></p>
        </Link></li>))}</ul></main>
  );
}
