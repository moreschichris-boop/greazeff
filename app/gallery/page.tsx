"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase, Photo } from "@/lib/supabase";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [year, setYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("photos")
      .select("*")
      .order("season_year", { ascending: false })
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setPhotos(data ?? []);
        setLoading(false);
      });
  }, []);

  const years = useMemo(() => {
    const set = new Set(photos.map((p) => p.season_year));
    return ["all", ...[...set].sort().reverse()];
  }, [photos]);

  const filtered = year === "all" ? photos : photos.filter((p) => p.season_year === year);

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">Photo Gallery</h1>
      <p className="mt-2 text-mute">Draft nights, trophy ceremonies, and Toilet Bowl consequences.</p>
      <div className="divider-tentacle my-6" />

      <div className="mb-6 flex flex-wrap gap-2">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              year === y ? "bg-teal text-ink" : "border border-line text-mute hover:text-bone"
            }`}
          >
            {y === "all" ? "All Years" : y}
          </button>
        ))}
      </div>

      {loading && <p className="text-mute">Loading photos&hellip;</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-mute">No photos yet — add them from the admin panel.</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
               {filtered.map((p) => (
          <figure key={p.id} className="stat-card overflow-hidden rounded-xl">
            <div className="relative aspect-square w-full">
              {p.media_type === "video" ? (
                <video src={p.url} controls className="h-full w-full object-cover" />
              ) : (
                <Image src={p.url} alt={p.caption ?? p.season_year} fill className="object-cover" />
              )}
            </div>
            <figcaption className="px-3 py-2 text-xs text-mute">
              <span className="font-semibold text-teal">{p.season_year}</span>
              {p.caption ? ` — ${p.caption}` : ""}
            </figcaption>
          </figure>
        ))}
        ))}
      </div>
    </div>
  );
}
