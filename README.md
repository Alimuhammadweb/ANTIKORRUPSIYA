# ANTIKORRUPSIYA

Multilingual (Uzbek Cyrillic · English · Russian) anti-corruption media platform: public news site + private newsroom CMS.
Next.js App Router · React · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma · TipTap.

## Run it locally

```bash
cp .env.example .env            # fill DATABASE_URL, BOT_API_SECRET, SEED_ADMIN_*
npm install
npx prisma generate
npx prisma migrate deploy       # applies prisma/migrations (or: npm run db:push)
SEED_DEMO=1 npm run db:seed     # categories, homepage sections, first Super Admin (+ 3 demo articles)
npm run dev                     # http://localhost:3000  ·  admin: /admin
```
Checks: `npm run typecheck && npm run lint && npm test && npm run build`

## Deploy
1. Create a PostgreSQL database; set `DATABASE_URL`. Run `npx prisma migrate deploy` and `npm run db:seed` once.
2. Storage: **PostgreSQL only.** Uploaded images, video and PDFs are stored as `BYTEA` (`MediaFile.data`) in the same database and served by `GET /api/media/<id>.<ext>`. There is no S3/R2/Blob/local-disk storage and nothing to configure besides `DATABASE_URL`.
   Upload limits (`src/lib/media.ts`): image 10 MB, video 50 MB, PDF 20 MB. Uploads pass through the application, so the host's request-body limit also applies (Vercel serverless functions accept about 4.5 MB per request; self-hosted Node has no such limit).
   Upgrading a database that already has files on external storage: run `npx prisma migrate deploy`, then `npm run media:import` once (downloads each old file by its stored URL into PostgreSQL and rewrites the URLs in articles). Do not shut the old storage down before it reports `0 failed`.
3. Set `SITE_URL`, `BOT_API_SECRET`, `CRON_SECRET`. `vercel.json` calls `/api/cron/publish` every 5 minutes (needs a plan that allows it; any scheduler can call it with `Authorization: Bearer $CRON_SECRET`).
   Due scheduled articles are also treated as visible by the public site, so readers never wait for the job.
