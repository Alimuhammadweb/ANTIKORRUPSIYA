// The newsroom works in one time zone (Asia/Tashkent, UTC+5, no DST by default). <input type="datetime-local"> values are interpreted in it.
const OFFSET_MIN = Number(process.env.NEXT_PUBLIC_SITE_TZ_OFFSET_MIN ?? 300);
/** "2026-11-21T10:30" (newsroom local time) -> Date (UTC instant), or null if invalid. */
export function fromLocalInput(s: string | null | undefined, offsetMin = OFFSET_MIN): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s ?? "");
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - offsetMin * 60000;
  return isNaN(t) ? null : new Date(t);
}
/** Date -> value for <input type="datetime-local"> in newsroom time. */
export const toLocalInput = (d: Date | null | undefined, offsetMin = OFFSET_MIN) => (d ? new Date(d.getTime() + offsetMin * 60000).toISOString().slice(0, 16) : "");
