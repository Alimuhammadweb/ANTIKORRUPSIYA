import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { canManageRole, manageableRoles } from "@/lib/permissions";
import { adminT } from "@/lib/admin-i18n";
import { fmtDateTime, type L } from "@/lib/i18n";
import { Flash, PageHead } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { updateUser, resetPassword } from "../actions";

export default async function UserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string; ok?: string }> }) {
  const me = await requirePerm("users.manage"); const { t, lang } = await adminT(); const sp = await searchParams;
  const u = await db.user.findUnique({ where: { id: Number((await params).id) || 0 } }); if (!u) notFound();
  const log = await db.activity.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 30 });
  const mine = u.id === me.id, manage = canManageRole(me.role, u.role) && !mine, roles = manageableRoles(me.role);
  return (
    <div className="max-w-3xl"><PageHead title={u.name}><Link href="/admin/users" className="text-sm underline">← {t("nav_users")}</Link></PageHead><Flash sp={sp} />
      {mine && <p className="mb-3 text-sm text-mute">{t("own_account_note")}</p>}
      <Card className="mb-5"><CardBody>
        <form action={updateUser} className="grid gap-3 md:grid-cols-2"><input type="hidden" name="id" value={u.id} />
          <Field label={t("name")}><Input name="name" defaultValue={u.name} required maxLength={80} disabled={!manage && !mine} /></Field><Field label={t("email")}><Input name="email" type="email" defaultValue={u.email} required disabled={!manage && !mine} /></Field>
          <Field label={t("role")}><Select name="role" defaultValue={u.role} disabled={!manage}>{[...new Set([u.role, ...roles])].map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}</Select></Field>
          <div className="space-y-2 self-end text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={u.active} disabled={!manage} />{t("active")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="canPublish" defaultChecked={u.canPublish} disabled={!manage} />{t("can_publish")}</label></div>
          {(manage || mine) && <div className="md:col-span-2"><Button variant="primary">{t("save")}</Button></div>}</form></CardBody></Card>
      {(manage || mine) && <Card className="mb-5"><CardHeader>{t("reset_password")}</CardHeader><CardBody><form action={resetPassword} className="flex gap-2"><input type="hidden" name="id" value={u.id} /><Input name="password" type="password" minLength={12} required autoComplete="new-password" aria-label={t("password")} /><Button variant="outline">{t("reset_password")}</Button></form><p className="mt-1 text-xs text-mute">{t("password_hint")}</p></CardBody></Card>}
      <Card><CardHeader>{t("user_activity")}</CardHeader><CardBody><ul className="divide-y divide-rule text-sm">{log.map((l) => <li key={l.id} className="flex justify-between gap-3 py-1.5"><span>{l.articleId ? <Link href={`/admin/articles/${l.articleId}`} className="hover:underline">{l.action}</Link> : l.action}</span><span className="shrink-0 text-xs text-mute">{fmtDateTime(l.createdAt, lang as L)}</span></li>)}{!log.length && <li className="py-2 text-mute">{t("nothing_yet")}</li>}</ul></CardBody></Card></div>
  );
}
