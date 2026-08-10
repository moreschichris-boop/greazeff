"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Owner, Season, RosterEntry } from "@/lib/supabase";

export default function RostersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
      <p className="mt-2 text-mute">Final rosters and keeper eligibility, year by year.</p>
      <div className="divider-tentacle my-6" />

      {entries.length === 0 && <p className="text-mute">No roster entered for this season yet.</p>}

      <div className="grid gap-6 sm:grid-cols-2">
        {owners.map((o) => {
          const list = byOwner.get(o.id);
          if (!list || list.length === 0) return null;
          return (
            <div key={o.id} className="stat-card rounded-xl p-5">
              <h2 className="font-display text-xl text-bone">{o.name}</h2>
              <div className="divider-tentacle my-3" />
              <ul className="space-y-1.5">
                {list.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="text-bone">
                      {e.player_name}
                      {e.position && <span className="ml-2 text-xs text-mute">{e.position}{e.nfl_team ? ` · ${e.nfl_team}` : ""}</span>}
                    </span>
                    {e.keeper_selected ? (
                      <span className="rounded bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">
                        Keeping — Rd {e.keeper_round ?? "—"}{e.is_free_agent ? " (FA)" : ""}
                      </span>
                    ) : e.keeper_eligible ? (
                      <span className="rounded bg-teal/15 px-2 py-0.5 text-xs font-semibold text-teal">
                        Eligible: Rd {e.keeper_round ?? "—"}{e.is_free_agent ? " (FA)" : ""}
                      </span>
                    ) : (
                      <span className="rounded bg-line px-2 py-0.5 text-xs text-mute">Not eligible</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
