"use client";

import { useState } from "react";
import { Owner, Season, SeasonResult } from "@/lib/supabase";

export default function SeasonsBrowser({
  seasons,
  owners,
  results,
}: {
  seasons: Season[];
  owners: Owner[];
  results: SeasonResult[];
}) {
  const sortedSeasons = [...seasons].sort((a, b) => b.year.localeCompare(a.year));
  const [seasonId, setSeasonId] = useState(sortedSeasons[0]?.id ?? "");

  const ownerMap = new Map(owners.map((o) => [o.id, o]));
  const season = seasons.find((s) => s.id === seasonId);
  const seasonResults = results
    .filter((r) => r.season_id === seasonId)
    .sort((a, b) => (a.final_rank ?? 99) - (b.final_rank ?? 99));

  if (!season) return <p className="text-mute">No seasons entered yet.</p>;

  return (
    <div>
      <div className="relative mb-8 inline-block">
        <select
          className="appearance-none rounded-md border border-line bg-panel py-2.5 pl-4 pr-10 font-display text-lg tracking-wide text-bone outline-none focus:border-teal"
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
        >
          {sortedSeasons.map((s) => (
            <option key={s.id} value={s.id}>{s.year}</option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Badge label="Champion" name={ownerMap.get(season.champion_id ?? "")?.name} tone="gold" />
        <Badge label="Runner-Up" name={ownerMap.get(season.runner_up_id ?? "")?.name} />
        <Badge label="Reg. Season Winner" name={ownerMap.get(season.reg_season_winner_id ?? "")?.name} />
        <Badge label="Toilet Bowl" name={ownerMap.get(season.last_place_id ?? "")?.name} tone="ember" />
      </div>

      {season.notes && (
        <p className="mt-4 rounded-lg border border-line bg-panel/60 p-4 text-sm text-mute">{season.notes}</p>
      )}

      <div className="mt-8 overflow-x-auto">
        {seasonResults.length > 0 ? (
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-mute">
                <th className="py-2">Rank</th>
                <th>Owner</th>
                <th>Record</th>
                <th>Points For</th>
                <th>Points Against</th>
                <th>Playoffs</th>
              </tr>
            </thead>
            <tbody>
              {seasonResults.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className="py-2 font-display text-lg text-bone">{r.final_rank ?? "—"}</td>
                  <td className="text-bone">{ownerMap.get(r.owner_id)?.name}</td>
                  <td className="text-mute">
                    {r.wins}-{r.losses}{r.ties ? `-${r.ties}` : ""}
                  </td>
                  <td className="text-mute">{r.points_for ?? "—"}</td>
                  <td className="text-mute">{r.points_against ?? "—"}</td>
                  <td className="text-mute">{r.made_playoffs ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-mute">Full standings for this season haven&apos;t been entered yet.</p>
        )}
      </div>
    </div>
  );
}

function Badge({ label, name, tone }: { label: string; name?: string; tone?: "gold" | "ember" }) {
  return (
    <div className="stat-card rounded-xl p-5 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-mute">{label}</div>
      <div className={`mt-1 font-display text-xl ${tone === "gold" ? "text-gold" : tone === "ember" ? "text-ember" : "text-bone"}`}>
        {name ?? "—"}
      </div>
    </div>
  );
}
