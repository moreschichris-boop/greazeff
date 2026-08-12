"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Owner, Draft, DraftPick, Season, DraftPlayer } from "@/lib/supabase";
import { teamOrderForRound, ownerForPick, totalPicks } from "@/lib/draft";

export default function DraftBoardPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string>("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [pool, setPool] = useState<DraftPlayer[]>([]);
  const [posFilter, setPosFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [whoAmI, setWhoAmI] = useState("");
  const [pickName, setPickName] = useState("");
  const [pickPos, setPickPos] = useState("");
  const [pickTeam, setPickTeam] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pickMsg, setPickMsg] = useState("");

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
    let cancelled = false;

    async function loadDraft() {
      const { data: d } = await supabase.from("drafts").select("*").eq("season_id", seasonId).maybeSingle();
      if (cancelled) return;
      setDraft(d ?? null);
      if (d) {
        const { data: p } = await supabase
          .from("draft_picks")
          .select("*")
          .eq("draft_id", d.id)
          .order("pick_number", { ascending: true });
        if (!cancelled) setPicks(p ?? []);
      } else {
        setPicks([]);
      }
    }
    loadDraft();

    return () => { cancelled = true; };
  }, [seasonId]);

  const season = seasons.find((s) => s.id === seasonId);

  useEffect(() => {
    if (!season) return;
    let cancelled = false;
    supabase.from("draft_players").select("*").eq("season_year", season.year).then(({ data }) => {
      if (!cancelled) setPool(data ?? []);
    });
    return () => { cancelled = true; };
  }, [season?.year]);

  // Realtime: live-update the pool as players get drafted, from any device.
  useEffect(() => {
    if (!season) return;
    const channel = supabase
      .channel(`draft-players-${season.year}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "draft_players", filter: `season_year=eq.${season.year}` }, (payload) => {
        setPool((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as DraftPlayer;
            if (prev.some((p) => p.id === row.id)) return prev;
            return [...prev, row];
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
    return () => { supabase.removeChannel(channel); };
  }, [season?.year]);

  // Realtime: live-update the board as picks are made and as the draft's
  // current_pick / status changes, from any device.
  useEffect(() => {
    if (!draft?.id) return;

    const channel = supabase
      .channel(`draft-${draft.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "draft_picks", filter: `draft_id=eq.${draft.id}` }, (payload) => {
        setPicks((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as DraftPick;
            if (prev.some((p) => p.id === row.id)) return prev;
            return [...prev, row].sort((a, b) => a.pick_number - b.pick_number);
          }
          if (payload.eventType === "DELETE") {
            return prev.filter((p) => p.id !== (payload.old as DraftPick).id);
          }
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
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const totalPickCount = draft ? totalPicks(draft.draft_order, draft.rounds) : 0;

  function quickFill(p: DraftPlayer) {
    setPickName(p.name);
    setPickPos(p.position ?? "");
    setPickTeam(p.nfl_team ?? "");
  }

  async function submitPick() {
    if (!draft || !onClock) return;
    if (whoAmI !== onClock.ownerId) return setPickMsg("It's not your turn yet.");
    if (!pickName.trim()) return setPickMsg("Enter a player name.");
    setSubmitting(true);
    setPickMsg("");

    const matched = pool.find((p) => p.name.toLowerCase() === pickName.trim().toLowerCase());
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
    if (error) {
      setSubmitting(false);
      return setPickMsg(`Error: ${error.message}`);
    }
    if (matched) await supabase.from("draft_players").update({ drafted: true }).eq("id", matched.id);

    const nextPick = draft.current_pick + 1;
    const newStatus = nextPick > totalPickCount ? "complete" : "in_progress";
    await supabase.from("drafts").update({ current_pick: nextPick, status: newStatus }).eq("id", draft.id);

    setPickName("");
    setPickPos("");
    setPickTeam("");
    setSubmitting(false);
  }

  if (loading) return <p className="text-mute">Loading...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-wide text-bone">Live Draft Board</h1>
        <select
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone"
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.year}</option>
          ))}
        </select>
      </div>
      <div className="divider-tentacle my-6" />

      {!draft && <p className="text-mute">No draft set up for this season yet.</p>}

      {draft && (
        <>
          {draft.status === "setup" && (
            <p className="mb-6 rounded-lg border border-line bg-panel/60 p-4 text-sm text-mute">
              This draft hasn&apos;t started yet.
            </p>
          )}

          {draft.status === "in_progress" && onClock && (
            <div className="stat-card mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border-teal/60 p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-mute">
                  On the Clock &middot; Round {onClock.round}, Pick {onClock.pickInRound}
                </div>
                <div className="font-display text-2xl text-teal">{ownerMap.get(onClock.ownerId)?.name ?? "—"}</div>
              </div>
              <div className="text-sm text-mute">
                Pick {draft.current_pick} of {totalPicks(draft.draft_order, draft.rounds)}
              </div>
            </div>
          )}

          {draft.status === "in_progress" && onClock && (
            <div className="stat-card mb-8 rounded-xl p-5">
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
                  <div className="grid gap-2 sm:grid-cols-4">
                    <input
                      className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone sm:col-span-2"
                      placeholder="Player name"
                      value={pickName}
                      onChange={(e) => setPickName(e.target.value)}
                    />
                    <input
                      className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone"
                      placeholder="Position"
                      value={pickPos}
                      onChange={(e) => setPickPos(e.target.value)}
                    />
                    <input
                      className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone"
                      placeholder="NFL team"
                      value={pickTeam}
                      onChange={(e) => setPickTeam(e.target.value)}
                    />
                  </div>
                  {pool.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <div className="grid gap-1 sm:grid-cols-3">
                        {bestAvailable.slice(0, 30).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => quickFill(p)}
                            className="flex items-center justify-between rounded border border-line px-2 py-1 text-left text-xs text-mute hover:border-teal hover:text-teal"
                          >
                            <span className="text-bone">{p.name}</span>
                            <span>{p.position}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    disabled={submitting}
                    onClick={submitPick}
                    className="mt-3 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Submit Pick"}
                  </button>
                </>
              )}
            </div>
          )}

          {draft.status === "complete" && (
            <div className="stat-card mb-8 rounded-xl p-5 text-center">
              <div className="font-display text-2xl text-gold">Draft Complete</div>
            </div>
          )}

          {pool.length > 0 && (
            <div className="stat-card mb-8 rounded-xl p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl text-bone">Best Available</h2>
                <span className="text-xs text-mute">{available.length} players left</span>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-bone outline-none focus:border-teal"
                  placeholder="Search players..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosFilter(pos)}
                    className={`rounded px-2 py-1 text-xs font-semibold uppercase ${
                      posFilter === pos ? "bg-teal text-ink" : "border border-line text-mute hover:text-bone"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              <div className="grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-3">
                {bestAvailable.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded border border-line px-2 py-1.5 text-xs">
                    <span className="text-bone">{p.name}</span>
                    <span className="text-mute">{[p.position, p.nfl_team].filter(Boolean).join(" · ")}</span>
                  </div>
                ))}
                {bestAvailable.length === 0 && <p className="text-xs text-mute">No matching players.</p>}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-14 border-b border-line py-2 text-left text-mute">Rd</th>
                  {draft.draft_order.map((ownerId) => (
                    <th key={ownerId} className="border-b border-line px-2 py-2 text-left font-semibold text-bone">
                      {ownerMap.get(ownerId)?.name ?? "—"}
                    </th>
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
                          <td
                            key={colOwnerId}
                            className={`px-2 py-2 align-top ${isOnClock ? "bg-teal/10" : ""}`}
                          >
                            {pick ? (
                              <div>
                                <div className="font-semibold text-bone">{pick.player_name}</div>
                                <div className="text-mute">
                                  {[pick.position, pick.nfl_team].filter(Boolean).join(" · ")}
                                  {pick.is_keeper ? " · Keeper" : ""}
                                </div>
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

          <h2 className="mt-12 font-display text-2xl tracking-wide text-bone">Recent Picks</h2>
          <div className="divider-tentacle my-4" />
          <div className="space-y-2">
            {[...picks].reverse().slice(0, 15).map((p) => (
              <div key={p.id} className="stat-card flex items-center justify-between rounded-lg px-4 py-2 text-sm">
                <span className="text-mute">
                  Pick {p.pick_number} (Rd {p.round})
                </span>
                <span className="text-bone">{ownerMap.get(p.owner_id)?.name}</span>
                <span className="font-semibold text-teal">
                  {p.player_name}
                  {p.position ? ` (${p.position})` : ""}
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
