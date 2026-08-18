"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Owner, Season, RosterEntry } from "@/lib/supabase";
import { teamLogoUrl } from "@/lib/teamLogo";

const ROSTER_SLOTS = ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "FLEX", "K", "DEF"];
const FLEX_POSITIONS = ["RB", "WR", "TE"];

function buildLineup(list: RosterEntry[]) {
  const pool = [...list];
  const slots: { label: string; entry: RosterEntry | null }[] = [];

  for (const slotLabel of ROSTER_SLOTS) {
    let idx = -1;
    if (slotLabel === "FLEX") {
      idx = pool.findIndex((e) => e.position && FLEX_POSITIONS.includes(e.position));
    } else {
      idx = pool.findIndex((e) => e.position === slotLabel);
    }
    if (idx >= 0) {
      slots.push({ label: slotLabel, entry: pool[idx] });
      pool.splice(idx, 1);
    } else {
      slots.push({ label: slotLabel, entry: null });
    }
  }
  for (const e of pool) slots.push({ label: "BN", entry: e });

  return slots;
}

export default function RostersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [headshots, setHeadshots] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
      const { data: s } = await supabase.from("seasons").select("*").order("year", { ascending: false });
      setOwners(o ?? []);
      setSeasons(s ?? []);
      if (s && s.length) setSeasonId(s[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    supabase
      .from("roster_entries")
      .select("*")
      .eq("season_id", seasonId)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setEntries(data ?? []));
  }, [seasonId]);

  // Fetch Sleeper's player DB once to map names -> headshot URLs.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://api.sleeper.app/v1/players/nfl");
        if (!res.ok) return;
        const all: Record<string, any> = await res.json();
        const map = new Map<string, string>();
        for (const id in all) {
          const p = all[id];
          if (p.full_name) {
            map.set(p.full_name.toLowerCase(), `https://sleepercdn.com/content/nfl/players/thumb/${id}.jpg`);
          }
        }
        setHeadshots(map);
      } catch {
        // Headshots are a nice-to-have — fail silently and fall back to placeholders.
      }
    })();
  }, []);

  const byOwner = useMemo(() => {
    const map = new Map<string, RosterEntry[]>();
    for (const e of entries) {
      const list = map.get(e.owner_id) ?? [];
      list.push(e);
      map.set(e.owner_id, list);
    }
    return map;
  }, [entries]);

  if (loading) return <p className="text-mute">Loading...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-wide text-bone">Season-Ending Rosters</h1>
        <select className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
          {seasons.map((s) => (<option key={s.id} value={s.id}>{s.year}</option>))}
        </select>
      </div>
      <p className="mt-2 text-mute">Final lineups and keeper eligibility, year by year.</p>
      <div className="divider-tentacle my-6" />

      {entries.length === 0 && <p className="text-mute">No roster entered for this season yet.</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        {owners.map((o) => {
          const list = byOwner.get(o.id);
          if (!list || list.length === 0) return null;
          const slots = buildLineup(list);

          const starters = slots.slice(0, ROSTER_SLOTS.length);
          const bench = slots.slice(ROSTER_SLOTS.length);

          return (
            <div key={o.id} className="stat-card rounded-xl p-5">
              <h2 className="font-display text-xl text-bone">{o.name}</h2>
              <div className="divider-tentacle my-3" />
              <div className="grid gap-x-6 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal">Starters</div>
                  <div className="space-y-1.5">
                    {starters.map((s, i) => (
                      <LineupRow key={i} label={s.label} entry={s.entry} headshots={headshots} />
                    ))}
                  </div>
                </div>
                <div className="mt-5 sm:mt-0">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-mute">Bench</div>
                  <div className="space-y-1.5">
                    {bench.map((s, i) => (
                      <LineupRow key={i} label={s.label} entry={s.entry} headshots={headshots} />
                    ))}
                    {bench.length === 0 && <p className="text-xs text-mute/50">No bench players.</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineupRow({
  label,
  entry,
  headshots,
}: {
  label: string;
  entry: RosterEntry | null;
  headshots: Map<string, string>;
}) {
  if (!entry) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line/60 px-3 py-2 text-sm">
        <span className="w-9 shrink-0 text-xs font-bold uppercase tracking-wide text-mute">{label}</span>
        <span className="text-mute/50">empty</span>
      </div>
    );
  }

  const headshotUrl = headshots.get(entry.player_name.toLowerCase());
  const logoUrl = teamLogoUrl(entry.nfl_team);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-line/60 px-3 py-2 text-sm">
      <span className="w-9 shrink-0 pt-1 text-xs font-bold uppercase tracking-wide text-mute">{label}</span>
      <div className="relative mt-0.5 shrink-0">
        {headshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headshotUrl}
            alt=""
            className="h-9 w-9 rounded-full bg-panel object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-panel" />
        )}
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-ink bg-ink" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-bone">{entry.player_name}</div>
        <div className="text-xs text-mute">{[entry.position, entry.nfl_team].filter(Boolean).join(" · ")}</div>
        <div className="mt-1">
          {entry.keeper_selected ? (
            <span className="inline-block rounded bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold">
              Keeping — Rd {entry.keeper_round ?? "—"}{entry.is_free_agent ? " (FA)" : ""}
            </span>
          ) : entry.keeper_eligible ? (
            <span className="inline-block rounded bg-teal/15 px-2 py-0.5 text-[10px] font-semibold text-teal">
              Eligible: Rd {entry.keeper_round ?? "—"}{entry.is_free_agent ? " (FA)" : ""}
            </span>
          ) : (
            <span className="inline-block rounded bg-line px-2 py-0.5 text-[10px] text-mute">Not eligible</span>
          )}
        </div>
      </div>
    </div>
  );
}
