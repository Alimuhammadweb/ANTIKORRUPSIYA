"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomBytes } from "crypto";
import type { Lang } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { canEditArticle, checkTransition, type Status } from "@/lib/workflow";
import { cleanDoc, docHasContent, EMPTY_DOC } from "@/lib/blocks";
import { can } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import { fromLocalInput } from "@/lib/time";

const bounce = (to: string, code: string, kind: "e" | "ok" = "e"): never => redirect(`${to}${to.includes("?") ? "&" : "?"}${kind}=${code}`);
const ids = (f: FormData, k: string) => [...new Set(f.getAll(k).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
const FORMATS = ["NEWS", "PHOTO_NEWS", "GALLERY", "INVESTIGATION", "VIDEO", "INTERVIEW", "ANNOUNCEMENT"] as const;
const Fields = z.object({
  lang: z.enum(["uz", "en", "ru"]), title: z.string().trim().min(1).max(300), description: z.string().trim().max(800).default(""),
  format: z.enum(FORMATS).default("NEWS"), seoTitle: z.string().trim().max(200).default(""), seoDescription: z.string().trim().max(400).default(""),
});

const isUnique = (e: unknown) => (e as { code?: string })?.code === "P2002";
/** One form, one language (Uzbek by default). intent=publish saves and publishes (or submits for review when the user may not publish); intent=save only saves. */
export async function saveArticle(f: FormData) {
  const u = await requirePerm("article.create");
  const lang0 = String(f.get("lang") ?? "uz"), qlang = ["uz", "en", "ru"].includes(lang0) ? lang0 : "uz", intent = f.get("intent") === "publish" ? "publish" : "save";
  let id = Number(f.get("articleId")) || 0;
  const where = () => `/admin/articles/${id || "new"}?lang=${qlang}`;
  const p = Fields.safeParse(Object.fromEntries([...f.entries()].filter(([, v]) => typeof v === "string")));
  if (!p.success) return bounce(where(), p.error.issues[0].path[0] === "title" ? "title_required" : "invalid");
  const d = p.data, lang = d.lang as Lang;
  let doc = EMPTY_DOC; try { doc = cleanDoc(JSON.parse(String(f.get("doc") || "{}"))); } catch { return bounce(where(), "invalid"); }
  if (!docHasContent(doc)) return bounce(where(), "body_required");
  // a repeated submission of the same new post (double click, slow network, browser retry) lands on the record that was already created
  if (!id) { const dup = await db.article.findFirst({ where: { authorId: u.id, createdAt: { gt: new Date(Date.now() - 120_000) }, translations: { some: { lang, title: d.title } } }, select: { id: true } }); if (dup) id = dup.id; }
  const existing = id ? await db.article.findUnique({ where: { id } }) : null;
  if (id && !existing) return bounce("/admin/articles", "not_found");
  if (existing && !canEditArticle(u, existing)) return bounce(where(), "forbidden");
  const catId = Number(f.get("categoryId")) || null, coverId = Number(f.get("coverId")) || null, tagIds = ids(f, "tagIds"), albumIds = ids(f, "albumIds");
  const [cat, cover, tags, album] = await Promise.all([
    catId ? db.category.findUnique({ where: { id: catId } }) : null, coverId ? db.media.findFirst({ where: { id: coverId, kind: "IMAGE" } }) : null,
    db.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } }), db.media.findMany({ where: { id: { in: albumIds }, kind: "IMAGE" }, select: { id: true } }),
  ]);
  if ((catId && !cat) || (coverId && !cover)) return bounce(where(), "invalid");
  const albumOrdered = albumIds.filter((x) => album.some((a) => a.id === x));
  const expiresAt = fromLocalInput(String(f.get("expiresAt") ?? ""));
  // what the Publish button does for this person
  const mayPublish = can(u, "article.publish") || (!!u.canPublish && (!existing || existing.authorId === u.id));
  const goStatus: Status | null = intent !== "publish" || existing?.status === "PUBLISHED" ? null : mayPublish ? "PUBLISHED" : can(u, "article.create") && (!existing || existing.status === "DRAFT" || existing.status === "REJECTED" || can(u, "article.review")) ? "PENDING" : null;
  if (intent === "publish" && existing?.status !== "PUBLISHED" && !goStatus) return bounce(where(), "forbidden");
  const slugBase = slugify(String(f.get("slug") || d.title)) || "post";
  const taken = (slug: string) => db.translation.findFirst({ where: { lang, slug, ...(id ? { NOT: { articleId: id } } : {}) } });
  let slug = slugBase; if (await taken(slug)) slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;
  const run = (slug: string) => db.$transaction(async (tx) => {
    const now = new Date();
    const shared = { format: d.format, categoryId: catId, coverId, expiresAt, tags: { set: tags.map((x) => ({ id: x.id })) },
      ...(goStatus ? { status: goStatus, ...(goStatus === "PUBLISHED" ? { publishedAt: existing?.publishedAt && existing.publishedAt <= now ? existing.publishedAt : now, reviewNote: null } : { submittedAt: now, reviewNote: null }) } : {}) };
    const a = existing ? await tx.article.update({ where: { id }, data: shared }) : await tx.article.create({ data: { ...shared, authorId: u.id, tags: { connect: tags.map((x) => ({ id: x.id })) } } });
    await tx.articleImage.deleteMany({ where: { articleId: a.id } });
    if (albumOrdered.length) await tx.articleImage.createMany({ data: albumOrdered.map((mediaId, position) => ({ articleId: a.id, mediaId, position })) });
    const t = { title: d.title, slug, description: d.description, blocks: doc as object, seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null };
    await tx.translation.upsert({ where: { articleId_lang: { articleId: a.id, lang } }, update: t, create: { ...t, articleId: a.id, lang } });
    if (goStatus === "PUBLISHED") await tx.telegramSubmission.updateMany({ where: { articleId: a.id }, data: { status: "PUBLISHED" } });
    await tx.activity.create({ data: { userId: u.id, action: `${existing ? "edited" : "created"} post (${lang})${goStatus ? ` → ${goStatus}` : ""}`, articleId: a.id } });
    return a;
  });
  let article: Awaited<ReturnType<typeof run>> | null = null;
  try { article = await run(slug); } catch (e) {
    if (isUnique(e)) { try { article = await run(`${slugBase}-${randomBytes(3).toString("hex")}`); } catch (e2) { console.error("saveArticle retry failed", e2); } } else console.error("saveArticle failed", e);
  }
  if (!article) return bounce(where(), "save_failed");
  // do not trust the write: read the record back and make sure it is really in the database
  const saved = await db.translation.findUnique({ where: { articleId_lang: { articleId: article.id, lang } }, select: { title: true, article: { select: { status: true } } } });
  if (!saved || saved.title !== d.title || (goStatus && saved.article.status !== goStatus)) return bounce(where(), "save_failed");
  revalidatePath("/admin/articles"); revalidatePath("/admin");
  if (goStatus === "PUBLISHED") return bounce("/admin/articles", "post_published", "ok");
  if (goStatus === "PENDING") return bounce("/admin/articles", "post_submitted", "ok");
  id = article.id;
  return bounce(where(), existing ? "1" : "post_draft", "ok");
}

