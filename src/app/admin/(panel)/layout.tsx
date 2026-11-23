import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { requirePerm, endSession } from "@/lib/auth";
import { can, type Perm } from "@/lib/permissions";
import { adminT } from "@/lib/admin-i18n";
import { AdminI18nProvider } from "@/components/admin/i18n-client";
import { AdminLangSwitch } from "@/components/admin/admin-lang";
import { AdminDrawer, AdminNav, type NavGroup } from "@/components/admin/admin-nav";
import type { IconName } from "@/components/admin/nav-icons";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ANTIKORRUPSIYA — newsroom", robots: { index: false, follow: false } };
type Item = { href: string; k: string; icon: IconName; perm?: Perm };
const GROUPS: { k: string; items: Item[] }[] = [
  { k: "nav_group_content", items: [
    { href: "/admin", k: "nav_dashboard", icon: "LayoutDashboard" }, { href: "/admin/articles", k: "nav_articles", icon: "Newspaper" }, { href: "/admin/articles/new", k: "nav_new_article", icon: "PlusCircle", perm: "article.create" },
    { href: "/admin/media", k: "nav_media", icon: "ImageIcon" } ] },
  { k: "nav_group_site", items: [
    { href: "/admin/homepage", k: "nav_homepage", icon: "Home", perm: "homepage.manage" }, { href: "/admin/trending", k: "nav_trending", icon: "Flame", perm: "trending.manage" }, { href: "/admin/announcements", k: "nav_announcements", icon: "Megaphone", perm: "announcement.manage" },
    { href: "/admin/breaking", k: "nav_breaking", icon: "Zap", perm: "breaking.manage" }, { href: "/admin/categories", k: "nav_categories", icon: "FolderTree", perm: "taxonomy.manage" }, { href: "/admin/tags", k: "nav_tags", icon: "Tags", perm: "taxonomy.manage" } ] },
  { k: "nav_group_insights", items: [{ href: "/admin/analytics", k: "nav_analytics", icon: "BarChart3", perm: "analytics.view" }, { href: "/admin/activity", k: "nav_activity", icon: "History", perm: "article.review" }] },
  { k: "nav_group_admin", items: [{ href: "/admin/users", k: "nav_users", icon: "Users", perm: "users.manage" }, { href: "/admin/settings", k: "nav_settings", icon: "Settings", perm: "settings.manage" }] },
];
export default async function Panel({ children }: { children: React.ReactNode }) {
  const u = await requirePerm(); const { t, lang } = await adminT();
  async function out() { "use server"; await endSession(); redirect("/admin/login"); }
  const groups: NavGroup[] = GROUPS.map((g) => ({ label: t(g.k), items: g.items.filter((i) => !i.perm || can(u, i.perm)).map((i) => ({ href: i.href, text: t(i.k), icon: i.icon })) })).filter((g) => g.items.length);
  const User = () => (
    <div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-navy" aria-hidden>{u.name.trim().charAt(0).toUpperCase()}</span>
      <div className="min-w-0 flex-1 leading-tight"><p className="truncate text-sm font-semibold text-white">{u.name}</p><p className="truncate text-xs text-silver/70">{t(`role_${u.role}`)}</p></div>
      <form action={out}><button title={t("sign_out")} aria-label={t("sign_out")} className="grid size-9 place-items-center rounded-lg text-silver transition-colors hover:bg-white/10 hover:text-white"><LogOut className="size-4" aria-hidden /></button></form></div>);
  return (
    <AdminI18nProvider lang={lang}>
      <div className="min-h-screen bg-band lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside className="hidden bg-navy text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="border-b border-white/10 px-5 py-5"><Link href="/admin"><img src="/brand/logo.png" alt="ANTIKORRUPSIYA" className="h-9 w-auto [filter:drop-shadow(0_0_.5px_rgb(255_255_255/.65))]" /></Link><p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{t("nav_group_content")}</p></div>
          <nav aria-label={t("nav_main")} className="flex-1 overflow-y-auto px-3 py-4"><AdminNav groups={groups} /></nav>
          <div className="border-t border-white/10 p-4"><User /></div>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-rule bg-surface/90 px-4 backdrop-blur lg:px-8">
            <AdminDrawer groups={groups} label={t("open_menu")} close={t("close")} footer={<div className="space-y-4"><User /><Suspense><AdminLangSwitch onDark /></Suspense></div>} />
            <img src="/brand/logo.png" alt="" aria-hidden className="h-6 w-auto rounded bg-navy px-1.5 py-0.5 lg:hidden" />
            <div className="ml-auto flex items-center gap-2">
              <Link href="/uz" target="_blank" className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-mute transition-colors hover:bg-band hover:text-ink sm:inline-flex">{t("view_site")}<ExternalLink className="size-3.5" aria-hidden /></Link>
              <div className="hidden lg:block"><Suspense><AdminLangSwitch /></Suspense></div>
              <ThemeToggle label={t("switch_theme")} onDark={false} />
            </div>
          </header>
          <div className="mx-auto max-w-[88rem] p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </AdminI18nProvider>
  );
}
