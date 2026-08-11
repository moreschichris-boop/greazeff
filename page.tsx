"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Owner, Season, ParlayPick } from "@/lib/supabase";

export default function ParlayPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [week, setWeek] = useState(1);
  const [picks, setPicks] = useState<ParlayPick[]>([]);
  const [loading, setLoading] = useState(true);

  const [whoAmI, setWhoAmI] = useState("");
  const [pickText, setPickText] = useState("");
  const [odds, setOdds] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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

  async function loadPicks() {
    if (!seasonId) return;
    const { data } = await supabase.from("parlay_picks").select("*").eq("season_id", seasonId).eq("week", week);
    setPicks(data ?? []);
  }
  useEffect(() => { loadPicks(); }, [seasonId, week]);

  const ownerMap = useMemo(() => new Map(owners.map((o) => [o.id, o])), [owners]);
  const pickMap = useMemo(() => new Map(picks.map((p) => [p.owner_id, p])), [picks]);
  const submittedCount = picks.length;

  // Realtime: everyone's screen updates as picks come in.
  useEffect(() => {
    if (!seasonId) return;
    const channel = supabase
      .channel(`parlay-${seasonId}-${week}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parlay_picks", filter: `season_id=eq.${seasonId}` }, () => {
        loadPicks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId, week]);

  useEffect(() => {
    if (!whoAmI) return;
    const existing = pickMap.get(whoAmI);
    setPickText(existing?.pick ?? "");
    setOdds(existing?.odds ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whoAmI, week, seasonId]);

  async function submit() {
    if (!whoAmI) return setMsg("Pick who you are first.");
    if (!pickText.trim()) return setMsg("Enter your pick.");
    setSaving(true);
    const { error } = await supabase.from("parlay_picks").upsert(
      { season_id: seasonId, week, owner_id: whoAmI, pick: pickText.trim(), odds: odds.trim() || null, updated_at: new Date().toISOString() },
      { onConflict: "season_id,week,owner_id" }
    );
    setSaving(false);
    if (error) return setMsg(`Error: ${error.message}`);
    setMsg("Saved!");
    loadPicks();
  }

  if (loading) return <p className="text-mute">Loading...</p>;

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">Weekly Parlay</h1>
      <p className="mt-2 text-mute">$5 in, everyone picks a leg, all 12 get parlayed together.</p>
      <div className="divider-tentacle my-6" />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <select className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
          {seasons.map((s) => (<option key={s.id} value={s.id}>{s.year}</option>))}
        </select>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeek((w) => Math.max(1, w - 1))} className="rounded-md border border-line px-3 py-2 text-sm text-mute hover:text-bone">−</button>
          <span className="font-display text-lg text-bone">Week {week}</span>
          <button onClick={() => setWeek((w) => Math.min(18, w + 1))} className="rounded-md border border-line px-3 py-2 text-sm text-mute hover:text-bone">+</button>
        </div>
        <span className="text-xs text-mute">{submittedCount} / {owners.length} submitted</span>
      </div>

      <div className="stat-card mb-10 rounded-xl p-5">
        <h2 className="mb-3 font-display text-lg text-teal">Enter Your Pick</h2>
        {msg && <p className="mb-2 text-sm text-teal">{msg}</p>}
        <div className="grid gap-2 sm:grid-cols-4">
          <select className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" value={whoAmI} onChange={(e) => setWhoAmI(e.target.value)}>
            <option value="">Who are you?</option>
            {owners.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
          </select>
          <input
            className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone sm:col-span-2"
            placeholder="Your bet (e.g. Chiefs -3.5)"
            value={pickText}
            onChange={(e) => setPickText(e.target.value)}
          />
          <input
            className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone"
            placeholder="Odds (optional)"
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
          />
        </div>
        <button disabled={saving} onClick={submit} className="mt-3 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">
          {saving ? "Saving..." : pickMap.get(whoAmI) ? "Update Pick" : "Submit Pick"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {owners.map((o) => {
          const p = pickMap.get(o.id);
          return (
            <div key={o.id} className="stat-card flex items-center justify-between rounded-xl p-4">
              <div>
                <div className="font-semibold text-bone">{o.name}</div>
                {p ? (
                  <div className="text-sm text-teal">{p.pick}{p.odds ? ` (${p.odds})` : ""}</div>
                ) : (
                  <div className="text-sm text-mute">Not submitted yet</div>
                )}
              </div>
              {p && <span className="rounded bg-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-teal">In</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
