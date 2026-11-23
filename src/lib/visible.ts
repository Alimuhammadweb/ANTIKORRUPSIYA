// An article is public when it is PUBLISHED, or SCHEDULED and its time has come (the cron job also flips the status; this keeps the site correct even if it runs late).
export const visible = (now = new Date()) => ({ publishedAt: { lte: now }, status: { in: ["PUBLISHED" as const, "SCHEDULED" as const] } });
export const isVisible = (a: { status: string; publishedAt: Date | null }, now = new Date()) =>
  (a.status === "PUBLISHED" || a.status === "SCHEDULED") && !!a.publishedAt && a.publishedAt <= now;
/** Announcements leave public listings after their expiry date but stay in the database and the admin panel. */
export const notExpired = (now = new Date()) => ({ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
