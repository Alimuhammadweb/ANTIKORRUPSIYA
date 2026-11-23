import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth-hash";
import { slugify } from "../src/lib/slug";

const db = new PrismaClient();
type L3 = { uz: string; en: string; ru: string };
const CATS: [string, L3, L3][] = [
  ["legal", { uz: "Ҳуқуқий ахборот", en: "Legal Information", ru: "Правовая информация" }, { uz: "Қонунлар, тушунтиришлар ва фуқаролар ҳуқуқлари.", en: "Laws, explainers and citizens' rights.", ru: "Законы, разъяснения и права граждан." }],
  ["corruption", { uz: "Коррупция", en: "Corruption", ru: "Коррупция" }, { uz: "Коррупция ҳолатлари ва уларга қарши кураш.", en: "Corruption cases and the fight against them.", ru: "Коррупционные дела и борьба с ними." }],
  ["politics", { uz: "Сиёсат", en: "Politics", ru: "Политика" }, { uz: "Давлат бошқаруви ва сиёсий қарорлар.", en: "Government and political decisions.", ru: "Государственное управление и политические решения." }],
  ["bureaucracy", { uz: "Бюрократия", en: "Bureaucracy", ru: "Бюрократия" }, { uz: "Бюрократик тўсиқлар ва давлат хизматлари.", en: "Red tape and public services.", ru: "Бюрократические барьеры и госуслуги." }],
  ["courts", { uz: "Судлар", en: "Courts", ru: "Суды" }, { uz: "Суд жараёнлари ва ҳукмлар.", en: "Court proceedings and rulings.", ru: "Судебные процессы и приговоры." }],
  ["announcements", { uz: "Эълонлар", en: "Announcements", ru: "Объявления" }, { uz: "Расмий эълонлар ва муҳим ахборот.", en: "Official announcements and important information.", ru: "Официальные объявления и важная информация." }],
];
const slugs3 = (n: L3): L3 => ({ uz: slugify(n.uz), en: slugify(n.en), ru: slugify(n.ru) });
const SECTIONS = [["HERO", 1], ["SECONDARY", 4], ["LATEST", 8], ["POPULAR", 5], ["TRENDING", 5], ["INVESTIGATIONS", 3], ["MEDIA", 4], ["ANNOUNCEMENTS", 4]] as const;

async function main() {
  for (const [i, [key, names, descriptions]] of CATS.entries())
    await db.category.upsert({ where: { key }, update: {}, create: { key, names, slugs: slugs3(names), descriptions, order: i } });
  const email = process.env.SEED_ADMIN_EMAIL, pw = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !pw || pw.length < 12) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ chars)");
  await db.user.upsert({ where: { email }, update: {}, create: { email, name: "Super Admin", role: "SUPER_ADMIN", passwordHash: hashPassword(pw) } });
  if ((await db.homeSection.count()) === 0) for (const [i, [kind, count]] of SECTIONS.entries()) await db.homeSection.create({ data: { kind, count, sortOrder: i } });
  // category sections for the first three categories (admins can add / remove more)
  const cats = await db.category.findMany({ orderBy: { order: "asc" }, take: 3 });
  for (const c of cats) if (!(await db.homeSection.findFirst({ where: { kind: "CATEGORY", categoryId: c.id } }))) await db.homeSection.create({ data: { kind: "CATEGORY", categoryId: c.id, count: 4, sortOrder: 100 + c.id } });
  if (process.env.SEED_DEMO === "1") await demo();
  console.log("Seed complete.");
}
/** Optional demo content (SEED_DEMO=1): three published articles, each in three languages, so every public page has something to show. */
async function demo() {
  if (await db.article.count()) return console.log("Articles already exist, demo content skipped.");
  const author = await db.user.findFirstOrThrow({ where: { role: "SUPER_ADMIN" } }), cat = (key: string) => db.category.findUniqueOrThrow({ where: { key } });
  await db.tag.upsert({ where: { key: "transparency" }, update: {}, create: { key: "transparency", names: { uz: "Шаффофлик", en: "Transparency", ru: "Прозрачность" }, slugs: { uz: "shaffoflik", en: "transparency", ru: "prozrachnost" } } });
  const tag = await db.tag.findUniqueOrThrow({ where: { key: "transparency" } });
  const doc = (t: string) => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: t }] }, { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "—" }] }, { type: "paragraph", content: [{ type: "text", text: t }] }] });
  const items: { fmt: "NEWS" | "INVESTIGATION" | "ANNOUNCEMENT"; cat: string; t: L3; d: L3; trending?: boolean; exp?: Date }[] = [
    { fmt: "NEWS", cat: "politics", trending: true, t: { uz: "Давлат харидлари очиқ эълон қилинади", en: "Public procurement goes fully open", ru: "Госзакупки становятся полностью открытыми" }, d: { uz: "Демо мақола.", en: "Demo article.", ru: "Демонстрационная статья." } },
    { fmt: "INVESTIGATION", cat: "corruption", t: { uz: "Тергов: пулнинг изи", en: "Investigation: following the money", ru: "Расследование: по следам денег" }, d: { uz: "Демо тергов.", en: "Demo investigation.", ru: "Демонстрационное расследование." } },
    { fmt: "ANNOUNCEMENT", cat: "announcements", exp: new Date(Date.now() + 30 * 864e5), t: { uz: "Очиқ қабул куни", en: "Open reception day", ru: "День открытых дверей" }, d: { uz: "Демо эълон.", en: "Demo announcement.", ru: "Демонстрационное объявление." } },
  ];
  for (const [n, it] of items.entries()) {
    await db.article.create({ data: { format: it.fmt, status: "PUBLISHED", publishedAt: new Date(Date.now() - n * 3600e3), categoryId: (await cat(it.cat)).id, authorId: author.id, tags: { connect: { id: tag.id } }, expiresAt: it.exp ?? null, trending: !!it.trending, trendingOrder: it.trending ? 1 : null,
      translations: { create: (["uz", "en", "ru"] as const).map((l) => ({ lang: l, title: it.t[l], slug: `${slugify(it.t[l]) || "demo"}-${n}`, description: it.d[l], blocks: doc(it.d[l]) })) } } });
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
