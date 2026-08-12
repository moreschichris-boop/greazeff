"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, Owner, Season } from "@/lib/supabase";

type RaceState = "idle" | "countdown" | "racing" | "finished";

const LANE_COLORS = ["#f472b6", "#38bdf8", "#facc15", "#a78bfa", "#4ade80", "#fb923c", "#f87171", "#2dd4bf", "#c084fc", "#fbbf24", "#60a5fa", "#f97316"];

export default function SquidRacePage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [raceState, setRaceState] = useState<RaceState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [finishOrder, setFinishOrder] = useState<string[]>([]);
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const finishedRef = useRef<Set<string>>(new Set());

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

  async function useAsDraftOrder() {
    if (!seasonId) return;
    setSaving(true);
    setSaveMsg("");
    const { data: existing } = await supabase.from("drafts").select("*").eq("season_id", seasonId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("drafts").update({ draft_order: finishOrder }).eq("id", existing.id);
      setSaveMsg(error ? `Error: ${error.message}` : "Draft order updated for this season.");
    } else {
      const { error } = await supabase.from("drafts").insert({
        season_id: seasonId,
        draft_order: finishOrder,
        rounds: 17,
        status: "setup",
      });
      setSaveMsg(error ? `Error: ${error.message}` : "Draft created with this order — finish setup in Admin (rounds, player pool, start time).");
    }
    setSaving(false);
  }

  function startRace() {
    finishedRef.current = new Set();
    setFinishOrder([]);
    const newDurations: Record<string, number> = {};
    for (const o of owners) newDurations[o.id] = 5 + Math.random() * 6; // 5-11s
    setDurations(newDurations);
    setRaceState("countdown");
    setCountdown(3);
  }

  useEffect(() => {
    if (raceState !== "countdown") return;
    if (countdown <= 0) {
      setRaceState("racing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [raceState, countdown]);

  function handleFinish(ownerId: string) {
    if (finishedRef.current.has(ownerId)) return;
    finishedRef.current.add(ownerId);
    setFinishOrder((prev) => {
      const next = [...prev, ownerId];
      if (next.length === owners.length) setRaceState("finished");
      return next;
    });
  }

  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  if (loading) return <p className="text-mute">Loading...</p>;

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">Squid Race</h1>
      <p className="mt-2 text-mute">Twelve squids, one finish line — winner picks first.</p>
      <div className="divider-tentacle my-6" />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone"
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
        >
          {seasons.map((s) => (<option key={s.id} value={s.id}>{s.year}</option>))}
        </select>
        <button
          onClick={startRace}
          disabled={raceState === "countdown" || raceState === "racing"}
          className="rounded-md bg-teal px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink disabled:opacity-50"
        >
          {raceState === "idle" ? "Start Race" : raceState === "finished" ? "Race Again" : "Racing..."}
        </button>
        {raceState === "countdown" && (
          <span className="font-display text-3xl text-gold">{countdown > 0 ? countdown : "GO!"}</span>
        )}
      </div>

      <div className="stat-card overflow-hidden rounded-xl p-4">
        {owners.map((o, i) => {
          const place = finishOrder.indexOf(o.id);
          const isRacing = raceState === "racing" || raceState === "finished";
          return (
            <div key={o.id} className="relative mb-2 h-11 overflow-hidden rounded-md bg-panel/60">
              <div className="absolute inset-y-0 left-2 z-10 flex items-center text-xs font-semibold text-mute">
                {o.name}
              </div>
              <div className="absolute right-2 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-teal/40" />
              <div
                className={`absolute top-1/2 -translate-y-1/2 text-2xl ${raceState === "racing" ? "squid-swim" : ""}`}
                style={{
                  left: isRacing ? "calc(100% - 44px)" : "6px",
                  transition:
                    raceState === "racing"
                      ? `left ${durations[o.id] ?? 8}s cubic-bezier(0.4, 0, 0.2, 1)`
                      : "none",
                  color: LANE_COLORS[i % LANE_COLORS.length],
                }}
                onTransitionEnd={() => raceState === "racing" && handleFinish(o.id)}
              >
                🦑
              </div>
              {place >= 0 && (
                <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                  #{place + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {raceState === "finished" && (
        <div className="mt-10">
          <h2 className="font-display text-2xl tracking-wide text-bone">Draft Order</h2>
          <p className="mt-1 text-sm text-mute">1st place picks first.</p>
          <div className="divider-tentacle my-4" />
          <ol className="space-y-2">
            {finishOrder.map((id, i) => (
              <li key={id} className="stat-card flex items-center gap-4 rounded-lg px-4 py-3">
                <span className="font-display text-2xl text-gold">{i + 1}</span>
                <span className="text-bone">{ownerMap.get(id)?.name}</span>
              </li>
            ))}
          </ol>
          {saveMsg && <p className="mt-4 text-sm text-teal">{saveMsg}</p>}
          <button
            disabled={saving}
            onClick={useAsDraftOrder}
            className="mt-4 rounded-md bg-teal px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink disabled:opacity-50"
          >
            {saving ? "Saving..." : `Use as ${seasons.find((s) => s.id === seasonId)?.year ?? ""} Draft Order`}
          </button>
        </div>
      )}
    </div>
  );
}
