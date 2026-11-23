import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { limited } from "@/lib/ratelimit";
import { startSession, currentUser } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { LANGS, LABEL } from "@/lib/i18n";
import { setAdminLang } from "../lang-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in — ANTIKORRUPSIYA", robots: { index: false, follow: false } };
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/admin");
  const err = (await searchParams).error, { t, lang } = await adminT();
  async function action(f: FormData) {
    "use server";
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "local", email = String(f.get("email") ?? "").toLowerCase().trim().slice(0, 200);
    if ((await limited(`login:ip:${ip}`, 10, 15 * 60_000)) || (await limited(`login:email:${email}`, 6, 15 * 60_000))) redirect("/admin/login?error=2");
    redirect((await startSession(email, String(f.get("password") ?? ""))) ? "/admin" : "/admin/login?error=1");
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="art relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div aria-hidden className="absolute -right-32 top-1/3 size-[30rem] rounded-full bg-accent/15 blur-3xl" />
        <img src="/brand/logo.png" alt="ANTIKORRUPSIYA" className="relative h-12 w-auto self-start [filter:drop-shadow(0_0_.5px_rgb(255_255_255/.65))]" />
        <div className="relative max-w-md"><span className="mb-5 block h-1 w-14 rounded bg-accent" aria-hidden /><p className="font-serif text-3xl font-bold leading-snug tracking-tight">Anti-corruption journalism</p><p className="mt-3 font-serif text-xl leading-relaxed text-silver">Коррупцияга қарши журналистика<br />Антикоррупционная журналистика</p></div>
        <p className="relative text-xs text-silver/60">© {new Date().getFullYear()} ANTIKORRUPSIYA</p>
      </section>
      <section className="relative grid place-items-center bg-band px-5 py-12">
        <div className="w-full max-w-sm">
          <img src="/brand/logo.png" alt="ANTIKORRUPSIYA" className="mb-6 h-9 w-auto rounded-lg bg-navy px-3 py-2 lg:hidden" />
          <form action={action} className="space-y-5 rounded-2xl border border-rule bg-surface p-7 shadow-[var(--shadow-lift)] sm:p-8">
            <div><h1 className="text-2xl font-extrabold tracking-tight">{t("login_title")}</h1><span className="mt-3 block h-1 w-10 rounded bg-accent" aria-hidden /></div>
            {err && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-700 dark:text-red-300">{err === "2" ? t("login_throttled") : t("login_wrong")}</p>}
            <label className="block text-sm font-semibold">{t("email")}<Input name="email" type="email" required autoComplete="username" className="mt-1.5 h-11 font-normal" /></label>
            <label className="block text-sm font-semibold">{t("password")}<Input name="password" type="password" required autoComplete="current-password" className="mt-1.5 h-11 font-normal" /></label>
            <Button variant="primary" className="h-11 w-full text-[15px]">{t("sign_in")}</Button>
          </form>
          <form action={setAdminLang} className="mt-5 flex justify-center gap-1 text-xs"><input type="hidden" name="back" value="/admin/login" />
            {LANGS.map((l) => <button key={l} name="lang" value={l} aria-pressed={l === lang} className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${l === lang ? "bg-navy text-white dark:bg-accent dark:text-navy" : "text-mute hover:bg-surface hover:text-ink"}`}>{LABEL[l]}</button>)}</form>
        </div>
      </section>
    </main>
  );
}
