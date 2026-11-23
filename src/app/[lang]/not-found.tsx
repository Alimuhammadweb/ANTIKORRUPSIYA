import Link from "next/link";
import { Home } from "lucide-react";
export default function NotFound() {
  return (
    <main className="wrap relative grid place-items-center py-24 text-center md:py-32">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-12 size-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      <p className="relative font-serif text-[7rem] font-bold leading-none tracking-tighter text-navy/90 md:text-[10rem] dark:text-white/90">4<span className="text-accent">0</span>4</p>
      <h1 className="headline relative mt-4 text-2xl md:text-3xl">Page not found</h1>
      <p className="relative mt-3 max-w-md text-mute">Саҳифа топилмади · Страница не найдена</p>
      <p className="relative mt-8 flex flex-wrap justify-center gap-3 text-sm font-semibold">
        {([["/uz", "Ўзбекча"], ["/en", "English"], ["/ru", "Русский"]] as const).map(([h, l], i) => <Link key={h} href={h} className={`inline-flex h-11 items-center gap-2 rounded-full px-5 transition-colors ${i === 1 ? "bg-accent text-navy hover:bg-accent-strong" : "border border-rule hover:border-accent hover:text-accent-ink"}`}>{i === 1 && <Home className="size-4" aria-hidden />}{l}</Link>)}
      </p>
    </main>
  );
}
