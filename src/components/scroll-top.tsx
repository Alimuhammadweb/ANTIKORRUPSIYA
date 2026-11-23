"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
export function ScrollTop({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const f = () => setShow(scrollY > 900); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);
  return <button type="button" aria-label={label} title={label} tabIndex={show ? 0 : -1} onClick={() => scrollTo({ top: 0, behavior: "smooth" })} className={`no-print fixed bottom-5 right-4 z-40 grid size-11 place-items-center rounded-full bg-navy text-white shadow-lg ring-1 ring-white/10 transition-all duration-200 hover:bg-accent hover:text-navy sm:right-6 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}><ArrowUp className="size-5" aria-hidden /></button>;
}
