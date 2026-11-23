import { cache } from "react";
import { db } from "./db";
export type Site = { footer: Record<"uz" | "en" | "ru", string>; telegram: string; facebook: string; x: string; youtube: string; email: string };
export const DEFAULT_SITE: Site = { footer: { uz: "", en: "", ru: "" }, telegram: "", facebook: "", x: "", youtube: "", email: "" };
export const getSite = cache(async (): Promise<Site> => {
  const row = await db.platformSetting.findUnique({ where: { key: "site" } }).catch(() => null);
  return { ...DEFAULT_SITE, ...((row?.value as Partial<Site>) ?? {}), footer: { ...DEFAULT_SITE.footer, ...(((row?.value as Partial<Site>) ?? {}).footer ?? {}) } };
});
export const setSite = (v: Site) => db.platformSetting.upsert({ where: { key: "site" }, update: { value: v }, create: { key: "site", value: v } });
export const SITE_URL = (process.env.SITE_URL ?? "https://antikorrupsiya.uz").replace(/\/$/, "");
