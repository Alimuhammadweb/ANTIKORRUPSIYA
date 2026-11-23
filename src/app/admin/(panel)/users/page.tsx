import Link from "next/link";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { manageableRoles } from "@/lib/permissions";
import { adminT } from "@/lib/admin-i18n";
import { fmtDate, type L } from "@/lib/i18n";
import { Flash, PageHead } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { createUser } from "./actions";

export default async function Users({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const me = await requirePerm("users.manage"); const { t, lang } = await adminT(); const sp = await searchParams;
  const rows = await db.user.findMany({ orderBy: [{ active: "desc" }, { role: "desc" }, { name: "asc" }], include: { _count: { select: { articles: true } } } }), roles = manageableRoles(me.role);
  return (
    <div className="max-w-4xl"><PageHead title={t("nav_users")} /><Flash sp={sp} />
      <Card className="mb-6"><CardHeader>{t("new_user")}</CardHeader><CardBody>
        <form action={createUser} className="grid gap-3 md:grid-cols-2">
          <Field label={t("name")}><Input name="name" required maxLength={80} /></Field><Field label={t("email")}><Input name="email" type="email" required /></Field>
          <Field label={t("password")} hint={t("password_hint")}><Input name="password" type="password" required minLength={12} autoComplete="new-password" /></Field>
          <Field label={t("role")}><Select name="role">{roles.map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}</Select></Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="canPublish" />{t("can_publish")}</label><div className="md:col-span-2"><Button variant="primary">{t("create")}</Button></div></form></CardBody></Card>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>{t("name")}</th><th>{t("email")}</th><th>{t("role")}</th><th>{t("status")}</th><th className="text-right">{t("nav_articles")}</th><th>{t("created")}</th></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id}><td><Link href={`/admin/users/${u.id}`} className="font-semibold hover:underline">{u.name}</Link></td><td className="text-mute">{u.email}</td><td>{t(`role_${u.role}`)}{u.canPublish && <Badge tone="blue" className="ml-1">{t("publisher")}</Badge>}</td><td><Badge tone={u.active ? "green" : "red"}>{u.active ? t("active") : t("inactive")}</Badge></td><td className="text-right tabular-nums">{u._count.articles}</td><td className="text-xs text-mute">{fmtDate(u.createdAt, lang as L)}</td></tr>)}</tbody></table></div></div>
  );
}
