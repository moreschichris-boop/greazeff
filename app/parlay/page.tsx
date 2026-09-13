"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Owner, Season, ParlayPick, ParlaySlip } from "@/lib/supabase";
import { sha256, markAdminSession, hasAdminSession } from "@/lib/auth";
import { uploadMedia } from "@/lib/upload";

export default function ParlayPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [week, setWeek] = useState(1);
  const [picks, setPicks] = useState<ParlayPick[]>([]);
  const [seasonPicks, setSeasonPicks] = useState<ParlayPick[]>([]);
  const [loading, setLoading] = useState(true);

  const [whoAmI, setWhoAmI] = useState("");
  const [pickText, setPickText] = useState("");
  const [odds, setOdds] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const { unlocked, gate } = useCommissionerUnlock();

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

  async function loadSeasonPicks() {
    if (!seasonId) return;
    const { data } = await supabase.from("parlay_picks").select("*").eq("season_id", seasonId);
    setSeasonPicks(data ?? []);
  }
  useEffect(() => { loadSeasonPicks(); }, [seasonId]);

  const ownerMap = useMemo(() => new Map(owners.map((o) => [o.id, o])), [owners]);
  const pickMap = useMemo(() => new Map(picks.map((p) => [p.owner_id, p])), [picks]);
  const submittedCount = picks.length;

  // Realtime: everyone's screen updates as picks + results come in.
  useEffect(() => {
    if (!seasonId) return;
    const channel = supabase
      .channel(`parlay-${seasonId}-${week}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parlay_picks", filter: `season_id=eq.${seasonId}` }, () => {
        loadPicks();
        loadSeasonPicks();
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

  async function setResult(pickId: string, result: "pending" | "win" | "loss" | "push") {
    await supabase.from("parlay_picks").update({ result }).eq("id", pickId);
    loadPicks();
    loadSeasonPicks();
  }

  // Season-long record per owner, across every week.
  const seasonRecords = useMemo(() => {
    const map = new Map<string, { win: number; loss: number; push: number }>();
    for (const o of owners) map.set(o.id, { win: 0, loss: 0, push: 0 });
    for (const p of seasonPicks) {
      if (p.result === "pending") continue;
      const rec = map.get(p.owner_id);
      if (rec) rec[p.result]++;
    }
    return map;
  }, [seasonPicks, owners]);

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

      {gate}
            <SlipSummary seasonId={seasonId} week={week} />

      <div className="grid gap-3 sm:grid-cols-2">
        {owners.map((o) => {
          const p = pickMap.get(o.id);
          return (
            <div key={o.id} className="stat-card rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-bone">{o.name}</div>
                  {p ? (
                    <div className="truncate text-sm text-teal">{p.pick}{p.odds ? ` (${p.odds})` : ""}</div>
                  ) : (
                    <div className="text-sm text-mute">Not submitted yet</div>
                  )}
                </div>
                {p && <ResultBadge result={p.result} />}
              </div>

              {p && unlocked && (
                <div className="mt-3 flex gap-2">
                  <ResultButton label="Win" active={p.result === "win"} onClick={() => setResult(p.id, "win")} color="teal" />
                  <ResultButton label="Loss" active={p.result === "loss"} onClick={() => setResult(p.id, "loss")} color="ember" />
                  <ResultButton label="Push" active={p.result === "push"} onClick={() => setResult(p.id, "push")} color="gold" />
                  {p.result !== "pending" && (
                    <ResultButton label="Reset" active={false} onClick={() => setResult(p.id, "pending")} color="mute" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mt-12 font-display text-2xl tracking-wide text-bone">Season Record</h2>
      <div className="divider-tentacle my-4" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-mute">
              <th className="py-2">Owner</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Pushes</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((o) => {
              const rec = seasonRecords.get(o.id) ?? { win: 0, loss: 0, push: 0 };
              return (
                <tr key={o.id} className="border-b border-line/60">
                  <td className="py-2 text-bone">{o.name}</td>
                  <td className="text-teal">{rec.win}</td>
                  <td className="text-ember">{rec.loss}</td>
                  <td className="text-gold">{rec.push}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: "pending" | "win" | "loss" | "push" }) {
  if (result === "pending") return <span className="shrink-0 rounded bg-line px-2 py-0.5 text-[10px] font-semibold uppercase text-mute">Pending</span>;
  if (result === "win") return <span className="shrink-0 rounded bg-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-teal">Win</span>;
  if (result === "loss") return <span className="shrink-0 rounded bg-ember/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-ember">Loss</span>;
  return <span className="shrink-0 rounded bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">Push</span>;
}

function ResultButton({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: "teal" | "ember" | "gold" | "mute";
}) {
  const activeClasses: Record<string, string> = {
    teal: "bg-teal text-ink",
    ember: "bg-ember text-ink",
    gold: "bg-gold text-ink",
    mute: "border border-line text-mute",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        active ? activeClasses[color] : "border border-line text-mute hover:text-bone"
      }`}
    >
      {label}
    </button>
  );
}

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
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mute">Enter PIN to mark results (commissioner only)</p>
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

