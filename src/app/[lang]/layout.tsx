import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Mail, Search } from "lucide-react";
import { LANGS, T, fmtToday, isLang, loc } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getSite } from "@/lib/settings";
import { slugOf } from "@/lib/queries";
import { Ticker } from "@/components/ticker";
import { Suspense } from "react";
import { LangSwitch } from "@/components/lang-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { NavMenu } from "@/components/nav-menu";
import { ScrollTop } from "@/components/scroll-top";
import { SocialIcon } from "@/components/social-icons";

export const dynamic = "force-dynamic";
export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }
export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLang(lang)) notFound();
  const [cats, site] = await Promise.all([db.category.findMany({ where: { active: true }, orderBy: { order: "asc" } }), getSite()]), t = T[lang];
  // Videos / Interviews are intentionally not part of the public navigation.
  const sections = (["latest", "popular", "trending", "investigations", "announcements"] as const).map((k) => ({ href: `/${lang}/${k}`, text: t[k] }));
  const home = `/${lang}`, allCats = `/${lang}/categories`, links = [{ href: home, text: t.home }, ...sections];
  const topics = cats.map((c) => ({ href: `/${lang}/category/${slugOf(c, lang)}`, text: loc(c.names, lang) }));
  const social = ([["Telegram", site.telegram], ["Facebook", site.facebook], ["X", site.x], ["YouTube", site.youtube]] as [string, string][]).filter(([, u]) => u);
  const Social = ({ cls = "" }: { cls?: string }) => social.length > 0 ? <ul className={`flex items-center gap-1 ${cls}`} aria-label={t.followUs}>{social.map(([n, u]) => <li key={n}><a href={u} target="_blank" rel="noopener noreferrer" aria-label={n} title={n} className="grid size-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white"><SocialIcon name={n} className="size-[18px]" /></a></li>)}</ul> : null;
  const Lang = (p: { variant?: "dropdown" | "list"; compact?: boolean }) => <Suspense fallback={<span className="inline-block h-9 w-28" />}><LangSwitch lang={lang} label={t.language} {...p} /></Suspense>;
  return (
    <div lang={lang === "uz" ? "uz-Cyrl" : lang}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-navy">{t.skip}</a>

      {/* ── mobile bar (sticky) ── */}
      <div data-chrome className="sticky top-0 z-50 border-b border-white/10 bg-navy text-white lg:hidden">
        <div className="flex h-16 items-center gap-1.5 px-3">
          <MobileNav home={home} links={links} cats={topics} allHref={allCats} searchAction={`/${lang}/search`} labels={{ menu: t.menu, close: t.close, sections: t.sections, categories: t.categories, all: t.allCategories, search: t.search, searchPh: t.searchPh, language: t.language }}>
            <Lang variant="list" />
            <div className="flex items-center justify-between pt-1 text-sm text-silver"><span>{t.theme}</span><ThemeToggle label={t.theme} round /></div>
            <Social cls="-ml-2 pt-1" />
          </MobileNav>
          <Link href={home} aria-label="ANTIKORRUPSIYA" className="mr-auto min-w-0 shrink"><img src="/brand/logo.png" alt="ANTIKORRUPSIYA" width={687} height={148} className="h-8 w-auto [filter:drop-shadow(0_0_.5px_rgb(255_255_255/.65))]" /></Link>
          <Lang compact />
          <Link href={`/${lang}/search`} aria-label={t.search} className="grid size-10 place-items-center rounded-full transition-colors hover:bg-white/10"><Search className="size-5" aria-hidden /></Link>
        </div>
      </div>

      {/* ── desktop header: utility strip + masthead over the building backdrop ── */}
      <div data-chrome className="relative z-[45] isolate hidden bg-navy text-white lg:block">
        <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden"><div className="absolute inset-0 bg-[url('/brand/header-banner.webp')] bg-[length:auto_100%] bg-right bg-no-repeat opacity-75 [mask-image:linear-gradient(to_right,transparent_calc(100%_-_373px),#000_calc(100%_-_283px))] xl:opacity-100" /></div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/85 to-navy/20" />
        <div className="border-b border-white/10">
          <div className="wrap flex h-12 items-center justify-between text-[13.5px]">
            <p className="inline-flex items-center gap-2.5 text-white/90"><CalendarDays className="size-[18px]" aria-hidden />{fmtToday(lang)}</p>
            <div className="flex items-center gap-3"><Social /><span className="h-5 w-px bg-white/20" aria-hidden /><Lang /><ThemeToggle label={t.theme} round /></div>
          </div>
        </div>
        <div className="wrap grid h-[5.75rem] grid-cols-[auto_minmax(0,34rem)_1fr] items-center gap-10">
          <Link href={home} aria-label="ANTIKORRUPSIYA"><img src="/brand/logo.png" alt="ANTIKORRUPSIYA" width={687} height={148} className="h-12 w-auto [filter:drop-shadow(0_0_.5px_rgb(255_255_255/.65))]" /></Link>
          <form action={`/${lang}/search`} role="search"><label className="relative block"><span className="sr-only">{t.search}</span><Search className="pointer-events-none absolute left-5 top-1/2 z-10 size-5 -translate-y-1/2 text-white/80" aria-hidden />
            <input name="q" placeholder={t.searchPh} className="h-12 w-full rounded-full border border-white/20 bg-navy/60 pr-5 text-[15px] text-white shadow-inner backdrop-blur transition-colors placeholder:text-white/65 hover:border-white/40 focus-visible:border-accent focus-visible:bg-navy/80 focus-visible:outline-none" style={{ paddingLeft: "3.25rem" }} /></label></form>
        </div>
      </div>

      {/* ── primary navigation (sticky on desktop) ── */}
      <nav data-chrome aria-label={t.sections} className="sticky top-0 z-40 hidden border-t border-white/10 bg-navy text-white shadow-[0_8px_18px_-12px_rgb(0_0_0/.6)] lg:block">
        <div className="wrap flex h-[3.75rem] items-center"><NavMenu links={links} home={home} cats={topics} categoriesLabel={t.categories} allLabel={t.allCategories} allHref={allCats} /></div>
      </nav>

      <Ticker lang={lang} />
      <div id="main" tabIndex={-1}>{children}</div>

      <footer data-chrome className="relative mt-24 bg-navy text-silver">
        <div className="h-1 bg-gradient-to-r from-accent via-brand to-transparent" aria-hidden />
        <div className="wrap grid gap-12 py-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <img src="/brand/logo.png" alt="ANTIKORRUPSIYA" width={687} height={148} className="h-11 w-auto [filter:drop-shadow(0_0_.5px_rgb(255_255_255/.65))]" />
            <p className="mt-5 max-w-md font-serif text-[1.0625rem] leading-relaxed text-silver">{site.footer[lang] || t.tagline}</p>
            {site.email && <a href={`mailto:${site.email}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-accent"><Mail className="size-4" aria-hidden />{site.email}</a>}
            {social.length > 0 && <ul className="mt-6 flex flex-wrap gap-2" aria-label={t.followUs}>{social.map(([n, u]) => <li key={n}><a href={u} target="_blank" rel="noopener noreferrer" aria-label={n} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium transition-colors hover:border-accent hover:text-white"><SocialIcon name={n} className="size-4" />{n}</a></li>)}</ul>}
          </div>
          <nav aria-label={t.sections} className="md:col-span-3"><p className="kicker kicker-dark mb-4">{t.mainSections}</p><ul className="grid gap-2.5 text-[15px]">{[...links, { href: allCats, text: t.categories }, { href: `/${lang}/search`, text: t.search }].map((l) => <li key={l.href}><Link href={l.href} className="transition-colors hover:text-white hover:underline hover:decoration-accent hover:underline-offset-4">{l.text}</Link></li>)}</ul></nav>
          <nav aria-label={t.categories} className="md:col-span-4"><p className="kicker kicker-dark mb-4">{t.categories}</p><ul className="grid gap-2.5 text-[15px] sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">{topics.map((c) => <li key={c.href}><Link href={c.href} className="transition-colors hover:text-white hover:underline hover:decoration-accent hover:underline-offset-4">{c.text}</Link></li>)}</ul></nav>
        </div>
        <div className="border-t border-white/10"><p className="wrap flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-silver/80"><span>© {new Date().getFullYear()} ANTIKORRUPSIYA. {t.rights}</span><span>{t.tagline}</span></p></div>
      </footer>
      <ScrollTop label={t.backToTop} />
    </div>
  );
}
