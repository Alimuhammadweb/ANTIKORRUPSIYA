import * as React from "react";
import { cn } from "@/lib/cn";
const base = "w-full rounded-lg border border-rule bg-surface px-3 text-sm text-ink shadow-sm transition-[border-color,box-shadow] placeholder:text-mute/80 hover:border-mute/50 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:bg-band disabled:opacity-60";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, r) => <input ref={r} className={cn(base, "h-10", className)} {...p} />);
Input.displayName = "Input";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, r) => <textarea ref={r} className={cn(base, "py-2.5 leading-relaxed", className)} {...p} />);
Textarea.displayName = "Textarea";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, r) => <select ref={r} className={cn(base, "h-10 pr-8", className)} {...p} />);
Select.displayName = "Select";
export const Label = ({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label className={cn("mb-1.5 block text-xs font-semibold text-mute", className)} {...p} />;
export function Field({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
  return <div className={className}><Label>{label}</Label>{children}{hint && <p className="mt-1.5 text-xs leading-snug text-mute">{hint}</p>}</div>;
}
