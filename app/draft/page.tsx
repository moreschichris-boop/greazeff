"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Owner, Draft, DraftPick, Season, DraftPlayer } from "@/lib/supabase";
import { teamOrderForRound, ownerForPick, totalPicks } from "@/lib/draft";
import { sha256, markAdminSession, hasAdminSession } from "@/lib/auth";
import { teamLogoUrl } from "@/lib/teamLogo";

const ROSTER_SLOTS = ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "FLEX", "K", "DEF"];
const FLEX_POSITIONS = ["RB", "WR", "TE"];

const TEAM_BYES: Record<string, number> = {
  ARI: 14, ATL: 11, BAL: 13, BUF: 7, CAR: 5, CHI: 10, CIN: 6, CLE: 11,
  DAL: 14, DEN: 10, DET: 6, GB: 11, HOU: 8, IND: 13, JAX: 7, KC: 5,
  LAC: 7, LAR: 11, LV: 13, MIA: 6, MIN: 6, NE: 11, NO: 8, NYG: 8,
  NYJ: 13, PHI: 10, PIT: 9, SEA: 11, SF: 8, TB: 10, TEN: 9, WAS: 7,
};

async function syncPoolFromSleeper(seasonYear: string) {
  const res = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!res.ok) throw new Error("Sleeper API request failed.");
  const all: Record<string, any> = await res.json();

  const rows: {
    season_year: string; name: string; position: string; nfl_team: string;
    rank: number; adp: number; bye_week: number | null; drafted: boolean;
  }[] = [];

  for (const id in all) {
    const p = all[id];
    if (!p.team || !TEAM_BYES[p.team]) continue;
    if (!["QB", "RB", "WR", "TE", "K"].includes(p.position)) continue;
    if (p.status !== "Active") continue;
    if (!p.search_rank || p.search_rank >= 9999999 || p.search_rank > 400) continue;
    rows.push({
      season_year: seasonYear,
      name: p.full_name,
      position: p.position,
      nfl_team: p.team,
      rank: p.search_rank,
      adp: p.search_rank,
      bye_week: TEAM_BYES[p.team] ?? null,
      drafted: false,
    });
  }

  for (const team of Object.keys(TEAM_BYES)) {
    rows.push({
      season_year: seasonYear,
      name: `${team} Defense`,
      position: "DEF",
      nfl_team: team,
      rank: 9000,
      adp: 9000,
      bye_week: TEAM_BYES[team],
      drafted: false,
    });
  }

  rows.sort((a, b) => a.rank - b.rank);
  rows.forEach((r, i) => { r.rank = i + 1; r.adp = i + 1; });

  await supabase.from("draft_players").delete().eq("season_year", seasonYear);
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await supabase.from("draft_players").insert(chunk);
    if (error) throw new Error(error.message);
  }
  return rows.length;
}

