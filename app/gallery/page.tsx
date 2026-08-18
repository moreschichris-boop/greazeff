"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase, Photo } from "@/lib/supabase";
import { uploadMedia } from "@/lib/upload";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [year, setYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("season_year", { ascending: false })
      .order("sort_order", { ascending: true });
    setPhotos(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

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

      <UploadBox onDone={load} />

      <div className="mb-6 mt-8 flex flex-wrap gap-2">
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
        <p className="text-mute">No photos yet — be the first to upload one above.</p>
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
      </div>
    </div>
  );
}

function UploadBox({ onDone }: { onDone: () => void }) {
  const [seasonYear, setSeasonYear] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [msg, setMsg] = useState("");

  async function upload() {
    if (!seasonYear || files.length === 0) {
      setMsg("Season year and at least one file are required.");
      return;
    }
    setUploading(true);
    setMsg("");
    setProgress({ done: 0, total: files.length });
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        const { url, mediaType } = await uploadMedia(files[i], seasonYear);
        const { error } = await supabase.from("photos").insert({
          season_year: seasonYear,
          url,
          caption: caption || null,
          media_type: mediaType,
        });
        if (error) failCount++;
      } catch {
        failCount++;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
    setMsg(failCount > 0 ? `Uploaded ${files.length - failCount} of ${files.length} — ${failCount} failed.` : `Uploaded ${files.length} file(s)!`);
    setFiles([]);
    setCaption("");
    onDone();
  }

  return (
    <div className="stat-card rounded-xl p-4">
      <h2 className="mb-3 font-display text-lg text-teal">Add Photos or Videos</h2>
      {msg && <p className="mb-2 text-sm text-teal">{msg}</p>}
      <div className="grid gap-3">
        <input
          className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone outline-none focus:border-teal"
          placeholder="Season year, e.g. 2026-27"
          value={seasonYear}
          onChange={(e) => setSeasonYear(e.target.value)}
        />
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone file:mr-3 file:rounded file:border-0 file:bg-teal file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:text-ink"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        {files.length > 0 && <p className="text-xs text-mute">{files.length} file(s) selected</p>}
        <input
          className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone outline-none focus:border-teal"
          placeholder="Caption (optional, applies to all selected)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button
          disabled={uploading}
          onClick={upload}
          className="rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50"
        >
          {uploading ? `Uploading ${progress.done}/${progress.total}...` : `Upload ${files.length || ""} File${files.length === 1 ? "" : "s"}`}
