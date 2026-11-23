"use client";
import { useState } from "react";
import { Play } from "lucide-react";
/** Thumbnail that turns into a working player (uploaded file or YouTube / Vimeo embed) when clicked. */
export function InlineVideo({ v, poster, label, ratio }: { v: { src: string; provider: string; embed: string; title?: string }; poster?: string; label: string; ratio: string }) {
  const [on, setOn] = useState(false);
  if (on) return (
    <div className={`relative overflow-hidden rounded-lg bg-black ${ratio}`}>
      {v.provider === "file" ? <video src={v.src} poster={poster} controls autoPlay playsInline className="absolute inset-0 size-full" />
        : <iframe src={`${v.embed}${v.embed.includes("?") ? "&" : "?"}autoplay=1`} title={v.title || label} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 size-full border-0" />}
    </div>);
  return (
    <button type="button" onClick={() => setOn(true)} aria-label={label} className={`group/v relative block w-full overflow-hidden rounded-lg bg-navy ${ratio}`}>
      {poster ? <img src={poster} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-500 group-hover/v:scale-[1.04]" /> : <span className="art absolute inset-0" />}
      <span className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/50 via-black/10 to-transparent"><span className="grid size-14 place-items-center rounded-full bg-white/95 pl-0.5 text-navy shadow-xl transition-transform duration-200 group-hover/v:scale-110"><Play className="size-6 fill-current" /></span></span>
    </button>
  );
}
