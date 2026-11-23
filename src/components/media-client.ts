export type MediaDTO = { id: number; path: string; kind: "IMAGE" | "VIDEO" | "DOCUMENT"; mime: string; size: number; filename: string; alt: string | null; caption: string | null; credit: string | null };
export const ACCEPT = { IMAGE: "image/jpeg,image/png,image/webp", VIDEO: "video/mp4,video/webm", DOCUMENT: "application/pdf", ANY: "image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf" } as const;
/** Uploads one file to the application (POST /api/admin/upload); the server validates it and stores it in PostgreSQL. Duplicates are reused. */
export function uploadFile(file: File, onProgress?: (p: number) => void): Promise<{ media: MediaDTO; reused: boolean }> {
  return new Promise((res, rej) => {
    const body = new FormData(); body.append("file", file);
    const x = new XMLHttpRequest(); x.open("POST", "/api/admin/upload");
    x.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    x.onload = () => {
      let d: { media?: MediaDTO; reused?: boolean; error?: string } = {}; try { d = JSON.parse(x.responseText); } catch { /* not JSON */ }
      if (x.status >= 200 && x.status < 300 && d.media) { onProgress?.(1); res({ media: d.media, reused: !!d.reused }); }
      else rej(new Error(x.status === 413 ? "too_large" : d.error ?? "upload_failed"));
    };
    x.onerror = () => rej(new Error("network")); x.send(body);
  });
}
