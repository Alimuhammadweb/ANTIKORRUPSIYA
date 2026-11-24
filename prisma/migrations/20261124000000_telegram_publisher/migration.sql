-- Non-destructive: remember which Telegram administrator published a post. Existing rows keep NULL.
ALTER TABLE "TelegramSubmission" ADD COLUMN "telegramUserId" TEXT;
