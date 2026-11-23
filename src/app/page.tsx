import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isLang } from "@/lib/i18n";
export const dynamic = "force-dynamic";
// The site opens in Uzbek. The browser language is deliberately ignored: only a language the visitor chose with the language selector (remembered in a cookie) overrides it.
export default async function Root() {
  const saved = (await cookies()).get("site_lang")?.value ?? "";
  redirect(isLang(saved) ? `/${saved}` : "/uz");
}
