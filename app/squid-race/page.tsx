"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, Owner, Season } from "@/lib/supabase";

type RaceState = "idle" | "countdown" | "racing" | "finished";
type InkPuff = { key: number; laneIndex: number; left: number };

const TRACK_LEN = 100;
const LANE_COLORS = ["#f472b6", "#38bdf8", "#facc15", "#a78bfa", "#4ade80", "#fb923c", "#f87171", "#2dd4bf", "#c084fc", "#fbbf24", "#60a5fa", "#f97316"];
const BUBBLE_COUNT = 14;

export default function SquidRacePage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [raceState, setRaceState] = useState<RaceState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [finishOrder, setFinishOrder] = useState<string[]>([]);
  const [inkPuffs, setInkPuffs] = useState<InkPuff[]>([]);
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const speedsRef = useRef<Record<string, number>>({});
  const finishedRef = useRef<Set<string>>(new Set());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inkCounterRef = useRef(0);

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
      const { data: s } = await supabase.from("seasons").select("*").order("year", { ascending: false });
      setOwners(o ?? []);
      setSeasons(s ?? []);
      if (s && s.length) setSeasonId(s[0].id);
      setLoading(false);
    })();
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  function startRace() {
    finishedRef.current = new Set();
    setFinishOrder([]);
    setInkPuffs([]);
    const initial: Record<string, number> = {};
    const speeds: Record<string, number> = {};
    for (const o of owners) {
      initial[o.id] = 0;
      // Slower base pace than before — a longer, more suspenseful race.
      speeds[o.id] = 0.24 + Math.random() * 0.14;
    }
    setPositions(initial);
    speedsRef.current = speeds;
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

  // Tick-driven race loop — randomized per-tick variance, a mild
  // rubber-band pulling stragglers toward the leader for a close finish,
  // and the occasional ink-squirt burst for both drama and a speed kick.
  useEffect(() => {
    if (raceState !== "racing") return;

    tickRef.current = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        const leaderPos = Math.max(...owners.map((o) => prev[o.id] ?? 0));
        const order: string[] = [];
        const newPuffs: InkPuff[] = [];

        owners.forEach((o, i) => {
          if (finishedRef.current.has(o.id)) return;
          const pos = prev[o.id] ?? 0;
          const jitter = (Math.random() - 0.42) * 0.55;
          const rubberBand = Math.max(0, (leaderPos - pos) * 0.02);

          let inkBoost = 0;
          if (Math.random() < 0.025) {
            inkBoost = 1.6;
            const key = inkCounterRef.current++;
            newPuffs.push({ key, laneIndex: i, left: (pos / TRACK_LEN) * 88 + 4 });
            setTimeout(() => setInkPuffs((p) => p.filter((ip) => ip.key !== key)), 750);
          }

          const newPos = Math.min(TRACK_LEN, pos + speedsRef.current[o.id] + jitter + rubberBand + inkBoost);
          next[o.id] = newPos;
          if (newPos >= TRACK_LEN) order.push(o.id);
        });

        if (newPuffs.length) setInkPuffs((p) => [...p, ...newPuffs]);

        if (order.length) {
          order.sort((a, b) => (next[b] ?? 0) - (next[a] ?? 0));
          for (const id of order) finishedRef.current.add(id);
          setFinishOrder((prevOrder) => [...prevOrder, ...order]);
        }

        if (finishedRef.current.size === owners.length) {
          if (tickRef.current) clearInterval(tickRef.current);
          setRaceState("finished");
        }

        return next;
      });
    }, 90);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [raceState, owners]);

  async function useAsDraftOrder() {
    if (!seasonId) return;
    setSaving(true);
    setSaveMsg("");
    const { data: existing } = await supabase.from("drafts").select("*").eq("season_id", seasonId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("drafts").update({ draft_order: finishOrder }).eq("id", existing.id);
      setSaveMsg(error ? `Error: ${error.message}` : "Draft order updated — head to the Draft tab.");
    } else {
      const { error } = await supabase.from("drafts").insert({
        season_id: seasonId,
        draft_order: finishOrder,
        rounds: 17,
        status: "setup",
      });
      setSaveMsg(error ? `Error: ${error.message}` : "Draft created with this order — head to the Draft tab.");
    }
    setSaving(false);
  }

  const ownerMap = new Map(owners.map((o) => [o.id, o]));
  const liveStandings = [...owners].sort((a, b) => (positions[b.id] ?? 0) - (positions[a.id] ?? 0));

  if (loading) return <p className="text-mute">Loading...</p>;

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">Squid Race</h1>
      <p className="mt-2 text-mute">Twelve squids, one finish line, ink flying — winner picks first.</p>
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
        {raceState === "racing" && liveStandings[0] && (
          <span className="text-sm text-mute">
            In the lead: <span className="font-semibold text-gold">{liveStandings[0].name}</span> 🦑💨
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="ocean-track relative overflow-hidden rounded-xl border border-teal/20 p-4">
          {/* decorative rising bubbles */}
          {Array.from({ length: BUBBLE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="ocean-bubble pointer-events-none absolute rounded-full bg-teal/20"
              style={{
                left: `${(i * 137) % 100}%`,
                bottom: `-${10 + (i % 5) * 15}px`,
                width: 4 + (i % 4) * 3,
                height: 4 + (i % 4) * 3,
                animationDuration: `${3.5 + (i % 5)}s`,
                animationDelay: `${(i % 7) * 0.6}s`,
              }}
            />
          ))}

          {owners.map((o, i) => {
            const place = finishOrder.indexOf(o.id);
            const pos = positions[o.id] ?? 0;
            const isRacing = raceState === "racing" || raceState === "finished";
            return (
              <div key={o.id} className="relative mb-2 h-11 overflow-hidden rounded-md bg-black/20">
                <div className="absolute inset-y-0 left-2 z-10 flex items-center text-xs font-semibold text-bone/90 drop-shadow">
                  {o.name}
                </div>
                <div className="absolute right-2 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-teal/50" />

                {inkPuffs.filter((p) => p.laneIndex === i).map((p) => (
                  <div
                    key={p.key}
                    className="ink-puff pointer-events-none absolute top-1/2 h-6 w-6 rounded-full bg-[radial-gradient(circle,rgba(20,20,40,0.9)_0%,rgba(20,20,40,0)_70%)]"
                    style={{ left: `${p.left}%` }}
                  />
                ))}

                <div
                  className={`absolute top-1/2 -translate-y-1/2 text-2xl ${raceState === "racing" ? "squid-swim" : ""}`}
                  style={{
                    left: isRacing ? `calc(${(pos / TRACK_LEN) * 88}% + 4px)` : "6px",
                    transition: raceState === "racing" ? "left 90ms linear" : "none",
                    color: LANE_COLORS[i % LANE_COLORS.length],
                    filter: place === 0 ? "drop-shadow(0 0 6px #eab308)" : "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
                  }}
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

        {raceState === "racing" && (
          <div className="stat-card h-fit rounded-xl p-4">
            <h3 className="mb-3 font-display text-sm uppercase tracking-widest text-teal">Live Standings</h3>
            <ol className="space-y-1.5">
              {liveStandings.map((o, i) => (
                <li key={o.id} className="flex items-center justify-between text-xs">
                  <span className="text-mute">{i + 1}. {o.name}</span>
                  {finishedRef.current.has(o.id) && <span className="text-gold">🏁</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
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
