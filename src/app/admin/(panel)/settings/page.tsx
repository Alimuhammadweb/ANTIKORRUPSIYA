import { requirePerm } from "@/lib/auth";
import { adminT } from "@/lib/admin-i18n";
import { getSite } from "@/lib/settings";
import { LANGS, LABEL } from "@/lib/i18n";
import { Flash, PageHead } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { saveSettings } from "./actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  await requirePerm("settings.manage"); const { t } = await adminT(); const sp = await searchParams, s = await getSite();
  return (
    <div className="max-w-3xl"><PageHead title={t("nav_settings")} /><Flash sp={sp} />
      <form action={saveSettings} className="space-y-5">
        <Card><CardHeader>{t("footer_text")}</CardHeader><CardBody className="grid gap-3 md:grid-cols-3">{LANGS.map((l) => <Field key={l} label={LABEL[l]}><Input name={`footer_${l}`} maxLength={300} defaultValue={s.footer[l]} /></Field>)}</CardBody></Card>
        <Card><CardHeader>{t("social_links")}</CardHeader><CardBody className="grid gap-3 md:grid-cols-2"><Field label="Telegram"><Input name="telegram" defaultValue={s.telegram} placeholder="https://t.me/…" /></Field><Field label="Facebook"><Input name="facebook" defaultValue={s.facebook} placeholder="https://facebook.com/…" /></Field><Field label="X"><Input name="x" defaultValue={s.x} placeholder="https://x.com/…" /></Field><Field label="YouTube"><Input name="youtube" defaultValue={s.youtube} placeholder="https://youtube.com/…" /></Field><Field label={t("email")}><Input name="email" type="email" defaultValue={s.email} /></Field></CardBody></Card>
        <Button variant="primary">{t("save")}</Button></form></div>
  );
}
