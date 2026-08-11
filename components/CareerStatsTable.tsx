"use client";

import { useState } from "react";

export type CareerRow = {
  ownerId: string;
  name: string;
  seasons: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  championships: number;
  runnerUps: number;
  regSeasonTitles: number;
  toiletBowls: number;
  playoffAppearances: number;
};

type ColKey = keyof Omit<CareerRow, "ownerId" | "name">;

const columns: { key: ColKey; label: string; decimals?: number }[] = [
  { key: "seasons", label: "Seasons" },
  { key: "wins", label: "W" },
  { key: "losses", label: "L" },
  { key: "ties", label: "T" },
  { key: "winPct", label: "Win%", decimals: 3 },
  { key: "pointsFor", label: "PF", decimals: 1 },
  { key: "pointsAgainst", label: "PA", decimals: 1 },
  { key: "championships", label: "Champs" },
  { key: "runnerUps", label: "Runner-Ups" },
  { key: "regSeasonTitles", label: "Reg. Titles" },
  { key: "playoffAppearances", label: "Playoffs" },
  { key: "toiletBowls", label: "Toilet Bowls" },
];

export default function CareerStatsTable({ rows }: { rows: CareerRow[] }) {
  const [sortKey, setSortKey] = useState<ColKey>("wins");
  const [asc, setAsc] = useState(false);

  function toggleSort(key: ColKey) {
    if (key === sortKey) {
      setAsc(!asc);
    } else {
      setSortKey(key);
      setAsc(false);
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = (a[sortKey] as number) - (b[sortKey] as number);
    return asc ? diff : -diff;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-mute">
            <th
              className="cursor-pointer select-none py-2 pr-3 hover:text-teal"
              onClick={() => toggleSort("wins")}
            >
              Owner
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => toggleSort(c.key)}
                className={`cursor-pointer select-none whitespace-nowrap px-2 py-2 hover:text-teal ${
                  sortKey === c.key ? "text-teal" : ""
                }`}
              >
                {c.label}
                {sortKey === c.key ? (asc ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.ownerId} className="border-b border-line/50">
              <td className="py-2 pr-3 font-semibold text-bone">{r.name}</td>
              {columns.map((c) => {
                const val = r[c.key];
                const display = c.decimals !== undefined ? val.toFixed(c.decimals) : val;
                return (
                  <td key={c.key} className="px-2 py-2 text-mute">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="py-4 text-mute">
                No standings entered yet — add season results from the admin panel.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
