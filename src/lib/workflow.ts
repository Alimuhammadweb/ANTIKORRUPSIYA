import { can, type Actor } from "./permissions";
export type Status = "DRAFT" | "PENDING" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export const STATUSES: Status[] = ["DRAFT", "PENDING", "APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED"];

/** Every edge that exists in the editorial workflow. Anything else is refused on the server. */
export const EDGES: Record<Status, Status[]> = {
  DRAFT: ["PENDING", "PUBLISHED", "SCHEDULED", "ARCHIVED"],
  PENDING: ["APPROVED", "REJECTED", "DRAFT", "PUBLISHED", "SCHEDULED"],
  APPROVED: ["PUBLISHED", "SCHEDULED", "REJECTED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  PUBLISHED: ["DRAFT", "ARCHIVED"], // PUBLISHED -> DRAFT is "unpublish"
  REJECTED: ["DRAFT", "PENDING"],
  ARCHIVED: ["DRAFT"],
};
type A = { status: Status; authorId: number | null };
const own = (u: Actor, a: A) => a.authorId === u.id;

/** May this user edit the content of this article? Journalists: own drafts and rejected articles only. */
export const canEditArticle = (u: Actor, a: A) => can(u, "article.editAny") || (can(u, "article.create") && own(u, a) && (a.status === "DRAFT" || a.status === "REJECTED"));
export const canViewArticle = (u: Actor, a: A) => can(u, "article.editAny") || own(u, a);

export type Check = { ok: true } | { ok: false; code: string };
export function checkTransition(u: Actor, a: A, to: Status): Check {
  if (!EDGES[a.status].includes(to)) return { ok: false, code: "bad_transition" };
  const editor = can(u, "article.review"), self = own(u, a), jPub = !!u.canPublish && self && can(u, "article.create");
  const no: Check = { ok: false, code: "forbidden" };
  if (!editor && !self) return no;
  switch (to) {
    case "PENDING": return editor || self ? { ok: true } : no;
    case "APPROVED": case "REJECTED": return editor ? { ok: true } : no;
    case "PUBLISHED": return can(u, "article.publish") || jPub ? { ok: true } : no;
    case "SCHEDULED": return can(u, "article.schedule") || jPub ? { ok: true } : no;
    case "ARCHIVED": return can(u, "article.archive") ? { ok: true } : no;
    case "DRAFT": // withdraw own submission, or an editor unpublishing / returning to draft
      return editor || jPub || (self && (a.status === "PENDING" || a.status === "REJECTED")) ? { ok: true } : no;
  }
}
/** Buttons offered in the UI: exactly the edges the server would accept. */
export const allowedNext = (u: Actor, a: A): Status[] => EDGES[a.status].filter((to) => checkTransition(u, a, to).ok);
