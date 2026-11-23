"use client";
import { useEffect, useState } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { SocialIcon } from "./social-icons";

export function ViewPing({ id }: { id: number }) {
  useEffect(() => { fetch("/api/view", { method: "POST", body: JSON.stringify({ id }), keepalive: true }).catch(() => {}); }, [id]);
  return null;
}
/** Thin bar showing how much of the page has been read; updates while scrolling. */
export function ReadingProgress({ label }: { label: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const f = () => { const h = document.documentElement.scrollHeight - innerHeight; setW(h > 0 ? Math.min(100, Math.max(0, (scrollY / h) * 100)) : 0); };
    f(); addEventListener("scroll", f, { passive: true }); addEventListener("resize", f); return () => { removeEventListener("scroll", f); removeEventListener("resize", f); };
  }, []);
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(w)} className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"><div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${w}%` }} /></div>;
}
type Labels = { share: string; shareVia: string; native: string; copy: string; copied: string };
/** `rail`: vertical sticky icon column beside the text (desktop). Default: horizontal row below the article. */
export function ShareBar({ title, url, labels, rail }: { title: string; url: string; labels: Labels; rail?: boolean }) {
  const [done, setDone] = useState(false), [native, setNative] = useState(false);
  useEffect(() => setNative(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  const links = [["Telegram", `https://t.me/share/url?url=${u}&text=${t}`], ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`], ["X", `https://x.com/intent/post?url=${u}&text=${t}`]] as const;
  const cls = rail ? "grid size-11 place-items-center rounded-full border border-rule bg-surface text-mute shadow-sm transition-colors hover:border-accent hover:bg-accent hover:text-navy" : "inline-flex h-10 items-center gap-2 rounded-full border border-rule bg-surface px-4 text-sm font-semibold transition-colors hover:border-accent hover:text-accent-ink";
  async function copy() { try { await navigator.clipboard.writeText(url); } catch { const i = document.createElement("input"); i.value = url; document.body.append(i); i.select(); document.execCommand("copy"); i.remove(); } setDone(true); setTimeout(() => setDone(false), 2000); }
  const ic = rail ? "size-[18px]" : "size-4";
  return (
    <div className={rail ? "flex flex-col items-center gap-2.5" : "flex flex-wrap items-center gap-2"}>
      <span className={rail ? "mb-1 text-[10px] font-bold uppercase tracking-widest text-mute [writing-mode:vertical-rl]" : "mr-1 text-sm font-semibold text-mute"}>{labels.share}</span>
      {links.map(([n, h]) => <a key={n} href={h} target="_blank" rel="noopener noreferrer" aria-label={`${labels.shareVia} ${n}`} title={n} className={cls}><SocialIcon name={n} className={ic} />{!rail && n}</a>)}
      {native && <button type="button" onClick={() => navigator.share({ title, url }).catch(() => {})} aria-label={labels.native} title={labels.native} className={cls}><Share2 className={ic} aria-hidden />{!rail && labels.native}</button>}
      <button type="button" onClick={copy} title={labels.copy} aria-label={labels.copy} className={cls}>{done ? <Check className={ic} aria-hidden /> : <Link2 className={ic} aria-hidden />}{!rail ? <span aria-live="polite">{done ? labels.copied : labels.copy}</span> : <span className="sr-only" aria-live="polite">{done ? labels.copied : ""}</span>}</button>
    </div>
  );
}
