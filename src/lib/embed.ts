export type VideoSource = { provider: "file" | "youtube" | "vimeo"; src: string; embed: string };
const FILE = /\.(mp4|webm)(\?.*)?$/i;
/** Validates a video URL and returns a safe playable form, or null. Only https and a short allow-list of providers. */
export function parseVideoUrl(raw: string): VideoSource | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const h = u.hostname.replace(/^www\./, "");
  if (h === "youtube.com" || h === "m.youtube.com" || h === "youtube-nocookie.com") {
    const id = u.pathname === "/watch" ? u.searchParams.get("v") : /^\/(embed|shorts|live)\/([\w-]{6,20})/.exec(u.pathname)?.[2];
    return id && /^[\w-]{6,20}$/.test(id) ? { provider: "youtube", src: u.toString(), embed: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (h === "youtu.be") { const id = u.pathname.slice(1); return /^[\w-]{6,20}$/.test(id) ? { provider: "youtube", src: u.toString(), embed: `https://www.youtube-nocookie.com/embed/${id}` } : null; }
  if (h === "vimeo.com" || h === "player.vimeo.com") {
    const id = /(\d{5,12})/.exec(u.pathname)?.[1];
    return id ? { provider: "vimeo", src: u.toString(), embed: `https://player.vimeo.com/video/${id}` } : null;
  }
  return FILE.test(u.pathname) ? { provider: "file", src: u.toString(), embed: u.toString() } : null;
}
