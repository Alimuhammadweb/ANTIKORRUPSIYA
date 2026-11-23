export const LANGS = ["uz", "en", "ru"] as const;
export type L = (typeof LANGS)[number];
export const LABEL: Record<L, string> = { uz: "Ўзбекча", en: "English", ru: "Русский" };
export const LOCALE: Record<L, string> = { uz: "uz-Cyrl-UZ", en: "en-GB", ru: "ru-RU" };
export const isLang = (s: string): s is L => (LANGS as readonly string[]).includes(s);
export const fmtDate = (d: Date | null | undefined, l: L) => (d ? d.toLocaleDateString(LOCALE[l], { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tashkent" }) : "");
export const fmtDateTime = (d: Date | null | undefined, l: L) => (d ? d.toLocaleString(LOCALE[l], { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }) : "");
/** "Nov 21, 2026" (English) / localized short date, as shown on cards. */
export const fmtDay = (d: Date | null | undefined, l: L) => (d ? d.toLocaleDateString(l === "en" ? "en-US" : LOCALE[l], { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Tashkent" }) : "");
/** 2500 → "2.5K" (localized compact notation). */
export const fmtViews = (n: number, l: L) => new Intl.NumberFormat(LOCALE[l], { notation: "compact", maximumFractionDigits: 1 }).format(n);
export const fmtShort = (d: Date | null | undefined, l: L) => (d ? d.toLocaleDateString(LOCALE[l], { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Tashkent" }) : "");
export const fmtToday = (l: L) => new Date().toLocaleDateString(LOCALE[l], { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tashkent" });
/** "3 hours ago" for stories under a day old, otherwise a short date. Called only while rendering on the server. */
export function timeAgo(d: Date | null | undefined, l: L): string {
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 0 || diff >= 864e5) return fmtShort(d, l);
  const rtf = new Intl.RelativeTimeFormat(LOCALE[l], { numeric: "auto" }), m = Math.round(diff / 6e4);
  return m < 60 ? rtf.format(-Math.max(m, 1), "minute") : rtf.format(-Math.round(m / 60), "hour");
}
export const fmtSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
/** Localized value of a { uz, en, ru } JSON field (category / tag names). Falls back to Uzbek, the primary language, when a translation was never entered. */
export const loc = (j: unknown, l: L): string => { const o = j as Record<string, unknown> | null, v = o?.[l], u = o?.uz; return typeof v === "string" && v.trim() ? v : typeof u === "string" ? u : ""; };

const en = {
  home: "Home", latest: "Latest", popular: "Popular", trending: "Trending", investigations: "Investigations", videos: "Videos", interviews: "Interviews", announcements: "Announcements", categories: "Categories", search: "Search",
  views: "views", empty: "No articles in this language yet.", searchPh: "Search articles", noResults: "Nothing found.", prev: "Previous", next: "Next",
  today: "Today", week: "This week", month: "This month", all: "All time", category: "Category", allCategories: "All categories", sort: "Sort", newest: "Newest", mostViewed: "Most viewed", tag: "Tag", find: "Search",
  related: "Related articles", share: "Share", copy: "Copy link", copied: "Copied", updated: "Updated", published: "Published", breaking: "Breaking", by: "By",
  gallery: "Gallery", close: "Close", prevImage: "Previous image", nextImage: "Next image", openImage: "Open image", download: "Download", document: "Document", play: "Play video", video: "Video",
  activeUntil: "Active until", expired: "Expired", menu: "Menu", language: "Language", theme: "Switch theme", skip: "Skip to content", readProgress: "Reading progress",
  unavailableTitle: "This page is not available in this language", unavailableBody: "The article has not been translated into the selected language yet.", openOriginal: "Read it in the original language", backHome: "Go to the home page",
  notFoundTitle: "Page not found", notFoundBody: "The page you are looking for does not exist or is no longer published.", tagPage: "Articles tagged", categoriesIntro: "Browse all topics",
  tagline: "Anti-corruption journalism, transparency and public accountability", sections: "Sections", rights: "All rights reserved", readMore: "Read more", more: "More",
  heroLabel: "Top story", noArticlesSection: "Nothing to show here yet.", shareVia: "Share on", nativeShare: "Share…", results: "results", fileInfo: "File", fileSize: "Size",
  filterToday: "Today", page: "Page", of: "of", home_title: "ANTIKORRUPSIYA — anti-corruption news",
  fInvestigation: "Investigation", fVideo: "Video", fInterview: "Interview", fAnnouncement: "Announcement", fPhoto: "Photo", minRead: "min read", backToTop: "Back to top", followUs: "Follow us",
  resultsFor: "Results for", searchHint: "Enter a keyword to search every article.", contact: "Contact", mainSections: "Main sections",
  viewAll: "View all", popularTags: "Popular tags", popularNews: "Popular News", latestNews: "Latest news", slide: "Slide", allArticles: "All articles",
};
type Dict = Record<keyof typeof en, string>;
const uz: Dict = {
  home: "Бош саҳифа", latest: "Сўнгги", popular: "Машҳур", trending: "Долзарб", investigations: "Тергов", videos: "Видеолар", interviews: "Интервьюлар", announcements: "Эълонлар", categories: "Рукнлар", search: "Қидирув",
  views: "кўриш", empty: "Бу тилда мақолалар ҳали йўқ.", searchPh: "Мақола ёки калит сўз", noResults: "Ҳеч нарса топилмади.", prev: "Олдинги", next: "Кейинги",
  today: "Бугун", week: "Ҳафта", month: "Ой", all: "Барчаси", category: "Рукн", allCategories: "Барча рукнлар", sort: "Саралаш", newest: "Янгилари", mostViewed: "Кўп кўрилган", tag: "Тег", find: "Излаш",
  related: "Ўхшаш мақолалар", share: "Улашиш", copy: "Ҳаволани нусхалаш", copied: "Нусхаланди", updated: "Янгиланган", published: "Нашр этилган", breaking: "Шошилинч", by: "Муаллиф",
  gallery: "Галерея", close: "Ёпиш", prevImage: "Олдинги расм", nextImage: "Кейинги расм", openImage: "Расмни очиш", download: "Юклаб олиш", document: "Ҳужжат", play: "Видеони ўйнатиш", video: "Видео",
  activeUntil: "Амал қилади:", expired: "Муддати тугаган", menu: "Меню", language: "Тил", theme: "Мавзуни алмаштириш", skip: "Асосий мазмунга ўтиш", readProgress: "Ўқиш жараёни",
  unavailableTitle: "Бу саҳифа танланган тилда мавжуд эмас", unavailableBody: "Мақола танланган тилга ҳали таржима қилинмаган.", openOriginal: "Асл тилда ўқиш", backHome: "Бош саҳифага ўтиш",
  notFoundTitle: "Саҳифа топилмади", notFoundBody: "Сиз излаётган саҳифа мавжуд эмас ёки нашрдан олинган.", tagPage: "Тег бўйича мақолалар", categoriesIntro: "Барча мавзулар",
  tagline: "Коррупцияга қарши журналистика, шаффофлик ва жамоатчилик ҳисобдорлиги", sections: "Бўлимлар", rights: "Барча ҳуқуқлар ҳимояланган", readMore: "Батафсил", more: "Яна",
  heroLabel: "Асосий мақола", noArticlesSection: "Ҳозирча кўрсатиш учун ҳеч нарса йўқ.", shareVia: "Улашиш:", nativeShare: "Улашиш…", results: "натижа", fileInfo: "Файл", fileSize: "Ҳажми",
  filterToday: "Бугун", page: "Саҳифа", of: "/", home_title: "ANTIKORRUPSIYA — коррупцияга қарши янгиликлар",
  fInvestigation: "Тергов", fVideo: "Видео", fInterview: "Интервью", fAnnouncement: "Эълон", fPhoto: "Фото", minRead: "дақиқа ўқиш", backToTop: "Тепага", followUs: "Бизни кузатинг",
  resultsFor: "Сўров бўйича натижалар:", searchHint: "Барча мақолалардан қидириш учун калит сўз киритинг.", contact: "Алоқа", mainSections: "Асосий бўлимлар",
  viewAll: "Барчасини кўриш", popularTags: "Машҳур теглар", popularNews: "Машҳур янгиликлар", latestNews: "Сўнгги янгиликлар", slide: "Слайд", allArticles: "Барча мақолалар",
};
const ru: Dict = {
  home: "Главная", latest: "Последние", popular: "Популярные", trending: "В тренде", investigations: "Расследования", videos: "Видео", interviews: "Интервью", announcements: "Объявления", categories: "Рубрики", search: "Поиск",
  views: "просмотров", empty: "На этом языке пока нет статей.", searchPh: "Поиск по статьям", noResults: "Ничего не найдено.", prev: "Назад", next: "Вперёд",
  today: "Сегодня", week: "За неделю", month: "За месяц", all: "За всё время", category: "Рубрика", allCategories: "Все рубрики", sort: "Сортировка", newest: "Новые", mostViewed: "Самые читаемые", tag: "Тег", find: "Искать",
  related: "Похожие статьи", share: "Поделиться", copy: "Копировать ссылку", copied: "Скопировано", updated: "Обновлено", published: "Опубликовано", breaking: "Срочно", by: "Автор",
  gallery: "Галерея", close: "Закрыть", prevImage: "Предыдущее фото", nextImage: "Следующее фото", openImage: "Открыть фото", download: "Скачать", document: "Документ", play: "Воспроизвести видео", video: "Видео",
  activeUntil: "Действует до", expired: "Срок истёк", menu: "Меню", language: "Язык", theme: "Сменить тему", skip: "Перейти к содержанию", readProgress: "Прогресс чтения",
  unavailableTitle: "Эта страница недоступна на выбранном языке", unavailableBody: "Статья ещё не переведена на выбранный язык.", openOriginal: "Читать на языке оригинала", backHome: "На главную",
  notFoundTitle: "Страница не найдена", notFoundBody: "Такой страницы нет или она снята с публикации.", tagPage: "Статьи по тегу", categoriesIntro: "Все темы",
  tagline: "Антикоррупционная журналистика, прозрачность и общественная подотчётность", sections: "Разделы", rights: "Все права защищены", readMore: "Подробнее", more: "Ещё",
  heroLabel: "Главная тема", noArticlesSection: "Пока нечего показать.", shareVia: "Поделиться в", nativeShare: "Поделиться…", results: "результатов", fileInfo: "Файл", fileSize: "Размер",
  filterToday: "Сегодня", page: "Страница", of: "из", home_title: "ANTIKORRUPSIYA — антикоррупционные новости",
  fInvestigation: "Расследование", fVideo: "Видео", fInterview: "Интервью", fAnnouncement: "Объявление", fPhoto: "Фото", minRead: "мин. чтения", backToTop: "Наверх", followUs: "Мы в соцсетях",
  resultsFor: "Результаты по запросу:", searchHint: "Введите слово или фразу для поиска по всем статьям.", contact: "Контакты", mainSections: "Основные разделы",
  viewAll: "Смотреть все", popularTags: "Популярные теги", popularNews: "Популярные новости", latestNews: "Последние новости", slide: "Слайд", allArticles: "Все статьи",
};
export const T = { uz, en, ru } as const;
export type TKey = keyof typeof en;
