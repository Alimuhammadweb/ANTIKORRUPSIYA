import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { canViewArticle } from "@/lib/workflow";
import { isLang, type L } from "@/lib/i18n";
import { adminT } from "@/lib/admin-i18n";
import { inc, base } from "@/lib/queries";
import { ArticleView, type FullArticle } from "@/components/article-view";

/** Full-page preview of any article (even drafts) exactly as readers will see it. Visible only to staff allowed to view the article. */
export default async function Preview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const u = await requirePerm("article.create"); const { t } = await adminT(); const sp = await searchParams;
  const a = await db.article.findUnique({ where: { id: Number((await params).id) || 0 }, include: { cover: true, category: true, tags: true, author: { select: { name: true } }, images: { include: { media: true } }, translations: true } });
  if (!a || !canViewArticle(u, a)) notFound();
  const lang: L = isLang(sp.lang ?? "") ? (sp.lang as L) : "uz", tr = a.translations.find((x) => x.lang === lang) ?? a.translations[0]; if (!tr) notFound();
  const rel = await db.article.findMany({ where: base(tr.lang as L, { id: { not: a.id }, categoryId: a.categoryId ?? -1 }), take: 3, orderBy: { publishedAt: "desc" }, include: inc(tr.lang as L) });
  return (
    <div className="-m-4 bg-paper lg:-m-6"><div className="bg-amber-500 p-2 text-center text-sm font-semibold text-black">{t("preview_banner", { status: t(`status_${a.status}`) })}</div>
      <ArticleView a={a as unknown as FullArticle} tr={tr} lang={tr.lang as L} related={rel} preview /></div>
  );
}
