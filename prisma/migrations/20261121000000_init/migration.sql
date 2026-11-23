-- CreateEnum
CREATE TYPE "Lang" AS ENUM ('uz', 'en', 'ru');
CREATE TYPE "Format" AS ENUM ('NEWS', 'PHOTO_NEWS', 'GALLERY', 'INVESTIGATION', 'VIDEO', 'INTERVIEW', 'ANNOUNCEMENT');
CREATE TYPE "Status" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');
CREATE TYPE "Role" AS ENUM ('JOURNALIST', 'EDITOR', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "HomeKind" AS ENUM ('HERO', 'SECONDARY', 'LATEST', 'POPULAR', 'TRENDING', 'INVESTIGATIONS', 'MEDIA', 'ANNOUNCEMENTS', 'CATEGORY');

-- CreateTable
CREATE TABLE "Category" ("id" SERIAL NOT NULL, "key" TEXT NOT NULL, "order" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true, "names" JSONB NOT NULL, "slugs" JSONB NOT NULL DEFAULT '{}', "descriptions" JSONB NOT NULL DEFAULT '{}', CONSTRAINT "Category_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Tag" ("id" SERIAL NOT NULL, "key" TEXT NOT NULL, "names" JSONB NOT NULL, "slugs" JSONB NOT NULL DEFAULT '{}', CONSTRAINT "Tag_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Article" ("id" SERIAL NOT NULL, "format" "Format" NOT NULL DEFAULT 'NEWS', "status" "Status" NOT NULL DEFAULT 'DRAFT', "trending" BOOLEAN NOT NULL DEFAULT false, "trendingOrder" INTEGER, "expiresAt" TIMESTAMP(3), "views" INTEGER NOT NULL DEFAULT 0, "publishedAt" TIMESTAMP(3), "submittedAt" TIMESTAMP(3), "reviewNote" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "categoryId" INTEGER, "authorId" INTEGER, "coverId" INTEGER, CONSTRAINT "Article_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Translation" ("id" SERIAL NOT NULL, "articleId" INTEGER NOT NULL, "lang" "Lang" NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL DEFAULT '', "blocks" JSONB NOT NULL, "seoTitle" TEXT, "seoDescription" TEXT, CONSTRAINT "Translation_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Media" ("id" SERIAL NOT NULL, "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE', "filename" TEXT NOT NULL DEFAULT '', "path" TEXT NOT NULL, "storageKey" TEXT, "mime" TEXT NOT NULL, "size" INTEGER NOT NULL, "sha256" TEXT, "alt" TEXT, "caption" TEXT, "credit" TEXT, "uploadedById" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Media_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ArticleImage" ("id" SERIAL NOT NULL, "articleId" INTEGER NOT NULL, "mediaId" INTEGER NOT NULL, "position" INTEGER NOT NULL, CONSTRAINT "ArticleImage_pkey" PRIMARY KEY ("id"));
CREATE TABLE "TelegramSubmission" ("id" SERIAL NOT NULL, "idempotencyKey" TEXT, "articleId" INTEGER NOT NULL, "originalText" TEXT NOT NULL, "mediaGroupId" TEXT, "status" TEXT NOT NULL DEFAULT 'RECEIVED', "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "TelegramSubmission_pkey" PRIMARY KEY ("id"));
CREATE TABLE "User" ("id" SERIAL NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'JOURNALIST', "canPublish" BOOLEAN NOT NULL DEFAULT false, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Session" ("id" SERIAL NOT NULL, "tokenHash" TEXT NOT NULL, "userId" INTEGER NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Session_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Activity" ("id" SERIAL NOT NULL, "userId" INTEGER, "action" TEXT NOT NULL, "articleId" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Activity_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ArticleView" ("id" SERIAL NOT NULL, "articleId" INTEGER NOT NULL, "day" DATE NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "ArticleView_pkey" PRIMARY KEY ("id"));
CREATE TABLE "RateLimit" ("key" TEXT NOT NULL, "count" INTEGER NOT NULL, "windowStart" TIMESTAMP(3) NOT NULL, CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key"));
CREATE TABLE "BreakingNews" ("id" SERIAL NOT NULL, "text" TEXT NOT NULL, "lang" "Lang" NOT NULL, "articleId" INTEGER, "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true, "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "endsAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "BreakingNews_pkey" PRIMARY KEY ("id"));
CREATE TABLE "HomeSection" ("id" SERIAL NOT NULL, "kind" "HomeKind" NOT NULL, "categoryId" INTEGER, "enabled" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0, "count" INTEGER NOT NULL DEFAULT 6, "manual" BOOLEAN NOT NULL DEFAULT false, CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id"));
CREATE TABLE "HomePick" ("id" SERIAL NOT NULL, "sectionId" INTEGER NOT NULL, "articleId" INTEGER NOT NULL, "position" INTEGER NOT NULL, CONSTRAINT "HomePick_pkey" PRIMARY KEY ("id"));
CREATE TABLE "PlatformSetting" ("key" TEXT NOT NULL, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key"));
CREATE TABLE "_ArticleToTag" ("A" INTEGER NOT NULL, "B" INTEGER NOT NULL, CONSTRAINT "_ArticleToTag_AB_pkey" PRIMARY KEY ("A", "B"));

-- CreateIndex
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");
CREATE UNIQUE INDEX "Tag_key_key" ON "Tag"("key");
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
CREATE INDEX "Article_format_status_idx" ON "Article"("format", "status");
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");
CREATE INDEX "Article_trending_trendingOrder_idx" ON "Article"("trending", "trendingOrder");
CREATE INDEX "Translation_lang_idx" ON "Translation"("lang");
CREATE UNIQUE INDEX "Translation_lang_slug_key" ON "Translation"("lang", "slug");
CREATE UNIQUE INDEX "Translation_articleId_lang_key" ON "Translation"("articleId", "lang");
CREATE UNIQUE INDEX "Media_path_key" ON "Media"("path");
CREATE UNIQUE INDEX "Media_sha256_key" ON "Media"("sha256");
CREATE INDEX "Media_kind_createdAt_idx" ON "Media"("kind", "createdAt");
CREATE INDEX "ArticleImage_articleId_position_idx" ON "ArticleImage"("articleId", "position");
CREATE UNIQUE INDEX "TelegramSubmission_idempotencyKey_key" ON "TelegramSubmission"("idempotencyKey");
CREATE UNIQUE INDEX "TelegramSubmission_articleId_key" ON "TelegramSubmission"("articleId");
CREATE INDEX "TelegramSubmission_status_receivedAt_idx" ON "TelegramSubmission"("status", "receivedAt");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX "Activity_articleId_idx" ON "Activity"("articleId");
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX "ArticleView_day_idx" ON "ArticleView"("day");
CREATE UNIQUE INDEX "ArticleView_articleId_day_key" ON "ArticleView"("articleId", "day");
CREATE INDEX "BreakingNews_lang_active_idx" ON "BreakingNews"("lang", "active");
CREATE UNIQUE INDEX "HomeSection_kind_categoryId_key" ON "HomeSection"("kind", "categoryId");
CREATE INDEX "HomePick_sectionId_position_idx" ON "HomePick"("sectionId", "position");
CREATE UNIQUE INDEX "HomePick_sectionId_articleId_key" ON "HomePick"("sectionId", "articleId");
CREATE INDEX "_ArticleToTag_B_index" ON "_ArticleToTag"("B");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleImage" ADD CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleImage" ADD CONSTRAINT "ArticleImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TelegramSubmission" ADD CONSTRAINT "TelegramSubmission_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArticleView" ADD CONSTRAINT "ArticleView_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BreakingNews" ADD CONSTRAINT "BreakingNews_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HomeSection" ADD CONSTRAINT "HomeSection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomePick" ADD CONSTRAINT "HomePick_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomePick" ADD CONSTRAINT "HomePick_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ArticleToTag" ADD CONSTRAINT "_ArticleToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ArticleToTag" ADD CONSTRAINT "_ArticleToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