function SlipSummary({ seasonId, week }: { seasonId: string; week: number }) {
  const [slip, setSlip] = useState<ParlaySlip | null>(null);
  const [wager, setWager] = useState("");
  const [odds, setOdds] = useState("");
  const [toPay, setToPay] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!seasonId) return;
    const { data } = await supabase.from("parlay_slips").select("*").eq("season_id", seasonId).eq("week", week).maybeSingle();
    setSlip(data ?? null);
    setWager(data?.wager != null ? String(data.wager) : "");
    setOdds(data?.odds ?? "");
    setToPay(data?.to_pay != null ? String(data.to_pay) : "");
  }
  useEffect(() => { load(); setFile(null); setMsg(""); }, [seasonId, week]);

  async function save() {
    setSaving(true);
    setMsg("");
    let photo_url = slip?.photo_url ?? null;
    if (file) {
      try {
        const { url } = await uploadMedia(file, `parlay-${week}`);
        photo_url = url;
      } catch (err: any) {
        setMsg(`Photo upload failed: ${err.message ?? err}`);
        setSaving(false);
        return;
      }
    }
    const { error } = await supabase.from("parlay_slips").upsert(
      {
        season_id: seasonId,
        week,
        wager: wager ? +wager : null,
        odds: odds || null,
        to_pay: toPay ? +toPay : null,
        photo_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "season_id,week" }
    );
    setSaving(false);
    if (error) return setMsg(`Error: ${error.message}`);
    setMsg("Saved!");
    setFile(null);
    load();
  }

  return (
    <div className="stat-card mb-10 rounded-xl p-5">
      <h2 className="mb-3 font-display text-lg text-teal">This Week's Slip</h2>
      {msg && <p className="mb-2 text-sm text-teal">{msg}</p>}

      {slip?.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slip.photo_url} alt="Parlay slip" className="mb-4 max-h-96 rounded-lg border border-line object-contain" />
      )}

      {(slip?.wager || slip?.odds || slip?.to_pay) && (
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          {slip?.wager != null && <span className="text-mute">Wager: <span className="font-semibold text-bone">${slip.wager}</span></span>}
          {slip?.odds && <span className="text-mute">Odds: <span className="font-semibold text-bone">{slip.odds}</span></span>}
          {slip?.to_pay != null && <span className="text-mute">To Pay: <span className="font-semibold text-teal">${slip.to_pay.toLocaleString()}</span></span>}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-4">
        <input className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" placeholder="Wager ($)" value={wager} onChange={(e) => setWager(e.target.value)} />
        <input className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" placeholder="Odds (e.g. +193886)" value={odds} onChange={(e) => setOdds(e.target.value)} />
        <input className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone" placeholder="To Pay ($)" value={toPay} onChange={(e) => setToPay(e.target.value)} />
        <input
          type="file"
          accept="image/*"
          className="rounded-md border border-line bg-panel px-2 py-1.5 text-xs text-bone file:mr-2 file:rounded file:border-0 file:bg-teal file:px-2 file:py-1 file:text-[10px] file:font-bold file:uppercase file:text-ink"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <button disabled={saving} onClick={save} className="mt-3 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">
        {saving ? "Saving..." : "Save Slip"}
      </button>
    </div>
  );
}
