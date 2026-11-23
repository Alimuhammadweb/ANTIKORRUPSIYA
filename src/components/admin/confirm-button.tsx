"use client";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { SubmitButton } from "./submit-button";
import { useT } from "./i18n-client";
/** Asks for confirmation in a clear dialog before a destructive action. Put it inside the <form>: the dialog's confirm button submits that form. */
export function ConfirmButton({ message, title, confirmLabel, children, ...p }: ButtonProps & { message: string; title?: string; confirmLabel?: string }) {
  const { t } = useT(), [open, setOpen] = useState(false), danger = p.variant === "danger";
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [open]);
  return (
    <>
      <Button type="button" {...p} onClick={() => setOpen(true)}>{children}</Button>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg">
          <button type="button" tabIndex={-1} aria-label={t("cancel")} onClick={() => setOpen(false)} className="fade-in absolute inset-0 bg-black/60" />
          <div className="fade-in relative w-full max-w-md rounded-2xl border border-rule bg-surface p-6 text-left shadow-[var(--shadow-lift)]">
            <div className="flex items-start gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${danger ? "bg-red-500/10 text-red-600" : "bg-accent/15 text-accent-ink"}`}><AlertTriangle className="size-5" aria-hidden /></span>
              <div><h2 id="confirm-title" className="text-lg font-extrabold tracking-tight">{title ?? t("confirm_title")}</h2><p id="confirm-msg" className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-mute">{message}</p></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" autoFocus onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <SubmitButton variant={danger ? "danger" : "primary"} className={danger ? "!border-red-600 !bg-red-600 !text-white hover:!bg-red-700" : ""}>{confirmLabel ?? (danger ? t("yes_delete") : t("confirm_yes"))}</SubmitButton>
            </div>
          </div>
        </div>)}
    </>
  );
}
