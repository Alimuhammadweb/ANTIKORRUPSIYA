"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-hash";
import { logActivity } from "@/lib/activity";
import { canManageRole, checkUserChange, ROLES, type Role } from "@/lib/permissions";

const go = (c: string): never => redirect(`/admin/users?${c}`);
const Email = z.string().trim().toLowerCase().email().max(200);
const Pw = z.string().min(12).max(200);
const Name = z.string().trim().min(1).max(80);

export async function createUser(f: FormData) {
  const u = await requirePerm("users.manage"); const role = String(f.get("role")) as Role;
  const email = Email.safeParse(f.get("email")), name = Name.safeParse(f.get("name")), pw = Pw.safeParse(f.get("password"));
  if (!email.success || !name.success) go("e=fields"); if (!pw.success) go("e=password");
  if (!ROLES.includes(role) || !canManageRole(u.role, role)) go("e=forbidden");
  if (await db.user.findUnique({ where: { email: email.data! } })) go("e=dup");
  const n = await db.user.create({ data: { email: email.data!, name: name.data!, role, canPublish: role === "JOURNALIST" && f.get("canPublish") === "on", passwordHash: hashPassword(pw.data!) } });
  await logActivity(u.id, `created account ${n.email} (${role})`); go("ok=1");
}
/** Role / status / details change. The rules (no self-escalation, no changes above your level, never the last Super Admin) live in permissions.checkUserChange and are enforced here. */
export async function updateUser(f: FormData) {
  const u = await requirePerm("users.manage"); const id = Number(f.get("id")), back = `/admin/users/${id}`;
  const t = await db.user.findUnique({ where: { id } }); if (!t) go("e=not_found");
  const self = t!.id === u.id; // own account: only name and email can change, never role or status
  const role = self ? t!.role : (String(f.get("role")) as Role), active = self ? t!.active : f.get("active") === "on", canPublish = self ? t!.canPublish : role === "JOURNALIST" && f.get("canPublish") === "on";
  const name = Name.safeParse(f.get("name")), email = Email.safeParse(f.get("email"));
  if (!name.success || !email.success) redirect(`${back}?e=fields`);
  if (!self) {
    const others = await db.user.count({ where: { role: "SUPER_ADMIN", active: true, NOT: { id } } });
    const err = checkUserChange({ actor: u, target: t!, newRole: role, newActive: active, otherActiveSuperAdmins: others });
    if (err) redirect(`${back}?e=${err}`);
  }
  if (email.data !== t!.email && (await db.user.findUnique({ where: { email: email.data } }))) redirect(`${back}?e=dup`);
  await db.user.update({ where: { id }, data: { role, active, name: name.data, email: email.data, canPublish } });
  if (!active) await db.session.deleteMany({ where: { userId: id } });
  if (role !== t!.role) await db.session.deleteMany({ where: { userId: id } }); // permissions changed: sign them in again
  await logActivity(u.id, `changed ${t!.email}: role ${role}, ${active ? "active" : "disabled"}`); redirect(`${back}?ok=1`);
}
export async function resetPassword(f: FormData) {
  const u = await requirePerm("users.manage"); const id = Number(f.get("id")), t = await db.user.findUnique({ where: { id } }), pw = Pw.safeParse(f.get("password"));
  if (!t) go("e=not_found"); if (!canManageRole(u.role, t!.role) && t!.id !== u.id) redirect(`/admin/users/${id}?e=forbidden`);
  if (!pw.success) redirect(`/admin/users/${id}?e=password`);
  await db.user.update({ where: { id }, data: { passwordHash: hashPassword(pw.data!) } }); await db.session.deleteMany({ where: { userId: id } });
  await logActivity(u.id, `reset password for ${t!.email}`); redirect(`/admin/users/${id}?ok=1`);
}
