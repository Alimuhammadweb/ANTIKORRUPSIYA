import { cn } from "@/lib/cn";
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("rounded-xl border border-rule bg-surface shadow-[var(--shadow-card)]", className)} {...p} />;
export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("flex items-center gap-2 border-b border-rule px-5 py-3.5 text-sm font-bold tracking-tight", className)} {...p} />;
export const CardBody = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-5", className)} {...p} />;
const TONES = {
  gray: "bg-band text-mute ring-rule", green: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400", amber: "bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-400",
  red: "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-400", blue: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-400",
};
const DOT = { gray: "bg-mute/60", green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500", blue: "bg-sky-500" };
export const Badge = ({ tone = "gray", className, children, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof TONES }) => (
  <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 font-sans text-[11px] font-semibold ring-1 ring-inset", TONES[tone], className)} {...p}><i className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden />{children}</span>
);