export default function DraftPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"live" | "history">("history");

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
      const { data: s } = await supabase.from("seasons").select("*").order("year", { ascending: false });
      setOwners(o ?? []);
      setSeasons(s ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-mute">Loading...</p>;

  const liveSeason = seasons[0];

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">Draft</h1>
      <div className="mt-4 mb-8 flex gap-2">
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>Draft History</TabButton>
      </div>

      {tab === "live" && liveSeason && <LiveDraftTab owners={owners} season={liveSeason} />}
      {tab === "live" && !liveSeason && <p className="text-mute">No seasons set up yet.</p>}
      {tab === "history" && <DraftHistoryTab owners={owners} seasons={seasons} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide ${
        active ? "bg-teal text-ink" : "border border-line text-mute hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

function TeamLogo({ team, size = 16 }: { team: string | null | undefined; size?: number }) {
  const url = teamLogoUrl(team);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={team ?? ""} width={size} height={size} className="inline-block shrink-0" style={{ width: size, height: size }} />;
}

function buildRoster(myPicks: DraftPick[]) {
  const pool = [...myPicks];
  const slots: { label: string; pick: DraftPick | null }[] = [];

  for (const slotLabel of ROSTER_SLOTS) {
    let idx = -1;
    if (slotLabel === "FLEX") {
      idx = pool.findIndex((p) => p.position && FLEX_POSITIONS.includes(p.position));
    } else {
      idx = pool.findIndex((p) => p.position === slotLabel);
    }
    if (idx >= 0) {
      slots.push({ label: slotLabel, pick: pool[idx] });
      pool.splice(idx, 1);
    } else {
      slots.push({ label: slotLabel, pick: null });
    }
  }
  for (const p of pool) slots.push({ label: "BN", pick: p });

  return slots;
}

/* ================= LIVE DRAFT ================= */

function LiveDraftTab({ owners, season }: { owners: Owner[]; season: Season }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [pool, setPool] = useState<DraftPlayer[]>([]);
  const [posFilter, setPosFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [whoAmI, setWhoAmI] = useState("");
  const [pickMode, setPickMode] = useState<"pool" | "manual">("pool");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [pickName, setPickName] = useState("");
  const [pickPos, setPickPos] = useState("");
  const [pickTeam, setPickTeam] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pickMsg, setPickMsg] = useState("");

  async function loadDraft() {
    const { data: d } = await supabase.from("drafts").select("*").eq("season_id", season.id).maybeSingle();
    setDraft(d ?? null);
    if (d) {
      const { data: p } = await supabase.from("draft_picks").select("*").eq("draft_id", d.id).order("pick_number", { ascending: true });
      setPicks(p ?? []);
    } else {
      setPicks([]);
    }
    setLoaded(true);
  }
  useEffect(() => { loadDraft(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [season.id]);

  useEffect(() => {
    supabase.from("draft_players").select("*").eq("season_year", season.year).then(({ data }) => setPool(data ?? []));
  }, [season.year]);

  useEffect(() => {
    const poolChannel = supabase
      .channel(`draft-players-${season.year}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "draft_players", filter: `season_year=eq.${season.year}` }, (payload) => {
        setPool((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as DraftPlayer;
            return prev.some((p) => p.id === row.id) ? prev : [...prev, row];
          }
          if (payload.eventType === "DELETE") return prev.filter((p) => p.id !== (payload.old as DraftPlayer).id);
          if (payload.eventType === "UPDATE") {
            const row = payload.new as DraftPlayer;
            return prev.map((p) => (p.id === row.id ? row : p));
          }
          return prev;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(poolChannel); };
  }, [season.year]);

  useEffect(() => {
    if (!draft?.id) return;
    const channel = supabase
      .channel(`draft-${draft.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "draft_picks", filter: `draft_id=eq.${draft.id}` }, (payload) => {
        setPicks((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as DraftPick;
            return prev.some((p) => p.id === row.id) ? prev : [...prev, row].sort((a, b) => a.pick_number - b.pick_number);
          }
          if (payload.eventType === "DELETE") return prev.filter((p) => p.id !== (payload.old as DraftPick).id);
          if (payload.eventType === "UPDATE") {
            const row = payload.new as DraftPick;
            return prev.map((p) => (p.id === row.id ? row : p));
          }
          return prev;
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "drafts", filter: `id=eq.${draft.id}` }, (payload) => {
        setDraft(payload.new as Draft);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [draft?.id]);

  const ownerMap = useMemo(() => new Map(owners.map((o) => [o.id, o])), [owners]);
  const pickMap = useMemo(() => new Map(picks.map((p) => [p.pick_number, p])), [picks]);
  const onClock = draft && draft.status === "in_progress" ? ownerForPick(draft.draft_order, draft.current_pick) : null;

  const available = pool.filter((p) => !p.drafted);
  const positions = ["ALL", ...Array.from(new Set(available.map((p) => p.position).filter(Boolean) as string[])).sort()];
  const bestAvailable = available
    .filter((p) => posFilter === "ALL" || p.position === posFilter)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));

  const totalPickCount = draft ? totalPicks(draft.draft_order, draft.rounds) : 0;

  function quickFill(p: DraftPlayer) {
    setSelectedPlayerId(p.id);
    setPickName(p.name);
    setPickPos(p.position ?? "");
    setPickTeam(p.nfl_team ?? "");
  }

  function resetPickForm() {
    setSelectedPlayerId(""); setPickName(""); setPickPos(""); setPickTeam("");
  }

  async function submitPick() {
    if (!draft || !onClock) return;
    if (whoAmI !== onClock.ownerId) return setPickMsg("It's not your turn yet.");
    if (!pickName.trim()) return setPickMsg(pickMode === "pool" ? "Select a player from the list." : "Enter a player name.");
    setSubmitting(true);
    setPickMsg("");

    const matched = pickMode === "pool"
      ? pool.find((p) => p.id === selectedPlayerId)
      : pool.find((p) => p.name.toLowerCase() === pickName.trim().toLowerCase());

    const { error } = await supabase.from("draft_picks").insert({
      draft_id: draft.id,
      pick_number: draft.current_pick,
      round: onClock.round,
      pick_in_round: onClock.pickInRound,
      owner_id: onClock.ownerId,
      player_name: pickName.trim(),
      position: pickPos || null,
      nfl_team: pickTeam || null,
      is_keeper: false,
    });
    if (error) { setSubmitting(false); return setPickMsg(`Error: ${error.message}`); }
    if (matched) await supabase.from("draft_players").update({ drafted: true }).eq("id", matched.id);

    // Advance to the next OPEN pick, skipping any slots already filled (e.g. by keepers).
    const takenSet = new Set(picks.map((p) => p.pick_number));
    takenSet.add(draft.current_pick);
    let nextPick = draft.current_pick + 1;
    while (takenSet.has(nextPick) && nextPick <= totalPickCount) nextPick++;
    const newStatus = nextPick > totalPickCount ? "complete" : "in_progress";
    await supabase.from("drafts").update({ current_pick: nextPick, status: newStatus }).eq("id", draft.id);

    resetPickForm();
    setSubmitting(false);
  }

  if (!loaded) return <p className="text-mute">Loading...</p>;

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-mute">{season.year} Season</div>

      {!draft && <CommissionerNoDraft owners={owners} season={season} onChange={loadDraft} />}

      {draft && draft.status === "setup" && (
        <>
          <DraftCountdown scheduledAt={draft.scheduled_at} />
          <CommissionerSetup draft={draft} owners={owners} season={season} picks={picks} pool={pool} onChange={loadDraft} />
        </>
      )}

      {draft && draft.status === "in_progress" && onClock && (
        <>
          <div className="stat-card mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border-teal/60 p-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-mute">
                On the Clock &middot; Round {onClock.round}, Pick {onClock.pickInRound}
              </div>
              <div className="font-display text-2xl text-teal">{ownerMap.get(onClock.ownerId)?.name ?? "—"}</div>
            </div>
            <div className="text-sm text-mute">Pick {draft.current_pick} of {totalPicks(draft.draft_order, draft.rounds)}</div>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="stat-card rounded-xl p-5">
              <h2 className="mb-3 font-display text-lg text-teal">Make Your Pick</h2>
              <select
                className="mb-3 w-full max-w-xs rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone"
                value={whoAmI}
                onChange={(e) => setWhoAmI(e.target.value)}
              >
                <option value="">Who are you?</option>
                {owners.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
              </select>

              {whoAmI && whoAmI !== onClock.ownerId && (
                <p className="text-sm text-mute">
                  Not your turn — waiting on <span className="text-teal">{ownerMap.get(onClock.ownerId)?.name}</span>.
                </p>
              )}

              {whoAmI && whoAmI === onClock.ownerId && (
                <>
                  {pickMsg && <p className="mb-2 text-sm text-ember">{pickMsg}</p>}

                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={() => { setPickMode("pool"); resetPickForm(); setPickMsg(""); }}
                      className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${pickMode === "pool" ? "bg-teal text-ink" : "border border-line text-mute hover:text-bone"}`}
                    >
                      Pick from pool
                    </button>
                    <button
                      onClick={() => { setPickMode("manual"); resetPickForm(); setPickMsg(""); }}
                      className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${pickMode === "manual" ? "bg-teal text-ink" : "border border-line text-mute hover:text-bone"}`}
                    >
                      Player not in pool? Enter manually
                    </button>
                  </div>

                  {pickMode === "pool" && (
                    <>
                      <input
                        className="mb-2 w-full max-w-sm rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone"
                        placeholder="Search players..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <select
                        className={`${inputCls} max-w-sm`}
                        value={selectedPlayerId}
                        onChange={(e) => {
                          const p = pool.find((pl) => pl.id === e.target.value);
                          if (p) quickFill(p);
                        }}
                      >
                        <option value="">Select a player...</option>
                        {bestAvailable.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.rank ? `${p.rank}. ` : ""}{p.name} ({p.position ?? "?"} · {p.nfl_team ?? "?"}{p.bye_week ? ` · Bye ${p.bye_week}` : ""})
                          </option>
                        ))}
                      </select>
                      {pickName && (
                        <p className="mt-2 text-sm text-bone">
                          Selected: <span className="font-semibold text-teal">{pickName}</span> ({pickPos} · {pickTeam})
                        </p>
                      )}
                      {pool.length > 0 && (
                        <div className="mt-3 max-h-40 overflow-y-auto">
                          <div className="grid gap-1 sm:grid-cols-3">
                            {bestAvailable.slice(0, 30).map((p) => (
                              <button key={p.id} onClick={() => quickFill(p)} className="flex items-center justify-between rounded border border-line px-2 py-1 text-left text-xs text-mute hover:border-teal hover:text-teal">
                                <span className="flex items-center gap-1.5 text-bone">
                                  <TeamLogo team={p.nfl_team} size={14} />
                                  {p.rank ? `${p.rank}. ` : ""}{p.name}
                                </span>
                                <span>{p.position}{p.bye_week ? ` · Bye ${p.bye_week}` : ""}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {pickMode === "manual" && (
                    <>
                      <p className="mb-2 text-xs text-mute">Use this only if the player really isn&apos;t in the pool above — this won&apos;t update Best Available.</p>
                      <div className="grid gap-2 sm:grid-cols-4">
                        <input className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone sm:col-span-2" placeholder="Player name" value={pickName} onChange={(e) => { setPickName(e.target.value); setSelectedPlayerId(""); }} />
                        <input className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" placeholder="Position" value={pickPos} onChange={(e) => setPickPos(e.target.value)} />
                        <input className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" placeholder="NFL team" value={pickTeam} onChange={(e) => setPickTeam(e.target.value)} />
                      </div>
                    </>
                  )}

                  <button disabled={submitting} onClick={submitPick} className="mt-3 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">
                    {submitting ? "Saving..." : "Submit Pick"}
                  </button>
                </>
              )}
            </div>

            {whoAmI && (
              <YourTeamPanel picks={picks} owners={owners} whoAmI={whoAmI} rounds={draft.rounds} />
            )}
          </div>

          <CommissionerInProgress draft={draft} owners={owners} season={season} picks={picks} onChange={loadDraft} />
        </>
      )}

      {draft && draft.status === "complete" && (
        <>
          <div className="stat-card mb-8 rounded-xl p-5 text-center">
            <div className="font-display text-2xl text-gold">Draft Complete</div>
          </div>
          <CommissionerComplete draft={draft} onChange={loadDraft} />
        </>
      )}

      {draft && pool.length > 0 && draft.status !== "setup" && (
        <div className="stat-card mb-8 rounded-xl p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl text-bone">Best Available</h2>
            <span className="text-xs text-mute">{available.length} players left</span>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-bone outline-none focus:border-teal" placeholder="Search players..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {positions.map((pos) => (
              <button key={pos} onClick={() => setPosFilter(pos)} className={`rounded px-2 py-1 text-xs font-semibold uppercase ${posFilter === pos ? "bg-teal text-ink" : "border border-line text-mute hover:text-bone"}`}>
                {pos}
              </button>
            ))}
          </div>
          <div className="grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-3">
            {bestAvailable.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded border border-line px-2 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 text-bone">
                  <TeamLogo team={p.nfl_team} size={14} />
                  {p.rank ? `${p.rank}. ` : ""}{p.name}
                </span>
                <span className="text-mute">{[p.position, p.nfl_team, p.bye_week ? `Bye ${p.bye_week}` : null].filter(Boolean).join(" · ")}</span>
              </div>
            ))}
            {bestAvailable.length === 0 && <p className="text-xs text-mute">No matching players.</p>}
          </div>
        </div>
      )}

      {draft && (
        <>
          <DraftBoard draft={draft} owners={owners} ownerMap={ownerMap} pickMap={pickMap} />
          <h2 className="mt-12 font-display text-2xl tracking-wide text-bone">Recent Picks</h2>
          <div className="divider-tentacle my-4" />
          <div className="space-y-2">
            {[...picks].reverse().slice(0, 15).map((p) => (
              <div key={p.id} className="stat-card flex items-center justify-between rounded-lg px-4 py-2 text-sm">
                <span className="text-mute">Pick {p.pick_number} (Rd {p.round})</span>
                <span className="text-bone">{ownerMap.get(p.owner_id)?.name}</span>
                <span className="flex items-center gap-1.5 font-semibold text-teal">
                  <TeamLogo team={p.nfl_team} size={14} />
                  {p.player_name}{p.position ? ` (${p.position})` : ""}
                </span>
              </div>
            ))}
            {picks.length === 0 && <p className="text-mute">No picks yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}

function DraftBoard({ draft, owners, ownerMap, pickMap }: { draft: Draft; owners: Owner[]; ownerMap: Map<string, Owner>; pickMap: Map<number, DraftPick> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-14 border-b border-line py-2 text-left text-mute">Rd</th>
            {draft.draft_order.map((ownerId) => (
              <th key={ownerId} className="border-b border-line px-2 py-2 text-left font-semibold text-bone">{ownerMap.get(ownerId)?.name ?? "—"}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: draft.rounds }, (_, i) => i + 1).map((round) => {
            const order = teamOrderForRound(draft.draft_order, round);
            return (
              <tr key={round} className="border-b border-line/50">
                <td className="py-2 font-display text-base text-mute">{round}</td>
                {draft.draft_order.map((colOwnerId) => {
                  const pickInRound = order.indexOf(colOwnerId) + 1;
                  const pickNumber = (round - 1) * draft.draft_order.length + pickInRound;
                  const pick = pickMap.get(pickNumber);
                  const isOnClock = draft.status === "in_progress" && pickNumber === draft.current_pick;
                  return (
                    <td key={colOwnerId} className={`px-2 py-2 align-top ${isOnClock ? "bg-teal/10" : ""}`}>
                      {pick ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-bone">
                            <TeamLogo team={pick.nfl_team} size={14} />
                            {pick.player_name}
                          </div>
                          <div className="text-mute">{[pick.position, pick.nfl_team].filter(Boolean).join(" · ")}{pick.is_keeper ? " · Keeper" : ""}</div>
                        </div>
                      ) : isOnClock ? (
                        <span className="text-teal">on the clock</span>
                      ) : (
                        <span className="text-mute">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DraftCountdown({ scheduledAt }: { scheduledAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!scheduledAt) {
    return <p className="mb-6 rounded-lg border border-line bg-panel/60 p-4 text-sm text-mute">This draft hasn&apos;t started yet.</p>;
  }
  const target = new Date(scheduledAt).getTime();
  const diff = target - now;
  if (diff <= 0) {
    return (
      <div className="stat-card mb-6 rounded-xl border-teal/60 p-5 text-center">
        <div className="font-display text-2xl text-teal">Draft time! Waiting for the commissioner to start it.</div>
      </div>
    );
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return (
    <div className="stat-card mb-6 rounded-xl border-teal/60 p-5 text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-mute">Draft Starts In</div>
      <div className="mt-2 flex justify-center gap-4 font-display text-3xl text-teal">
        {days > 0 && <span>{days}d</span>}
        <span>{String(hours).padStart(2, "0")}h</span>
        <span>{String(minutes).padStart(2, "0")}m</span>
        <span>{String(seconds).padStart(2, "0")}s</span>
      </div>
      <div className="mt-2 text-xs text-mute">
        {new Date(scheduledAt).toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
      </div>
    </div>
  );
}

function YourTeamPanel({ picks, owners, whoAmI, rounds }: { picks: DraftPick[]; owners: Owner[]; whoAmI: string; rounds: number }) {
  const myPicks = picks.filter((p) => p.owner_id === whoAmI).sort((a, b) => a.pick_number - b.pick_number);
  const slots = buildRoster(myPicks);
  const owner = owners.find((o) => o.id === whoAmI);

  return (
    <div className="stat-card h-fit rounded-xl p-4">
      <h3 className="mb-3 font-display text-sm uppercase tracking-widest text-teal">
        {owner?.name ?? "Your"} Team ({myPicks.length}/{rounds})
      </h3>
      <div className="space-y-1">
        {slots.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded border border-line/60 px-2 py-1.5 text-xs">
            <span className="w-12 shrink-0 font-semibold text-mute">{s.label}</span>
            {s.pick ? (
              <span className="flex flex-1 items-center justify-end gap-1.5 truncate text-right text-bone">
                {s.pick.player_name}
                <TeamLogo team={s.pick.nfl_team} size={14} />
              </span>
            ) : (
              <span className="flex-1 text-right text-mute/50">empty</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Commissioner controls (inline, PIN-gated) ============ */

function useCommissionerUnlock() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => { setUnlocked(hasAdminSession()); }, []);

  async function submit() {
    setChecking(true);
    setError("");
    const { data } = await supabase.from("app_settings").select("value").eq("key", "admin_pin_hash").single();
    const hash = await sha256(pin);
    if (data?.value === hash) {
      markAdminSession();
      setUnlocked(true);
    } else {
      setError("Incorrect PIN.");
    }
    setChecking(false);
  }

  const gate = !unlocked ? (
    <div className="stat-card mb-6 rounded-xl p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mute">Commissioner Controls</p>
      <div className="flex gap-2">
        <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" className="w-32 rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" />
        <button disabled={checking} onClick={submit} className="rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">
          {checking ? "..." : "Unlock"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-ember">{error}</p>}
    </div>
  ) : null;

  return { unlocked, gate };
}

const inputCls = "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone outline-none focus:border-teal";

function CommissionerNoDraft({ owners, season, onChange }: { owners: Owner[]; season: Season; onChange: () => void }) {
  const { unlocked, gate } = useCommissionerUnlock();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function createDefault() {
    setBusy(true);
    const { error } = await supabase.from("drafts").insert({
      season_id: season.id,
      draft_order: owners.map((o) => o.id),
      rounds: 16,
      status: "setup",
    });
    setMsg(error ? `Error: ${error.message}` : "");
    setBusy(false);
    onChange();
  }

  return (
    <div>
      <p className="mb-6 rounded-lg border border-line bg-panel/60 p-4 text-sm text-mute">
        No draft set up for {season.year} yet. Run the{" "}
        <a href="/squid-race" className="text-teal hover:underline">Squid Race</a> to set the order automatically.
      </p>
      {gate}
      {unlocked && (
        <div className="stat-card rounded-xl p-4">
          <p className="mb-3 text-sm text-mute">Or create one now with the default order (edit it below once created):</p>
          {msg && <p className="mb-2 text-sm text-ember">{msg}</p>}
          <button disabled={busy} onClick={createDefault} className="rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">
            {busy ? "Creating..." : "Create Draft"}
          </button>
        </div>
      )}
    </div>
  );
}

function CommissionerSetup({
  draft, owners, season, picks, pool, onChange,
}: {
  draft: Draft; owners: Owner[]; season: Season; picks: DraftPick[]; pool: DraftPlayer[]; onChange: () => void;
}) {
  const { unlocked, gate } = useCommissionerUnlock();
  const [order, setOrder] = useState<string[]>(draft.draft_order);
  const [rounds, setRounds] = useState(draft.rounds);
  const [scheduledAt, setScheduledAt] = useState(draft.scheduled_at ? draft.scheduled_at.slice(0, 16) : "");
  const [poolText, setPoolText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setOrder(draft.draft_order); setRounds(draft.rounds); setScheduledAt(draft.scheduled_at ? draft.scheduled_at.slice(0, 16) : ""); }, [draft.id, draft.draft_order, draft.rounds, draft.scheduled_at]);

  function move(i: number, dir: -1 | 1) {
    const copy = [...order];
    const j = i + dir;
    if (j < 0 || j >= copy.length) return;
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setOrder(copy);
  }

  async function save() {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("drafts").update({
      rounds, draft_order: order, scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    }).eq("id", draft.id);
    if (error) { setBusy(false); return setMsg(`Error: ${error.message}`); }

    const lines = poolText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length) {
      const { data: existing } = await supabase.from("draft_players").select("id").eq("season_year", season.year);
      const startRank = (existing?.length ?? 0) + 1;
      const rows = lines.map((line, idx) => {
        const [name, position, nfl_team] = line.split(",").map((s) => s.trim());
        return { season_year: season.year, name, position: position || null, nfl_team: nfl_team || null, rank: startRank + idx };
      });
      const { error: poolErr } = await supabase.from("draft_players").insert(rows);
      if (poolErr) { setBusy(false); return setMsg(`Saved, but player pool failed: ${poolErr.message}`); }
      setPoolText("");
    }
    setBusy(false);
    setMsg("Saved.");
    onChange();
  }

  async function startDraft() {
    setBusy(true);
    const taken = new Set(picks.map((p) => p.pick_number));
    let firstOpen = 1;
    const total = order.length * rounds;
    while (taken.has(firstOpen) && firstOpen <= total) firstOpen++;
    const { error } = await supabase.from("drafts").update({ status: "in_progress", current_pick: firstOpen }).eq("id", draft.id);
    setMsg(error ? `Error: ${error.message}` : "");
    setBusy(false);
    onChange();
  }

  async function deleteDraft() {
    if (!confirm("Delete this draft entirely? All picks will be lost.")) return;
    await supabase.from("drafts").delete().eq("id", draft.id);
    onChange();
  }

  return (
    <div>
      {gate}
      {unlocked && (
        <div className="space-y-4">
          <div className="stat-card space-y-5 rounded-xl p-5">
            {msg && <p className="text-sm text-teal">{msg}</p>}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">Rounds</h3>
              <input type="number" className={`${inputCls} max-w-[120px]`} value={rounds} onChange={(e) => setRounds(+e.target.value)} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">Draft Start Time</h3>
              <input type="datetime-local" className={`${inputCls} max-w-xs`} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">Draft Order (Round 1)</h3>
              <p className="mb-2 text-xs text-mute">Set from the Squid Race — reorder with arrows if needed.</p>
              <div className="space-y-1">
                {order.map((id, i) => (
                  <div key={id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
                    <span className="text-bone">{i + 1}. {owners.find((o) => o.id === id)?.name}</span>
                    <span className="flex gap-2">
                      <button onClick={() => move(i, -1)} className="text-teal">↑</button>
                      <button onClick={() => move(i, 1)} className="text-teal">↓</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">Add to Player Pool</h3>
              <p className="mb-2 text-xs text-mute">One per line: <code>Name, Position, Team</code>. Already loaded with a starter pool — only add if you want more.</p>
              <textarea className={inputCls} rows={3} value={poolText} onChange={(e) => setPoolText(e.target.value)} placeholder={"Ja'Marr Chase, WR, CIN"} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal">Sync Player Pool from Sleeper</h3>
              <p className="mb-2 text-xs text-mute">Pulls live, current NFL rosters/teams/positions from Sleeper&apos;s free public database — this replaces the entire pool below with fresh data. Safe to re-run any time during the season.</p>
              <SyncPoolButton seasonYear={season.year} onDone={onChange} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button disabled={busy} onClick={save} className="rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">Save Setup</button>
              <button disabled={busy} onClick={startDraft} className="rounded-md bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">Start Draft</button>
              <button onClick={deleteDraft} className="rounded-md border border-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-ember">Delete Draft</button>
            </div>
          </div>
          <KeeperEntry draft={draft} owners={owners} pool={pool} picks={picks} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function SyncPoolButton({ seasonYear, onDone }: { seasonYear: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    if (!confirm("This replaces the entire player pool with fresh data from Sleeper. Continue?")) return;
    setBusy(true);
    setMsg("");
    try {
      const count = await syncPoolFromSleeper(seasonYear);
      setMsg(`Synced ${count} players from Sleeper.`);
      onDone();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
    setBusy(false);
  }

  return (
    <div>
      <button disabled={busy} onClick={run} className="rounded-md bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">
        {busy ? "Syncing..." : "Sync Pool from Sleeper"}
      </button>
      {msg && <p className="mt-2 text-sm text-teal">{msg}</p>}
    </div>
  );
}

function KeeperEntry({ draft, owners, pool, picks, onChange }: { draft: Draft; owners: Owner[]; pool: DraftPlayer[]; picks: DraftPick[]; onChange: () => void }) {
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? "");
  const [round, setRound] = useState(1);
  const [playerName, setPlayerName] = useState("");
  const [msg, setMsg] = useState("");
  const keepers = picks.filter((p) => p.is_keeper);

  async function addKeeper() {
    if (!playerName.trim()) return setMsg("Enter a player name.");
    const order = teamOrderForRound(draft.draft_order, round);
    const pickInRound = order.indexOf(ownerId) + 1;
    if (pickInRound === 0) return setMsg("Owner not found in draft order.");
    const pickNumber = (round - 1) * draft.draft_order.length + pickInRound;
    const matched = pool.find((p) => p.name.toLowerCase() === playerName.trim().toLowerCase());
    const { error } = await supabase.from("draft_picks").insert({
      draft_id: draft.id, pick_number: pickNumber, round, pick_in_round: pickInRound, owner_id: ownerId,
      player_name: playerName.trim(), position: matched?.position ?? null, nfl_team: matched?.nfl_team ?? null, is_keeper: true,
    });
    if (error) return setMsg(`Error: ${error.message}`);
    if (matched) await supabase.from("draft_players").update({ drafted: true }).eq("id", matched.id);
    setPlayerName(""); setMsg(""); onChange();
  }

  async function removeKeeper(id: string) {
    await supabase.from("draft_picks").delete().eq("id", id);
    onChange();
  }

  return (
    <div className="stat-card rounded-xl p-4">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal">Keepers</h4>
      {msg && <p className="mb-2 text-sm text-ember">{msg}</p>}
      <div className="grid gap-2 sm:grid-cols-4">
        <select className={inputCls} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          {owners.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
        </select>
        <input type="number" className={inputCls} value={round} onChange={(e) => setRound(+e.target.value)} placeholder="Round" />
        <input className={inputCls} value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player name" />
        <button onClick={addKeeper} className="rounded-md bg-teal px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink">Add Keeper</button>
      </div>
      {keepers.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {keepers.map((k) => (
            <li key={k.id} className="flex items-center justify-between">
              <span className="text-mute">Rd {k.round} — {owners.find((o) => o.id === k.owner_id)?.name}: <span className="text-bone">{k.player_name}</span></span>
              <button onClick={() => removeKeeper(k.id)} className="text-xs text-ember">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommissionerInProgress({ draft, owners, season, picks, onChange }: { draft: Draft; owners: Owner[]; season: Season; picks: DraftPick[]; onChange: () => void }) {
  const { unlocked, gate } = useCommissionerUnlock();
  const [msg, setMsg] = useState("");

  async function undoLast() {
    const nonKeeper = picks.filter((p) => !p.is_keeper);
    const last = nonKeeper[nonKeeper.length - 1];
    if (!last) return setMsg("No picks to undo.");
    await supabase.from("draft_picks").delete().eq("id", last.id);
    await supabase.from("draft_players").update({ drafted: false }).eq("season_year", season.year).ilike("name", last.player_name);
    await supabase.from("drafts").update({ current_pick: last.pick_number, status: "in_progress" }).eq("id", draft.id);
    setMsg(""); onChange();
  }

  async function deleteDraft() {
    if (!confirm("Delete this draft entirely? All picks will be lost.")) return;
    await supabase.from("drafts").delete().eq("id", draft.id);
    onChange();
  }

  return (
    <div className="mb-8">
      {gate}
      {unlocked && (
        <div className="stat-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-mute">Commissioner Controls</span>
          <div className="flex flex-wrap items-center gap-3">
            {msg && <span className="text-xs text-ember">{msg}</span>}
            <button onClick={undoLast} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ember hover:border-ember">Undo Last Pick</button>
            <button onClick={deleteDraft} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ember hover:border-ember">Delete Draft</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommissionerComplete({ draft, onChange }: { draft: Draft; onChange: () => void }) {
  const { unlocked, gate } = useCommissionerUnlock();

  async function deleteDraft() {
    if (!confirm("Delete this draft entirely? All picks will be lost.")) return;
    await supabase.from("drafts").delete().eq("id", draft.id);
    onChange();
  }

  return (
    <div className="mb-8">
      {gate}
      {unlocked && (
        <div className="stat-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-mute">Commissioner Controls</span>
          <button onClick={deleteDraft} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ember hover:border-ember">Delete Draft</button>
        </div>
      )}
    </div>
  );
}

/* ================= DRAFT HISTORY ================= */

function DraftHistoryTab({ owners, seasons }: { owners: Owner[]; seasons: Season[] }) {
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? "");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!seasonId) return;
    setLoaded(false);
    (async () => {
      const { data: d } = await supabase.from("drafts").select("*").eq("season_id", seasonId).maybeSingle();
      setDraft(d ?? null);
      if (d) {
        const { data: p } = await supabase.from("draft_picks").select("*").eq("draft_id", d.id).order("pick_number", { ascending: true });
        setPicks(p ?? []);
      } else {
        setPicks([]);
      }
      setLoaded(true);
    })();
  }, [seasonId]);

  const ownerMap = useMemo(() => new Map(owners.map((o) => [o.id, o])), [owners]);
  const pickMap = useMemo(() => new Map(picks.map((p) => [p.pick_number, p])), [picks]);

  return (
    <div>
      <select className="mb-6 rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
        {seasons.map((s) => (<option key={s.id} value={s.id}>{s.year}</option>))}
      </select>

      {!loaded && <p className="text-mute">Loading...</p>}
      {loaded && !draft && <p className="text-mute">No draft on record for this season.</p>}
      {loaded && draft && (
        <>
          {draft.status === "complete" && (
            <div className="stat-card mb-6 rounded-xl p-4 text-center">
              <span className="font-display text-xl text-gold">Draft Complete</span>
            </div>
          )}
          <DraftBoard draft={draft} owners={owners} ownerMap={ownerMap} pickMap={pickMap} />
        </>
      )}
    </div>
  );
}
