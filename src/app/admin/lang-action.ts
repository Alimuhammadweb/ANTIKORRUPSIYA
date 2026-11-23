"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { ADMIN_LANG_COOKIE } from "@/lib/admin-i18n";
export async function setAdminLang(f: FormData) {
  const l = String(f.get("lang")), back = String(f.get("back") ?? "/admin");
  if (isLang(l)) (await cookies()).set(ADMIN_LANG_COOKIE, l, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
  redirect(back.startsWith("/admin") ? back : "/admin");
}
