"use server";
import { redirect } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { setSite, DEFAULT_SITE } from "@/lib/settings";
export async function saveSettings(f: FormData) {
  const u = await requirePerm("settings.manage"); const s = (k: string, n = 300) => String(f.get(k) ?? "").trim().slice(0, n);
  const url = (k: string) => { const v = s(k, 300); return v && !/^https:\/\//i.test(v) ? null : v; };
  const tg = url("telegram"), fb = url("facebook"), x = url("x"), yt = url("youtube"), ig = url("instagram"); if ([tg, fb, x, yt, ig].some((v) => v === null)) redirect("/admin/settings?e=invalid");
  await setSite({ ...DEFAULT_SITE, footer: { uz: s("footer_uz"), en: s("footer_en"), ru: s("footer_ru") }, telegram: tg!, facebook: fb!, x: x!, youtube: yt!, instagram: ig!, email: s("email", 200) });
  await logActivity(u.id, "platform settings saved"); redirect("/admin/settings?ok=1");
}
