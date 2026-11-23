import { test } from "node:test";
import assert from "node:assert/strict";
import { can, checkUserChange, manageableRoles } from "../src/lib/permissions";
import { checkTransition, allowedNext, canEditArticle, EDGES, STATUSES } from "../src/lib/workflow";
import { slugify } from "../src/lib/slug";
import { parseVideoUrl } from "../src/lib/embed";
import { cleanDoc, plainText, firstVideo, mediaUrls, safeUrl } from "../src/lib/blocks";

const J = { id: 1, role: "JOURNALIST" as const }, JP = { ...J, canPublish: true }, E = { id: 2, role: "EDITOR" as const }, A = { id: 3, role: "ADMIN" as const }, S = { id: 4, role: "SUPER_ADMIN" as const };

test("permissions matrix", () => {
  assert.ok(can(J, "article.create")); assert.ok(!can(J, "article.publish")); assert.ok(!can(J, "trending.manage"));
  assert.ok(can(E, "article.publish") && can(E, "trending.manage") && can(E, "telegram.review")); assert.ok(!can(E, "homepage.manage") && !can(E, "users.manage"));
  assert.ok(can(A, "homepage.manage") && can(A, "users.manage") && can(A, "breaking.manage") && !can(A, "settings.manage"));
  assert.ok(can(S, "settings.manage"));
});
test("journalist cannot publish unless authorised, and only for own articles", () => {
  const own = { status: "DRAFT" as const, authorId: 1 }, other = { status: "DRAFT" as const, authorId: 9 };
  assert.deepEqual(checkTransition(J, own, "PUBLISHED"), { ok: false, code: "forbidden" });
  assert.deepEqual(checkTransition(JP, own, "PUBLISHED"), { ok: true });
  assert.equal(checkTransition(JP, other, "PUBLISHED").ok, false);
  assert.ok(checkTransition(J, own, "PENDING").ok); assert.ok(!checkTransition(J, other, "PENDING").ok);
});
test("only editors approve / reject / archive", () => {
  const p = { status: "PENDING" as const, authorId: 1 };
  assert.ok(!checkTransition(J, p, "APPROVED").ok); assert.ok(!checkTransition(J, p, "REJECTED").ok);
  assert.ok(checkTransition(E, p, "APPROVED").ok); assert.ok(checkTransition(E, p, "REJECTED").ok);
  assert.ok(!checkTransition(JP, { status: "PUBLISHED", authorId: 1 }, "ARCHIVED").ok);
  assert.ok(checkTransition(E, { status: "PUBLISHED", authorId: 1 }, "ARCHIVED").ok);
});
test("invalid edges are refused for everyone", () => {
  for (const to of STATUSES) if (!EDGES.ARCHIVED.includes(to)) assert.equal(checkTransition(S, { status: "ARCHIVED", authorId: null }, to).ok, false);
  assert.equal(checkTransition(S, { status: "DRAFT", authorId: null }, "APPROVED").ok, false);
  assert.equal(checkTransition(S, { status: "PUBLISHED", authorId: null }, "PENDING").ok, false);
});
test("allowedNext mirrors checkTransition and journalists can withdraw / resubmit", () => {
  assert.deepEqual(allowedNext(J, { status: "DRAFT", authorId: 1 }), ["PENDING"]);
  assert.deepEqual(allowedNext(J, { status: "REJECTED", authorId: 1 }).sort(), ["DRAFT", "PENDING"]);
  assert.ok(allowedNext(E, { status: "PUBLISHED", authorId: 1 }).includes("DRAFT"));
});
test("editing rights", () => {
  assert.ok(canEditArticle(J, { status: "DRAFT", authorId: 1 })); assert.ok(!canEditArticle(J, { status: "PENDING", authorId: 1 }));
  assert.ok(!canEditArticle(J, { status: "DRAFT", authorId: 2 })); assert.ok(canEditArticle(E, { status: "PUBLISHED", authorId: 1 }));
});
test("staff management rules", () => {
  const t = { id: 5, role: "EDITOR" as const, active: true };
  assert.equal(checkUserChange({ actor: A, target: t, newRole: "ADMIN", newActive: true, otherActiveSuperAdmins: 1 }), "forbidden");
  assert.equal(checkUserChange({ actor: A, target: t, newRole: "JOURNALIST", newActive: true, otherActiveSuperAdmins: 1 }), null);
  assert.equal(checkUserChange({ actor: S, target: t, newRole: "ADMIN", newActive: true, otherActiveSuperAdmins: 0 }), null);
  assert.equal(checkUserChange({ actor: A, target: { id: 3, role: "ADMIN", active: true }, newRole: "SUPER_ADMIN", newActive: true, otherActiveSuperAdmins: 1 }), "self");
  assert.equal(checkUserChange({ actor: A, target: { id: 4, role: "SUPER_ADMIN", active: true }, newRole: "EDITOR", newActive: true, otherActiveSuperAdmins: 1 }), "forbidden");
  const last = { id: 4, role: "SUPER_ADMIN" as const, active: true };
  assert.equal(checkUserChange({ actor: { id: 9, role: "SUPER_ADMIN" }, target: last, newRole: "ADMIN", newActive: true, otherActiveSuperAdmins: 0 }), "last_super");
  assert.equal(checkUserChange({ actor: { id: 9, role: "SUPER_ADMIN" }, target: last, newRole: "SUPER_ADMIN", newActive: false, otherActiveSuperAdmins: 0 }), "last_super");
  assert.deepEqual(manageableRoles("EDITOR"), []);
});
test("slugify transliterates Cyrillic and stays URL safe", () => {
  assert.equal(slugify("Коррупция в судах!"), "korruptsiya-v-sudax");
  assert.equal(slugify("Ўзбекистон қонунлари"), "ozbekiston-qonunlari");
  assert.equal(slugify("  Hello, World -- 2026 "), "hello-world-2026"); assert.equal(slugify("???"), "");
});
test("video URL validation", () => {
  assert.equal(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.embed, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  assert.equal(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")?.provider, "youtube");
  assert.equal(parseVideoUrl("https://vimeo.com/76979871")?.embed, "https://player.vimeo.com/video/76979871");
  assert.equal(parseVideoUrl("https://cdn.example.org/a/b.mp4")?.provider, "file");
  for (const bad of ["http://youtu.be/dQw4w9WgXcQ", "javascript:alert(1)", "https://evil.example/watch?v=1", "https://example.org/x.exe", "not a url"]) assert.equal(parseVideoUrl(bad), null, bad);
});
test("cleanDoc keeps supported blocks and strips anything unsafe", () => {
  const doc = cleanDoc({ type: "doc", content: [
    { type: "paragraph", content: [{ type: "text", text: "Hi", marks: [{ type: "bold" }, { type: "link", attrs: { href: "javascript:alert(1)" } }, { type: "underline" }] }] },
    { type: "script", content: [{ type: "text", text: "x" }] },
    { type: "image", attrs: { src: "javascript:alert(1)" } }, { type: "image", attrs: { src: "https://m.example/a.jpg", alt: "A", caption: "C", credit: "D", onerror: "x" } },
    { type: "gallery", attrs: { items: [{ src: "/api/media/0b1c2d3e-0000-4000-8000-000000000002.jpg", caption: "one" }, { src: "data:text/html,x" }] } },
    { type: "video", attrs: { src: "https://youtu.be/dQw4w9WgXcQ" } }, { type: "video", attrs: { src: "https://evil.example/x" } },
    { type: "document", attrs: { src: "https://m.example/a.pdf", title: "Report", size: 1234, mime: "application/pdf" } },
    { type: "table", content: [{ type: "tableRow", content: [{ type: "tableHeader", attrs: { colspan: 1 }, content: [{ type: "paragraph", content: [{ type: "text", text: "H" }] }] }] }] },
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "T" }] },
  ] });
  const types = doc.content!.map((n) => n.type);
  assert.deepEqual(types, ["paragraph", "image", "gallery", "video", "document", "table", "heading"]);
  assert.deepEqual(doc.content![0].content![0].marks, [{ type: "bold" }]);
  assert.equal(doc.content![1].attrs!.onerror, undefined); assert.equal(doc.content![2].attrs!.items.length, 1); assert.equal(doc.content![6].attrs!.level, 2);
  assert.equal(firstVideo(doc)?.provider, "youtube"); assert.equal(plainText(doc), "Hi H T");
  assert.deepEqual(mediaUrls(doc).sort(), ["/api/media/0b1c2d3e-0000-4000-8000-000000000002.jpg", "https://m.example/a.jpg", "https://m.example/a.pdf", "https://youtu.be/dQw4w9WgXcQ"].sort());
  assert.deepEqual(cleanDoc("garbage"), { type: "doc", content: [] });
});
test("safeUrl", () => { assert.equal(safeUrl("//evil.com"), null); assert.equal(safeUrl("/a/b"), "/a/b"); assert.equal(safeUrl("data:x"), null); });
import { fromLocalInput, toLocalInput } from "../src/lib/time";
test("newsroom time zone conversion round-trips", () => {
  const d = fromLocalInput("2026-11-21T10:30", 300)!;
  assert.equal(d.toISOString(), "2026-11-21T05:30:00.000Z"); assert.equal(toLocalInput(d, 300), "2026-11-21T10:30");
  assert.equal(fromLocalInput("", 300), null); assert.equal(fromLocalInput("garbage", 300), null);
});
test("library videos with a relative library (/api/media) path are accepted, other relative files are not", () => {
  const d = cleanDoc({ type: "doc", content: [{ type: "video", attrs: { src: "/api/media/0b1c2d3e-0000-4000-8000-000000000001.mp4" } }, { type: "video", attrs: { src: "/etc/passwd" } }] });
  assert.equal(d.content!.length, 1); assert.equal(d.content![0].attrs!.provider, "file");
});
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DICT } from "../src/lib/admin-dict";
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
test("admin dictionary: every language has every key and every placeholder", () => {
  const ks = Object.keys(DICT.en);
  for (const l of ["uz", "ru"] as const) {
    assert.deepEqual(Object.keys(DICT[l]).sort(), ks.slice().sort(), `${l} keys`);
    for (const k of ks) { const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(); assert.equal(ph((DICT[l] as Record<string, string>)[k]), ph((DICT.en as Record<string, string>)[k]), `${l}.${k} placeholders`); assert.ok((DICT[l] as Record<string, string>)[k].length > 0); }
  }
  assert.ok(!/[a-zA-Z]{4,}/.test(Object.values(DICT.uz).filter((v) => !/YouTube|Vimeo|https|JPEG|PNG|WebP|MP4|WebM|PDF|URL|SEO|Telegram|Facebook|\.mp4|alt|cookie|IP|courts/i.test(v)).join(" ").replace(/\{\w+\}/g, "")), "Uzbek strings must be Cyrillic");
});
test("every static admin t('key') used in source exists in the dictionary", () => {
  const used = new Set<string>();
  for (const f of walk("src").filter((f) => /\.tsx?$/.test(f))) for (const m of readFileSync(f, "utf8").matchAll(/\bt\("([a-zA-Z0-9_]+)"/g)) used.add(m[1]);
  const missing = [...used].filter((k) => !(k in DICT.en)); assert.deepEqual(missing, []);
});
test("dynamic admin key families are complete", () => {
  const need = ["status_DRAFT", "status_PENDING", "status_APPROVED", "status_SCHEDULED", "status_PUBLISHED", "status_REJECTED", "status_ARCHIVED", "do_DRAFT", "do_PENDING", "do_APPROVED", "do_SCHEDULED", "do_PUBLISHED", "do_REJECTED", "do_ARCHIVED", "role_JOURNALIST", "role_EDITOR", "role_ADMIN", "role_SUPER_ADMIN", "tg_RECEIVED", "tg_DRAFTED", "tg_PUBLISHED", "tg_REJECTED", "ann_active", "ann_expired", "ann_upcoming", "use_cover", "use_album", "use_body", "kind_IMAGE", "kind_VIDEO", "kind_DOCUMENT", "home_HERO", "home_SECONDARY", "home_LATEST", "home_POPULAR", "home_TRENDING", "home_INVESTIGATIONS", "home_MEDIA", "home_ANNOUNCEMENTS", "home_CATEGORY", "stat_total", "stat_published", "stat_drafts", "stat_pending", "stat_scheduled", "stat_views", "views_period", "avg_daily", "best_day", "views_all_time"];
  for (const k of need) assert.ok(k in DICT.en, k);
  const FORMATS = ["NEWS", "PHOTO_NEWS", "GALLERY", "INVESTIGATION", "VIDEO", "INTERVIEW", "ANNOUNCEMENT"]; for (const f of FORMATS) assert.ok(`format_${f}` in DICT.en);
  const codes = new Set<string>(); for (const f of walk("src").filter((f) => /\.tsx?$/.test(f))) for (const m of readFileSync(f, "utf8").matchAll(/(?:e=|bounce\([^,]+,\s*"|back\([^,]+,\s*"e=|go\("e=|go\(`[^`]*e=)([a-z_]+)/g)) codes.add(m[1]);
  const miss = [...codes].filter((c) => !(`err_${c}` in DICT.en || `ok_${c}` in DICT.en)); assert.deepEqual(miss, []);
});

test("docHasContent: text or media counts, empty paragraphs do not", async () => {
  const { docHasContent } = await import("../src/lib/blocks");
  assert.equal(docHasContent({ type: "doc", content: [] }), false);
  assert.equal(docHasContent({ type: "doc", content: [{ type: "paragraph" }, { type: "paragraph", content: [{ type: "text", text: "  " }] }] }), false);
  assert.equal(docHasContent({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Салом" }] }] }), true);
  assert.equal(docHasContent({ type: "doc", content: [{ type: "image", attrs: { src: "/api/media/x.png" } }] }), true);
});

test("pickTr: visitor language first, then Uzbek, then anything; never empty when a translation exists", async () => {
  const { pickTr } = await import("../src/lib/queries");
  const uz = { lang: "uz" }, en = { lang: "en" }, ru = { lang: "ru" };
  assert.deepEqual(pickTr([uz, en], "en"), [en]);
  assert.deepEqual(pickTr([ru, uz], "en"), [uz]);
  assert.deepEqual(pickTr([ru], "en"), [ru]);
  assert.deepEqual(pickTr([], "en"), []);
});
