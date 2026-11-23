import { CheckCircle2, AlertCircle } from "lucide-react";
import { adminT } from "@/lib/admin-i18n";
import { Badge } from "@/components/ui/card";
import type { Status } from "@/lib/workflow";

const TONE: Record<Status, "gray" | "amber" | "blue" | "green" | "red"> = { DRAFT: "gray", PENDING: "amber", APPROVED: "blue", SCHEDULED: "blue", PUBLISHED: "green", REJECTED: "red", ARCHIVED: "gray" };
export async function StatusBadge({ s }: { s: Status }) { const { t } = await adminT(); return <Badge tone={TONE[s]}>{t(`status_${s}`)}</Badge>; }
/** Success / error banner driven by ?ok= and ?e= (codes translated in the staff member's language). */
export async function Flash({ sp }: { sp: { e?: string; ok?: string } }) {
  const { t } = await adminT();
  if (sp.e) return <p role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm font-medium text-red-700 dark:text-red-300"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{t(`err_${sp.e}`)}</p>;
  if (sp.ok) return <p role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />{t(sp.ok === "1" ? "saved" : `ok_${sp.ok}`)}</p>;
  return null;
}
export const PageHead = ({ title, children, sub }: { title: string; children?: React.ReactNode; sub?: string }) => (
  <div className="mb-6 flex flex-wrap items-end gap-x-4 gap-y-3"><div className="min-w-0"><h1 className="text-2xl font-extrabold tracking-tight md:text-[1.7rem]">{title}</h1>{sub && <p className="mt-1 text-sm text-mute">{sub}</p>}</div><div className="ml-auto flex flex-wrap items-center gap-2">{children}</div></div>
);
export function AdminPager({ base, params, page, pages, prev, next }: { base: string; params: Record<string, string | undefined>; page: number; pages: number; prev: string; next: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => { const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]); q.set("page", String(p)); return `${base}?${q}`; };
  const c = "inline-flex h-9 items-center rounded-lg border border-rule bg-surface px-4 text-sm font-semibold shadow-sm transition-colors hover:border-mute/50 hover:bg-band";
  return <nav className="mt-6 flex items-center justify-between">{page > 1 ? <a className={c} href={href(page - 1)}>← {prev}</a> : <span />}<span className="text-sm font-medium text-mute">{page} / {pages}</span>{page < pages ? <a className={c} href={href(page + 1)}>{next} →</a> : <span />}</nav>;
}
