// Single source of truth for what each staff role may do. Every server action and API route calls into this.
export type Role = "JOURNALIST" | "EDITOR" | "ADMIN" | "SUPER_ADMIN";
export type Perm =
  | "article.create" | "article.editAny" | "article.review" | "article.publish" | "article.schedule" | "article.archive" | "article.delete"
  | "trending.manage" | "announcement.manage" | "telegram.review"
  | "media.upload" | "media.editAny" | "media.delete"
  | "taxonomy.manage" | "homepage.manage" | "breaking.manage" | "analytics.view"
  | "users.manage" | "settings.manage";

const JOURNALIST: Perm[] = ["article.create", "media.upload"];
const EDITOR: Perm[] = [...JOURNALIST, "article.editAny", "article.review", "article.publish", "article.schedule", "article.archive", "trending.manage", "announcement.manage", "telegram.review", "media.editAny", "analytics.view"];
const ADMIN: Perm[] = [...EDITOR, "article.delete", "media.delete", "taxonomy.manage", "homepage.manage", "breaking.manage", "users.manage"];
const SUPER_ADMIN: Perm[] = [...ADMIN, "settings.manage"];

export const ROLE_PERMS: Record<Role, ReadonlySet<Perm>> = {
  JOURNALIST: new Set(JOURNALIST), EDITOR: new Set(EDITOR), ADMIN: new Set(ADMIN), SUPER_ADMIN: new Set(SUPER_ADMIN),
};
export type Actor = { id: number; role: Role; canPublish?: boolean };
export const can = (u: Pick<Actor, "role">, p: Perm) => ROLE_PERMS[u.role].has(p);

// Roles an actor may assign / manage. Administrators manage Editors and Journalists only; nobody escalates themselves.
export const ROLES: Role[] = ["JOURNALIST", "EDITOR", "ADMIN", "SUPER_ADMIN"];
export const manageableRoles = (actor: Role): Role[] => (actor === "SUPER_ADMIN" ? ROLES : actor === "ADMIN" ? ["JOURNALIST", "EDITOR"] : []);
export const canManageRole = (actor: Role, target: Role) => manageableRoles(actor).includes(target);

export type UserChangeCheck = { actor: Pick<Actor, "id" | "role">; target: { id: number; role: Role; active: boolean }; newRole: Role; newActive: boolean; otherActiveSuperAdmins: number };
/** Returns an error code or null. Used by the staff-management actions. */
export function checkUserChange(c: UserChangeCheck): string | null {
  if (!ROLES.includes(c.newRole)) return "forbidden";
  if (c.actor.id === c.target.id && (c.newRole !== c.target.role || c.newActive !== c.target.active)) return "self";
  if (!canManageRole(c.actor.role, c.target.role) || !canManageRole(c.actor.role, c.newRole)) return "forbidden";
  if (c.target.role === "SUPER_ADMIN" && c.target.active && (c.newRole !== "SUPER_ADMIN" || !c.newActive) && c.otherActiveSuperAdmins === 0) return "last_super";
  return null;
}