4. Telegram: the bot (separate project) talks to two routes, both with `Authorization: Bearer $BOT_API_SECRET`: `GET /api/bot/categories` (active categories: `id`, `key`, `name`, `slug`, `names{uz,en,ru}`, `slugs{…}`) and `POST /api/bot/posts` (multipart; see the header of `src/app/api/bot/posts/route.ts`). Every request also needs `X-Telegram-User-Id`, which must be listed in `TELEGRAM_ADMIN_IDS` on the server (an empty list denies everyone; the check is independent of the bot's own list). Posts are written in Uzbek Cyrillic only, saved as `PUBLISHED` and are public at once (no approval step); the response carries `status`, `title`, `path` and `url`. An unknown or inactive `category` key is refused with 422 `unknown_category` (nothing is stored). Resending the same post (same `Idempotency-Key`) never creates a duplicate. Vercel limits a request body to 4.5 MB, so keep the total size of the images in one request below that.

## Roles (all checked on the server: `src/lib/permissions.ts`, `src/lib/workflow.ts`)
Journalist (create/edit own drafts, upload, translate, submit; may publish own only if an admin ticks "may publish") · Editor (review, approve/reject, publish, schedule, Trending, announcements, analytics) · Administrator (+ homepage, breaking news, categories/tags, media deletion, staff below Administrator) · Super Admin (+ all staff/roles, platform settings). No self-escalation; the last active Super Admin cannot be demoted or disabled.

## Layout
`src/lib` pure logic + server helpers · `src/app/[lang]` public site · `src/app/admin` CMS · `src/app/api` upload / bot / cron / view / switch · `tests` unit tests.

## Known limits (read this)
* Everything below was written in an environment where Prisma's engine download was blocked, so `prisma generate`, `migrate`, `next build` and the app itself **were not run there**. See the checklist for exactly what was verified.
* `prisma/migrations/20261121000000_init/migration.sql` was written by hand to match `schema.prisma` and applied successfully to PostgreSQL 16. Confirm with `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <url> --exit-code` (should report no difference); if it does, run `prisma migrate dev` once to regenerate.
* UI primitives in `src/components/ui` are hand-written shadcn-style components (not generated with the shadcn CLI).

---
## Requirement checklist (honest)
"Written" = implemented in code and reviewed. "Run" = actually executed here. Nothing marked Run unless it was.

| # | Requirement | Status | Evidence / caveat |
|---|---|---|---|
| 1 | Public site works without login | COMPLETE (written) | no auth in `[lang]` routes. Not run in a browser. |
| 2 | Admin restricted to staff | COMPLETE (written) | middleware + `requirePerm` in every page/action/API; login rate-limited. Not run. |
| 3 | Four roles work | COMPLETE (written) | permission matrix + workflow + user rules: **unit tests Run, passing (16 total)** |
| 4 | Public pages use real DB content | COMPLETE (written) | no hardcoded articles; not run against a live DB via Prisma |
| 5 | Every admin section functional | COMPLETE (written) | dashboard, articles, preview, media, homepage, breaking, categories, tags, staff, trending, announcements, analytics, Telegram, activity, settings. Not run. |
| 6 | Editor supports all blocks | COMPLETE (written) | paragraph, headings, bold/italic, lists, quote, link, divider, image (alt/caption/credit), gallery (add/remove/reorder/captions), video (upload or URL), document, table. Body sanitiser (`cleanDoc`) **Run in tests**. Editor UI itself not run in a browser. |
| 7 | Media stored in PostgreSQL | see verification notes | Upload API -> server-side type/size validation -> `BYTEA` in PostgreSQL, SHA-256 de-duplication, served by `/api/media/<id>.<ext>` with Range support. |
| 8 | Homepage & Breaking News controlled from admin | COMPLETE (written) | "Preview" opens the live pages (saved config is live immediately; there is no separate unsaved-draft preview). |
| 9 | Categories & tags fully manageable | COMPLETE (written) | localized names/slugs/descriptions; delete refused while articles use a category. |
| 10 | Staff & permissions manageable | COMPLETE (written) | rules Run in unit tests. |
| 11 | Trending selection & order | COMPLETE (written) | public page uses exactly `trending` + `trendingOrder`. |
| 12 | Announcement expiry | COMPLETE (written) | hidden from public queries after `expiresAt`, kept in DB/admin. |
| 13 | Analytics from real data | COMPLETE (written) | SQL **Run on PostgreSQL 16** (daily series, top articles/categories). Charts not rendered. Referrer/device traffic stats are intentionally not collected (privacy). |
| 14 | Three languages everywhere | COMPLETE (written) | public + admin dictionaries; **tests Run**: all keys/placeholders present in uz/en/ru, every used key exists. Content quality of translations needs a native review. |
| 15 | Telegram submissions with media & review | COMPLETE (written) | idempotent, albums, same PostgreSQL media storage. Bot images are posted to the function (Telegram-sized, limit 10); not tested with the real bot. |
| 16 | SEO & sitemap | COMPLETE (written) | metadata, canonical, hreflang, OG, JSON-LD, sitemap (published only), robots, `X-Robots-Tag` on admin/api. |
| 17 | No placeholders | COMPLETE (written) | see "Data model" note below for design deviations. |
| 18 | Passes all tests executable here | COMPLETE | Run: 16 unit tests pass; ESLint 0 errors/0 warnings; TypeScript check clean **against a loose stand-in for the Prisma types** (so Prisma-typed query mistakes are not caught); migration SQL applies on PostgreSQL 16; search / rate-limit / analytics / usage SQL verified. |
| — | `prisma generate`, schema validate, `migrate`, **production build**, API/workflow tests against a DB | **NOT COMPLETE** | blocked here (Prisma engine host unreachable). Run the commands above locally. |
| — | Browser journeys (visitor / journalist / editor / admin) | **NOT COMPLETE** | not executed; the app was never started here. |

### Data-model notes (deviations from the spec's wording)
Roles/permissions are a code matrix (not tables). Category/tag translations are `{uz,en,ru}` JSON fields on the row. Article galleries live as a block inside the TipTap document (`ArticleImage` holds the ordered photo album used by Telegram posts); there is no separate Gallery table. Daily analytics are `ArticleView` rows (per article per day).

## Design system (2026 redesign)

The whole frontend (public site **and** newsroom CMS) shares one design system; no backend, API, Prisma, auth or upload code was touched.

- **Tokens** live in `src/app/globals.css` (`@theme` + light/dark CSS variables): ink-navy `navy`, logo-amber `accent` (text-safe variant `accent-ink`), crimson `breaking` (ticker only), surfaces `paper / surface / band`, `rule`, `mute`.
- **Type**: Source Serif 4 (headlines, article body) + Inter (UI, meta), both self-hosted through `@fontsource-variable/*` (no Google download at build time). Both include `cyrillic-ext`, so Uzbek letters (Қ Ғ Ҳ Ў) render in the real font instead of a fallback.
- **Public components**: `components/listing.tsx` (cards, rows, section heads, pager, page header), `nav-links`, `mobile-nav` (accessible drawer), `ticker` (marquee), `article-view` (reading layout, share rail).
- **Homepage** still follows the admin's section order; neighbouring sections are composed into layouts (HERO+SECONDARY → lead grid, LATEST+POPULAR/TRENDING → feed with sidebar).
- **Admin**: `app/admin/(panel)/layout.tsx` (sidebar, top bar, mobile drawer), `components/admin/*`, `components/ui/*`, and the `.tbl` / `.tbl-wrap` table classes.
- New UI strings were added to `lib/i18n.ts` and `lib/admin-dict.ts` in all three languages (the test suite enforces this).

### Public redesign v2 (portal layout)

- Header: date, social icons, **language dropdown** (`components/lang-switch.tsx`), theme toggle, logo, search, and a sticky nav with a **Categories dropdown** (`components/nav-menu.tsx`; accordion in the mobile drawer). Shared open/close behaviour lives in `components/use-dropdown.ts` (outside click, Escape, arrow keys).
- Videos and Interviews are not in the public navigation, footer or homepage (the `/videos` and `/interviews` routes and the admin settings are untouched).
- Homepage: featured slider (`components/hero-slider.tsx`) + latest-news rail, then Popular / Investigations / Announcements cards. To get several slides, set *Articles shown* for "Main featured story" to 2-5 in Admin → Homepage.
- The admin panel is unchanged: shared CSS was only appended to, and `ThemeToggle` gained an optional prop.

## Posts and languages (latest change)
- A post is written **once**, normally in Uzbek (Admin → Posts → Create post). Publish saves and publishes in one click; "Save as draft" only saves. Translations are optional ("Translations" panel on the edit page) and are never auto-created.
- The public site opens in **Uzbek** (`/uz`) for every first-time visitor, whatever the browser language. The language selector changes the interface language and remembers the choice (cookie `site_lang`). Posts are shown in their original language when no real translation exists.
- Posts can be deleted at any status (confirmation dialog first). The old "Telegram queue" admin page was removed; `/api/bot/posts` is unchanged for the bot.
- Header banner: `public/brand/header-banner.webp` (top right of the desktop header).
