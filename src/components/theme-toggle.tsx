"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
/** `onDark` styles the button for the navy masthead; otherwise it follows the page colours (admin top bar). */
export function ThemeToggle({ label = "Theme", onDark = true, round }: { label?: string; onDark?: boolean; round?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button type="button" aria-label={label} title={label} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`grid size-[2.1rem] place-items-center rounded-full border transition-colors ${round ? "border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/20" : onDark ? "border-white/15 text-silver hover:border-white/30 hover:bg-white/10 hover:text-white" : "border-rule text-mute hover:bg-band hover:text-ink"}`}>
      <Sun className="hidden size-4 dark:block" aria-hidden /><Moon className="size-4 dark:hidden" aria-hidden />
    </button>
  );
}
