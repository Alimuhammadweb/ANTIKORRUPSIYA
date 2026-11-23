"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
/** Open/close state for a menu button: closes on outside press, Escape (focus returns to the button), focus leaving, and navigation. Arrow keys move between items. */
export function useDropdown() {
  const [open, setOpen] = useState(false), ref = useRef<HTMLDivElement>(null), path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); ref.current?.querySelector<HTMLElement>("[data-trigger]")?.focus(); } };
    document.addEventListener("pointerdown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  const items = () => [...(ref.current?.querySelectorAll<HTMLElement>("[data-item]") ?? [])];
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault(); if (!open) { setOpen(true); setTimeout(() => items()[0]?.focus(), 0); return; }
    const l = items(), i = l.indexOf(document.activeElement as HTMLElement); l[(i + (e.key === "ArrowDown" ? 1 : -1) + l.length) % l.length]?.focus();
  };
  const onBlur = (e: React.FocusEvent) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); };
  return { open, setOpen, ref, onKeyDown, onBlur };
}
