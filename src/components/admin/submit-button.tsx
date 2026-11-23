"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useT } from "./i18n-client";
/** Submit button that is disabled while the form is being saved, so a double click can never send the same post twice. */
export function SubmitButton({ children, disabled, ...p }: ButtonProps) {
  const { pending, data } = useFormStatus(), { t } = useT();
  const mine = pending && (!p.name || data?.get(p.name) === p.value);
  return <Button type="submit" {...p} disabled={pending || disabled} aria-busy={pending}>{mine && <Loader2 className="size-4 animate-spin" aria-hidden />}{mine ? t("saving") : children}</Button>;
}
