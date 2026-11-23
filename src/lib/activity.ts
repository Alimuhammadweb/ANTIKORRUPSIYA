import { db } from "./db";
/** Editorial / administrative activity log. Every important action goes through here. */
export const logActivity = (userId: number | null, action: string, articleId?: number | null) =>
  db.activity.create({ data: { userId, action: action.slice(0, 300), articleId: articleId ?? null } });