const TG: Partial<Record<Status, string>> = { PUBLISHED: "PUBLISHED", REJECTED: "REJECTED", DRAFT: "DRAFTED", PENDING: "DRAFTED" };
export async function changeStatus(f: FormData) {
  const u = await requirePerm("article.create"); const id = Number(f.get("articleId")), to = String(f.get("to")) as Status, lang = String(f.get("lang") ?? "uz");
  const where = f.get("back") === "list" ? "/admin/articles" : `/admin/articles/${id}?lang=${lang}`;
  const a = await db.article.findUnique({ where: { id }, include: { translations: { select: { title: true } } } });
  if (!a) return bounce("/admin/articles", "not_found");
  const chk = checkTransition(u, a, to); if (!chk.ok) return bounce(where, chk.code);
  if (["PENDING", "APPROVED", "PUBLISHED", "SCHEDULED"].includes(to) && !a.translations.some((x) => x.title.trim())) return bounce(where, "need_translation");
  const now = new Date(); let publishedAt = a.publishedAt;
  if (to === "PUBLISHED") publishedAt = a.publishedAt && a.publishedAt <= now ? a.publishedAt : now;
  if (to === "SCHEDULED") { publishedAt = fromLocalInput(String(f.get("publishAt") ?? "")); if (!publishedAt || publishedAt <= now) return bounce(where, "future_date"); }
  const note = to === "REJECTED" ? String(f.get("note") ?? "").trim().slice(0, 1000) || null : null;
  await db.$transaction([
    db.article.update({ where: { id }, data: { status: to, publishedAt, reviewNote: to === "REJECTED" ? note : to === "PENDING" ? null : a.reviewNote, submittedAt: to === "PENDING" ? now : a.submittedAt,
      ...(to !== "PUBLISHED" && to !== "SCHEDULED" ? { trending: false, trendingOrder: null } : {}) } }),
    db.activity.create({ data: { userId: u.id, action: `status ${a.status} → ${to}${note ? ` (${note.slice(0, 80)})` : ""}`, articleId: id } }),
    ...(TG[to] ? [db.telegramSubmission.updateMany({ where: { articleId: id }, data: { status: TG[to]! } })] : []),
  ]);
  revalidatePath("/admin/articles"); revalidatePath(`/admin/articles/${id}`);
  return bounce(where, to === "PUBLISHED" ? "post_published" : to === "DRAFT" && a.status === "PUBLISHED" ? "unpublished" : "status_changed", "ok");
}

export async function deleteArticle(f: FormData) {
  const u = await requirePerm("article.delete"); const id = Number(f.get("articleId")), list = "/admin/articles";
  const a = await db.article.findUnique({ where: { id }, include: { translations: { select: { title: true }, take: 1 } } });
  if (!a) return bounce(list, "not_found");
  try { await db.article.delete({ where: { id } }); } catch (e) { console.error("deleteArticle failed", e); return bounce(list, "delete_failed"); } // cascades translations, album, views, home picks, Telegram marker; breaking-news links are cleared
  if (await db.article.count({ where: { id } })) return bounce(list, "delete_failed"); // verify it is really gone
  await logActivity(u.id, `deleted post "${a.translations[0]?.title ?? id}"`, id);
  revalidatePath(list); revalidatePath("/admin");
  return bounce(list, "deleted", "ok");
}
