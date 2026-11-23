import { db } from "./db";
// Atomic fixed window kept in PostgreSQL, so limits hold across every server instance.
export async function limited(key: string, max: number, windowMs: number) {
  const sec = windowMs / 1000;
  const r = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart") VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < now() - (${sec}::double precision * interval '1 second') THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < now() - (${sec}::double precision * interval '1 second') THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  return r[0].count > max;
}
