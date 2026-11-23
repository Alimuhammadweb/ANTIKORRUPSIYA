import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";
import { db } from "./db";
import { can, type Perm, type Role } from "./permissions";
export { hashPassword } from "./auth-hash";

const sha = (t: string) => createHash("sha256").update(t).digest("hex");
export const verifyPassword = (pw: string, stored: string) => {
  const [s, h] = stored.split(":"); if (!s || !h) return false;
  const a = Buffer.from(h, "hex"), b = scryptSync(pw, s, 64);
  return a.length === b.length && timingSafeEqual(a, b);
};
const DUMMY = `${"0".repeat(32)}:${"0".repeat(128)}`; // constant-ish work when the email is unknown
export async function startSession(email: string, password: string) {
  const u = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  const ok = verifyPassword(password, u?.passwordHash ?? DUMMY);
  if (!u || !u.active || !ok) return false;
  const token = randomBytes(32).toString("hex");
  await db.session.create({ data: { tokenHash: sha(token), userId: u.id, expiresAt: new Date(Date.now() + 7 * 864e5) } });
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }); // housekeeping
  (await cookies()).set("session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return true;
}
export async function endSession() {
  const c = await cookies(); const t = c.get("session")?.value;
  if (t) await db.session.deleteMany({ where: { tokenHash: sha(t) } });
  c.delete("session");
}
export async function currentUser() {
  const t = (await cookies()).get("session")?.value; if (!t) return null;
  const s = await db.session.findUnique({ where: { tokenHash: sha(t) }, include: { user: true } });
  return s && s.expiresAt > new Date() && s.user.active ? s.user : null;
}
export type Staff = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
/** Server-side gate for pages and server actions. Not signed in: redirect to login. Signed in without the permission: throws. */
export async function requirePerm(p?: Perm): Promise<Staff> {
  const u = await currentUser();
  if (!u) redirect("/admin/login");
  if (p && !can(u, p)) throw new Error("Forbidden");
  return u;
}
/** Same gate for API routes: returns a user or null, never redirects. */
export async function apiUser(p?: Perm): Promise<Staff | null> {
  const u = await currentUser();
  return u && (!p || can(u, p)) ? u : null;
}
export type { Role };
