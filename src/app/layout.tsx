import type { Metadata, Viewport } from "next";
import "./globals.css";
// Self-hosted variable fonts (no build-time download). Both ship latin, latin-ext, cyrillic AND cyrillic-ext, which Uzbek letters (Қ Ғ Ҳ) need.
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import { ThemeProvider } from "next-themes";
import { SITE_URL } from "@/lib/settings";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: { default: "ANTIKORRUPSIYA", template: "%s" }, icons: { icon: "/brand/logo.png" }, openGraph: { siteName: "ANTIKORRUPSIYA", images: ["/brand/banner.png"] } };
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#0f2747" }, { media: "(prefers-color-scheme: dark)", color: "#0f1c2f" }] };
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz-Cyrl" suppressHydrationWarning>
      <body><ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider></body>
    </html>
  );
}
