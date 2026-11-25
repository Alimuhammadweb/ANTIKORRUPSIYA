import { cache } from "react";
import { db } from "./db";
export type Site = { footer: Record<"uz" | "en" | "ru", string>; telegram: string; facebook: string; x: string; youtube: string; instagram: string; email: string };
export const DEFAULT_SITE: Site = { footer: { uz: "", en: "", ru: "" }, telegram: "https://t.me/antikorruz", facebook: "https://www.facebook.com/JaxongirTulyaganov?mibextid=ZbWKwL", x: "", youtube: "https://www.youtube.com/@jahongir_tulyaganov", instagram: "https://www.instagram.com/jahongir_tolaganov_rasmiy/", email: "" };
const SOCIAL = ["telegram", "facebook", "x", "youtube", "instagram"] as const;
export const getSite = cache(async (): Promise<Site> => {
  const row = await db.platformSetting.findUnique({ where: { key: "site" } }).catch(() => null), v = (row?.value as Partial<Site>) ?? {};
  const site: Site = { ...DEFAULT_SITE, ...v, footer: { ...DEFAULT_SITE.footer, ...(v.footer ?? {}) } };
  // A link left empty in the admin panel falls back to the official account (so the icons never disappear by accident).
  for (const k of SOCIAL) if (!site[k]) site[k] = DEFAULT_SITE[k];
  return site;
});
export const setSite = (v: Site) => db.platformSetting.upsert({ where: { key: "site" }, update: { value: v }, create: { key: "site", value: v } });
export const SITE_URL = (process.env.SITE_URL ?? "https://antikorrupsiya.uz").replace(/\/$/, "");
