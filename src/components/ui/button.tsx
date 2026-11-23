import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
// Newsroom button system. "primary" is the one call-to-action per view (amber); "default" is the quiet navy action.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-sans text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45",
  { variants: {
    variant: {
      default: "bg-navy text-white shadow-sm hover:bg-navy-2 dark:bg-white/10 dark:hover:bg-white/15",
      primary: "bg-accent text-navy shadow-sm hover:bg-accent-strong",
      outline: "border border-rule bg-surface text-ink shadow-sm hover:border-mute/50 hover:bg-band",
      ghost: "text-ink hover:bg-band",
      danger: "border border-red-500/40 bg-surface text-red-600 hover:bg-red-600 hover:text-white dark:text-red-400",
    },
    size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", icon: "size-9" },
  }, defaultVariants: { variant: "default", size: "default" } },
);
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...p }, ref) => <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...p} />);
Button.displayName = "Button";
