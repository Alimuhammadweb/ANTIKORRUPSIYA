-- Uploaded files now live in PostgreSQL (BYTEA). External object storage is no longer used.
-- Existing Media rows and every reference to them (covers, albums, article bodies) are kept as they are;
-- run `npm run media:import` once to copy the bytes of pre-existing files into the database.

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "storageKey";
ALTER TABLE "Media" ADD COLUMN "publicId" TEXT;
ALTER TABLE "Media" ADD COLUMN "width" INTEGER;
ALTER TABLE "Media" ADD COLUMN "height" INTEGER;
ALTER TABLE "Media" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Media" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;
ALTER TABLE "Media" ALTER COLUMN "publicId" SET NOT NULL;

-- CreateTable
CREATE TABLE "MediaFile" (
    "mediaId" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("mediaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_publicId_key" ON "Media"("publicId");

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
