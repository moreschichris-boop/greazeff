"use client";

import { useEffect, useState } from "react";
import { supabase, Owner, Season, SeasonResult, RecordEntry, Photo, Draft, DraftPlayer, DraftPick, RosterEntry } from "@/lib/supabase";
import { sha256, markAdminSession, hasAdminSession, clearAdminSession } from "@/lib/auth";
import { teamOrderForRound, ownerForPick, totalPicks } from "@/lib/draft";

type Tab = "owners" | "seasons" | "standings" | "rosters" | "draft" | "records" | "photos" | "settings";

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUnlocked(hasAdminSession());
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;
  return <AdminDashboard onLock={() => { clearAdminSession(); setUnlocked(false); }} />;
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data } = await supabase.from("app_settings").select("value").eq("key", "admin_pin_hash").single();
    const hash = await sha256(pin);
    if (data?.value === hash) {
      markAdminSession();
      onUnlock();
    } else {
      setError("Incorrect PIN.");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto mt-16 max-w-sm text-center">
      <h1 className="font-display text-3xl tracking-wide text-bone">Admin Access</h1>
      <p className="mt-2 text-sm text-mute">Enter the league PIN to edit the site.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full rounded-md border border-line bg-panel px-4 py-2.5 text-center text-lg tracking-widest text-bone outline-none focus:border-teal"
          placeholder="PIN"
          autoFocus
        />
        {error && <p className="text-sm text-ember">{error}</p>}
        <button disabled={busy} className="w-full rounded-md bg-teal py-2.5 font-bold uppercase tracking-wide text-ink hover:bg-teal/90 disabled:opacity-50">
          {busy ? "Checking..." : "Enter"}
        </button>
      </form>
      <p className="mt-4 text-xs text-mute">Default PIN is 3113 unless it&apos;s been changed.</p>
    </div>
  );
}

function AdminDashboard({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<Tab>("owners");
  const tabs: { key: Tab; label: string }[] = [
    { key: "owners", label: "Owners" },
    { key: "seasons", label: "Seasons" },
    { key: "standings", label: "Standings" },
    { key: "rosters", label: "Rosters" },
    { key: "draft", label: "Draft" },
    { key: "records", label: "Records" },
    { key: "photos", label: "Photos" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-wide text-bone">Admin Panel</h1>
        <button onClick={onLock} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-mute hover:border-ember hover:text-ember">
          Lock
        </button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              tab === t.key ? "bg-teal text-ink" : "border border-line text-mute hover:text-bone"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "owners" && <OwnersTab />}
        {tab === "seasons" && <SeasonsTab />}
        {tab === "standings" && <StandingsTab />}
        {tab === "rosters" && <RostersTab />}
        {tab === "draft" && <DraftTab />}
        {tab === "records" && <RecordsTab />}
        {tab === "photos" && <PhotosTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */

function SectionMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="mb-3 text-sm text-teal">{msg}</p>;
}

const inputCls =
  "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone outline-none focus:border-teal";

/* ---------- Owners ---------- */

function OwnersTab() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<Owner | null>(null);

  async function load() {
    const { data } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
    setOwners(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save(o: Owner) {
    const { id, ...rest } = o;
    const { error } = await supabase.from("owners").update(rest).eq("id", id);
    setMsg(error ? `Error: ${error.message}` : "Saved.");
    setEditing(null);
    load();
  }

  async function addOwner() {
    const name = prompt("Owner name?");
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("owners").insert({ slug, name, sort_order: owners.length });
    setMsg(error ? `Error: ${error.message}` : "Added.");
    load();
  }

  return (
    <div>
      <SectionMsg msg={msg} />
      <button onClick={addOwner} className="mb-4 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
        + Add Owner
      </button>
      <div className="grid gap-3">
        {owners.map((o) => (
          <div key={o.id} className="stat-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-bone">{o.name}</div>
              <button onClick={() => setEditing(editing?.id === o.id ? null : o)} className="text-xs font-semibold text-teal">
                {editing?.id === o.id ? "Close" : "Edit"}
              </button>
            </div>
            {editing?.id === o.id && <OwnerForm owner={editing} onSave={save} setOwner={setEditing} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnerForm({ owner, setOwner, onSave }: { owner: Owner; setOwner: (o: Owner) => void; onSave: (o: Owner) => void }) {
  const questionnaire = owner.questionnaire ?? [];

  function updateQ(i: number, key: "question" | "answer", val: string) {
    const copy = [...questionnaire];
    copy[i] = { ...copy[i], [key]: val };
    setOwner({ ...owner, questionnaire: copy });
  }
  function addQ() {
    setOwner({ ...owner, questionnaire: [...questionnaire, { question: "", answer: "" }] });
  }
  function removeQ(i: number) {
    setOwner({ ...owner, questionnaire: questionnaire.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="mt-4 space-y-3">
      <input className={inputCls} value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} placeholder="Name" />
      <input className={inputCls} value={owner.team_name ?? ""} onChange={(e) => setOwner({ ...owner, team_name: e.target.value })} placeholder="Team name" />
      <input className={inputCls} value={owner.photo_url ?? ""} onChange={(e) => setOwner({ ...owner, photo_url: e.target.value })} placeholder="Photo URL" />
      <textarea className={inputCls} value={owner.bio ?? ""} onChange={(e) => setOwner({ ...owner, bio: e.target.value })} placeholder="Bio" rows={3} />

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-mute">Questionnaire</div>
        {questionnaire.map((q, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input className={inputCls} value={q.question} onChange={(e) => updateQ(i, "question", e.target.value)} placeholder="Question" />
            <input className={inputCls} value={q.answer} onChange={(e) => updateQ(i, "answer", e.target.value)} placeholder="Answer" />
            <button onClick={() => removeQ(i)} className="text-ember text-xs">✕</button>
          </div>
        ))}
        <button onClick={addQ} className="text-xs font-semibold text-teal">+ Add question</button>
      </div>

      <button onClick={() => onSave(owner)} className="rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
        Save
      </button>
    </div>
  );
}

/* ---------- Seasons ---------- */

function SeasonsTab() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [editing, setEditing] = useState<Season | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data: o } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
    const { data: s } = await supabase.from("seasons").select("*").order("year", { ascending: false });
    setOwners(o ?? []);
    setSeasons(s ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save(s: Season) {
    const { id, ...rest } = s;
    const { error } = await supabase.from("seasons").update(rest).eq("id", id);
    setMsg(error ? `Error: ${error.message}` : "Saved.");
    setEditing(null);
    load();
  }

  async function addSeason() {
    const year = prompt("Season year? e.g. 2026-27");
    if (!year) return;
    const { error } = await supabase.from("seasons").insert({ year });
    setMsg(error ? `Error: ${error.message}` : "Added.");
    load();
  }

  return (
    <div>
      <SectionMsg msg={msg} />
      <button onClick={addSeason} className="mb-4 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
        + Add Season
      </button>
      <div className="grid gap-3">
        {seasons.map((s) => (
          <div key={s.id} className="stat-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-display text-xl text-bone">{s.year}</div>
              <button onClick={() => setEditing(editing?.id === s.id ? null : s)} className="text-xs font-semibold text-teal">
                {editing?.id === s.id ? "Close" : "Edit"}
              </button>
            </div>
            {editing?.id === s.id && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <OwnerSelect label="Champion" owners={owners} value={editing.champion_id} onChange={(v) => setEditing({ ...editing, champion_id: v })} />
                <OwnerSelect label="Runner-Up" owners={owners} value={editing.runner_up_id} onChange={(v) => setEditing({ ...editing, runner_up_id: v })} />
                <OwnerSelect label="Reg. Season Winner" owners={owners} value={editing.reg_season_winner_id} onChange={(v) => setEditing({ ...editing, reg_season_winner_id: v })} />
                <OwnerSelect label="Toilet Bowl (Last Place)" owners={owners} value={editing.last_place_id} onChange={(v) => setEditing({ ...editing, last_place_id: v })} />
                <textarea
                  className={`${inputCls} sm:col-span-2`}
                  placeholder="Notes"
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
                <button onClick={() => save(editing)} className="sm:col-span-2 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
                  Save
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnerSelect({
  label,
  owners,
  value,
  onChange,
}: {
  label: string;
  owners: Owner[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <label className="text-xs text-mute">
      {label}
      <select className={`${inputCls} mt-1`} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">—</option>
        {owners.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </label>
  );
}

/* ---------- Standings ---------- */

function StandingsTab() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasonId, setSeasonId] = useState<string>("");
  const [results, setResults] = useState<SeasonResult[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("seasons").select("*").order("year", { ascending: false });
      const { data: o } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
      setSeasons(s ?? []);
      setOwners(o ?? []);
      if (s && s.length) setSeasonId(s[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!seasonId) return;
    supabase.from("season_results").select("*").eq("season_id", seasonId).then(({ data }) => {
      setResults(data ?? []);
    });
  }, [seasonId]);

  function rowFor(ownerId: string): SeasonResult {
    return (
      results.find((r) => r.owner_id === ownerId) ?? {
        id: "",
        season_id: seasonId,
        owner_id: ownerId,
        wins: 0,
        losses: 0,
        ties: 0,
        points_for: null,
        points_against: null,
        final_rank: null,
        made_playoffs: false,
      }
    );
  }

  function updateRow(ownerId: string, patch: Partial<SeasonResult>) {
    setResults((prev) => {
      const existing = prev.find((r) => r.owner_id === ownerId);
      if (existing) return prev.map((r) => (r.owner_id === ownerId ? { ...r, ...patch } : r));
      return [...prev, { ...rowFor(ownerId), ...patch }];
    });
  }

  async function saveAll() {
    setMsg("Saving...");
    for (const r of results) {
      const { id, ...rest } = r;
      const { error } = await supabase.from("season_results").upsert(
        { ...rest, id: id || undefined },
        { onConflict: "season_id,owner_id" }
      );
      if (error) {
        setMsg(`Error: ${error.message}`);
        return;
      }
    }
    setMsg("Standings saved.");
  }

  return (
    <div>
      <SectionMsg msg={msg} />
      <select className={`${inputCls} mb-4 max-w-xs`} value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>{s.year}</option>
        ))}
      </select>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-mute">
              <th className="py-2">Owner</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>PF</th>
              <th>PA</th>
              <th>Rank</th>
              <th>Playoffs</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((o) => {
              const r = rowFor(o.id);
              return (
                <tr key={o.id} className="border-b border-line/60">
                  <td className="py-2 text-bone">{o.name}</td>
                  <td><input type="number" className={`${inputCls} w-16`} value={r.wins} onChange={(e) => updateRow(o.id, { wins: +e.target.value })} /></td>
                  <td><input type="number" className={`${inputCls} w-16`} value={r.losses} onChange={(e) => updateRow(o.id, { losses: +e.target.value })} /></td>
                  <td><input type="number" className={`${inputCls} w-16`} value={r.ties} onChange={(e) => updateRow(o.id, { ties: +e.target.value })} /></td>
                  <td><input type="number" step="0.01" className={`${inputCls} w-24`} value={r.points_for ?? ""} onChange={(e) => updateRow(o.id, { points_for: e.target.value ? +e.target.value : null })} /></td>
                  <td><input type="number" step="0.01" className={`${inputCls} w-24`} value={r.points_against ?? ""} onChange={(e) => updateRow(o.id, { points_against: e.target.value ? +e.target.value : null })} /></td>
                  <td><input type="number" className={`${inputCls} w-16`} value={r.final_rank ?? ""} onChange={(e) => updateRow(o.id, { final_rank: e.target.value ? +e.target.value : null })} /></td>
                  <td className="text-center"><input type="checkbox" checked={r.made_playoffs} onChange={(e) => updateRow(o.id, { made_playoffs: e.target.checked })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={saveAll} className="mt-4 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
        Save Standings
      </button>
    </div>
  );
}

/* ---------- Rosters ---------- */

function RostersTab() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("seasons").select("*").order("year", { ascending: false });
      const { data: o } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
      setSeasons(s ?? []);
      setOwners(o ?? []);
      if (s && s.length) setSeasonId(s[0].id);
      if (o && o.length) setOwnerId(o[0].id);
    })();
  }, []);

  async function load() {
    if (!seasonId || !ownerId) return;
    const { data } = await supabase
      .from("roster_entries")
      .select("*")
      .eq("season_id", seasonId)
      .eq("owner_id", ownerId)
      .order("sort_order", { ascending: true });
    setEntries(data ?? []);
  }
  useEffect(() => { load(); }, [seasonId, ownerId]);

  function update(i: number, patch: Partial<RosterEntry>) {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function save(e: RosterEntry) {
    const { id, ...rest } = e;
    const { error } = await supabase.from("roster_entries").update(rest).eq("id", id);
    setMsg(error ? `Error: ${error.message}` : "Saved.");
  }

  async function addPlayer() {
    const { error } = await supabase.from("roster_entries").insert({
      season_id: seasonId,
      owner_id: ownerId,
      player_name: "New Player",
      sort_order: entries.length,
    });
    setMsg(error ? `Error: ${error.message}` : "Added.");
    load();
  }

  async function remove(id: string) {
    await supabase.from("roster_entries").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <SectionMsg msg={msg} />
      <div className="mb-4 flex flex-wrap gap-3">
        <select className={`${inputCls} max-w-xs`} value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
          {seasons.map((s) => (<option key={s.id} value={s.id}>{s.year}</option>))}
        </select>
        <select className={`${inputCls} max-w-xs`} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          {owners.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
        </select>
      </div>

      <button onClick={addPlayer} className="mb-4 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
        + Add Player
      </button>

      <div className="space-y-3">
        {entries.map((e, i) => (
          <div key={e.id} className="stat-card grid gap-2 rounded-xl p-4 sm:grid-cols-6">
            <input className={inputCls} value={e.player_name} onChange={(ev) => update(i, { player_name: ev.target.value })} placeholder="Player name" />
            <input className={inputCls} value={e.position ?? ""} onChange={(ev) => update(i, { position: ev.target.value })} placeholder="Position" />
            <input className={inputCls} value={e.nfl_team ?? ""} onChange={(ev) => update(i, { nfl_team: ev.target.value })} placeholder="Team" />
            <label className="flex items-center gap-2 text-xs text-mute">
              <input type="checkbox" checked={e.keeper_eligible} onChange={(ev) => update(i, { keeper_eligible: ev.target.checked })} />
              Keeper eligible
            </label>
            <input type="number" className={inputCls} value={e.keeper_round ?? ""} onChange={(ev) => update(i, { keeper_round: ev.target.value ? +ev.target.value : null })} placeholder="Keeper round" />
            <label className="flex items-center gap-2 text-xs text-mute">
              <input type="checkbox" checked={e.is_free_agent} onChange={(ev) => update(i, { is_free_agent: ev.target.checked })} />
              FA acquisition
            </label>
            <input className={`${inputCls} sm:col-span-5`} value={e.notes ?? ""} onChange={(ev) => update(i, { notes: ev.target.value })} placeholder="Notes (optional)" />
            <div className="flex gap-2">
              <button onClick={() => save(e)} className="flex-1 rounded-md bg-teal px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink">Save</button>
              <button onClick={() => remove(e.id)} className="rounded-md border border-line px-3 py-2 text-xs text-ember">✕</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-mute">No roster entered for this owner/season yet.</p>}
      </div>
    </div>
  );
}

/* ---------- Draft ---------- */

function DraftTab() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasonId, setSeasonId] = useState<string>("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("seasons").select("*").order("year", { ascending: false });
      const { data: o } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
      setSeasons(s ?? []);
      setOwners(o ?? []);
      if (s && s.length) setSeasonId(s[0].id);
    })();
  }, []);

  async function loadDraft(sid: string) {
    setDraftLoaded(false);
    const { data } = await supabase.from("drafts").select("*").eq("season_id", sid).maybeSingle();
    setDraft(data ?? null);
    setDraftLoaded(true);
  }

  useEffect(() => { if (seasonId) loadDraft(seasonId); }, [seasonId]);

  const season = seasons.find((s) => s.id === seasonId);

  return (
    <div>
      <select className={`${inputCls} mb-6 max-w-xs`} value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
        {seasons.map((s) => (<option key={s.id} value={s.id}>{s.year}</option>))}
      </select>

      {!draftLoaded && <p className="text-mute">Loading...</p>}

      {draftLoaded && !draft && season && (
        <DraftSetup owners={owners} season={season} onCreated={() => loadDraft(seasonId)} />
      )}

      {draftLoaded && draft && season && (
        <DraftControl draft={draft} owners={owners} season={season} onChange={() => loadDraft(seasonId)} />
      )}
    </div>
  );
}

function DraftSetup({ owners, season, onCreated }: { owners: Owner[]; season: Season; onCreated: () => void }) {
  const [order, setOrder] = useState<string[]>(owners.map((o) => o.id));
  const [rounds, setRounds] = useState(17);
  const [poolText, setPoolText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function move(i: number, dir: -1 | 1) {
    const copy = [...order];
    const j = i + dir;
    if (j < 0 || j >= copy.length) return;
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setOrder(copy);
  }

  async function create() {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("drafts").insert({
      season_id: season.id,
      rounds,
      draft_order: order,
      status: "setup",
      current_pick: 1,
    });
    if (error) {
      setMsg(`Error: ${error.message}`);
      setBusy(false);
      return;
    }

    const lines = poolText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length) {
      const rows = lines.map((line) => {
        const [name, position, nfl_team] = line.split(",").map((s) => s.trim());
        return { season_year: season.year, name, position: position || null, nfl_team: nfl_team || null };
      });
      const { error: poolErr } = await supabase.from("draft_players").insert(rows);
      if (poolErr) setMsg(`Draft created, but player pool failed: ${poolErr.message}`);
    }
    setBusy(false);
    onCreated();
  }

  return (
    <div className="space-y-6">
      <SectionMsg msg={msg} />
      <div>
        <h3 className="mb-2 font-display text-xl text-bone">1. Rounds</h3>
        <input type="number" className={`${inputCls} max-w-[120px]`} value={rounds} onChange={(e) => setRounds(+e.target.value)} />
      </div>

      <div>
        <h3 className="mb-2 font-display text-xl text-bone">2. Draft Order (Round 1)</h3>
        <p className="mb-2 text-xs text-mute">Snakes automatically each round after this. Use the arrows to reorder.</p>
        <div className="space-y-1">
          {order.map((id, i) => (
            <div key={id} className="stat-card flex items-center justify-between rounded-md px-3 py-2 text-sm">
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
        <h3 className="mb-2 font-display text-xl text-bone">3. Player Pool (optional)</h3>
        <p className="mb-2 text-xs text-mute">
          One player per line: <code>Name, Position, Team</code> (position and team are optional). Powers
          autocomplete during the draft — you can still type any name live even without this.
        </p>
        <textarea className={inputCls} rows={6} value={poolText} onChange={(e) => setPoolText(e.target.value)} placeholder={"Ja'Marr Chase, WR, CIN\nBijan Robinson, RB, ATL"} />
      </div>

      <button disabled={busy} onClick={create} className="rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">
        {busy ? "Creating..." : "Create Draft"}
      </button>
    </div>
  );
}

function DraftControl({
  draft,
  owners,
  season,
  onChange,
}: {
  draft: Draft;
  owners: Owner[];
  season: Season;
  onChange: () => void;
}) {
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [pool, setPool] = useState<DraftPlayer[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data: p } = await supabase.from("draft_picks").select("*").eq("draft_id", draft.id).order("pick_number", { ascending: true });
    const { data: dp } = await supabase.from("draft_players").select("*").eq("season_year", season.year);
    setPicks(p ?? []);
    setPool(dp ?? []);
  }
  useEffect(() => { load(); }, [draft.id]);

  const ownerMap = new Map(owners.map((o) => [o.id, o]));
  const total = totalPicks(draft.draft_order, draft.rounds);

  async function deleteDraft() {
    if (!confirm("Delete this draft entirely? All picks will be lost.")) return;
    await supabase.from("drafts").delete().eq("id", draft.id);
    onChange();
  }

  if (draft.status === "setup") {
    return (
      <div className="space-y-4">
        <SectionMsg msg={msg} />
        <p className="text-sm text-mute">
          Order set. Add keepers below if any, then start the draft when everyone&apos;s ready.
        </p>
        <KeeperEntry draft={draft} owners={owners} pool={pool} picks={picks} onChange={load} />
        <div className="flex gap-3">
          <button
            onClick={async () => {
              const taken = new Set(picks.map((p) => p.pick_number));
              let firstOpen = 1;
              while (taken.has(firstOpen) && firstOpen <= total) firstOpen++;
              const { error } = await supabase.from("drafts").update({ status: "in_progress", current_pick: firstOpen }).eq("id", draft.id);
              setMsg(error ? `Error: ${error.message}` : "");
              onChange();
            }}
            className="rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink"
          >
            Start Draft
          </button>
          <button onClick={deleteDraft} className="rounded-md border border-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-ember">
            Delete Draft
          </button>
        </div>
      </div>
    );
  }

  if (draft.status === "complete") {
    return (
      <div className="space-y-4">
        <p className="font-display text-2xl text-gold">Draft Complete</p>
        <PickHistory picks={picks} ownerMap={ownerMap} draft={draft} seasonYear={season.year} onUndo={load} setMsg={setMsg} />
        <button onClick={deleteDraft} className="rounded-md border border-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-ember">
          Delete Draft
        </button>
      </div>
    );
  }

  // in_progress
  const onClock = ownerForPick(draft.draft_order, draft.current_pick);

  return (
    <div className="space-y-6">
      <SectionMsg msg={msg} />
      <div className="stat-card rounded-xl p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-mute">
          Pick {draft.current_pick} of {total} &middot; Round {onClock.round}
        </div>
        <div className="font-display text-2xl text-teal">{ownerMap.get(onClock.ownerId)?.name} is on the clock</div>
      </div>

      <MakePickForm
        draft={draft}
        onClockOwnerId={onClock.ownerId}
        round={onClock.round}
        pickInRound={onClock.pickInRound}
        pool={pool}
        total={total}
        onChange={() => { load(); onChange(); }}
        setMsg={setMsg}
      />

      <PickHistory picks={picks} ownerMap={ownerMap} draft={draft} seasonYear={season.year} onUndo={() => { load(); onChange(); }} setMsg={setMsg} />
    </div>
  );
}

function KeeperEntry({
  draft,
  owners,
  pool,
  picks,
  onChange,
}: {
  draft: Draft;
  owners: Owner[];
  pool: DraftPlayer[];
  picks: DraftPick[];
  onChange: () => void;
}) {
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
      draft_id: draft.id,
      pick_number: pickNumber,
      round,
      pick_in_round: pickInRound,
      owner_id: ownerId,
      player_name: playerName.trim(),
      position: matched?.position ?? null,
      nfl_team: matched?.nfl_team ?? null,
      is_keeper: true,
    });
    if (error) return setMsg(`Error: ${error.message}`);
    if (matched) await supabase.from("draft_players").update({ drafted: true }).eq("id", matched.id);
    setPlayerName("");
    setMsg("");
    onChange();
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
              <button onClick={() => removeKeeper(k.id)} className="text-ember text-xs">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MakePickForm({
  draft,
  onClockOwnerId,
  round,
  pickInRound,
  pool,
  total,
  onChange,
  setMsg,
}: {
  draft: Draft;
  onClockOwnerId: string;
  round: number;
  pickInRound: number;
  pool: DraftPlayer[];
  total: number;
  onChange: () => void;
  setMsg: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [posFilter, setPosFilter] = useState("ALL");

  const available = pool.filter((p) => !p.drafted);
  const positions = ["ALL", ...Array.from(new Set(available.map((p) => p.position).filter(Boolean) as string[])).sort()];
  const bestAvailable = available
    .filter((p) => posFilter === "ALL" || p.position === posFilter)
    .filter((p) => !name || p.name.toLowerCase().includes(name.toLowerCase()))
    .slice(0, 30);

  function pick(p: DraftPlayer) {
    setName(p.name);
    setPosition(p.position ?? "");
    setTeam(p.nfl_team ?? "");
  }

  async function submit() {
    if (!name.trim()) return setMsg("Enter a player name.");
    setBusy(true);
    const matched = pool.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    const { error } = await supabase.from("draft_picks").insert({
      draft_id: draft.id,
      pick_number: draft.current_pick,
      round,
      pick_in_round: pickInRound,
      owner_id: onClockOwnerId,
      player_name: name.trim(),
      position: position || null,
      nfl_team: team || null,
      is_keeper: false,
    });
    if (error) { setMsg(`Error: ${error.message}`); setBusy(false); return; }
    if (matched) await supabase.from("draft_players").update({ drafted: true }).eq("id", matched.id);

    const nextPick = draft.current_pick + 1;
    const newStatus = nextPick > total ? "complete" : "in_progress";
    await supabase.from("drafts").update({ current_pick: nextPick, status: newStatus }).eq("id", draft.id);

    setName(""); setPosition(""); setTeam(""); setMsg("");
    setBusy(false);
    onChange();
  }

  return (
    <div className="stat-card rounded-xl p-4">
      <div className="grid gap-2 sm:grid-cols-4">
        <input className={`${inputCls} sm:col-span-2`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name / search" />
        <input className={inputCls} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Position" />
        <input className={inputCls} value={team} onChange={(e) => setTeam(e.target.value)} placeholder="NFL team" />
      </div>
      <button disabled={busy} onClick={submit} className="mt-3 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-50">
        {busy ? "Saving..." : "Make Pick"}
      </button>

      {pool.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-teal">Best Available</h4>
            <span className="text-xs text-mute">{available.length} left in pool</span>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
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
          <div className="max-h-64 overflow-y-auto">
            <div className="grid gap-1 sm:grid-cols-2">
              {bestAvailable.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  className="flex items-center justify-between rounded border border-line px-2 py-1.5 text-left text-xs text-mute hover:border-teal hover:text-teal"
                >
                  <span className="text-bone">{p.name}</span>
                  <span>{[p.position, p.nfl_team].filter(Boolean).join(" · ")}</span>
                </button>
              ))}
              {bestAvailable.length === 0 && <p className="text-xs text-mute">No matching players left.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PickHistory({
  picks,
  ownerMap,
  draft,
  seasonYear,
  onUndo,
  setMsg,
}: {
  picks: DraftPick[];
  ownerMap: Map<string, Owner>;
  draft: Draft;
  seasonYear: string;
  onUndo: () => void;
  setMsg: (m: string) => void;
}) {
  async function undoLast() {
    const nonKeeper = picks.filter((p) => !p.is_keeper);
    const last = nonKeeper[nonKeeper.length - 1];
    if (!last) return setMsg("No picks to undo.");
    await supabase.from("draft_picks").delete().eq("id", last.id);
    await supabase
      .from("draft_players")
      .update({ drafted: false })
      .eq("season_year", seasonYear)
      .ilike("name", last.player_name);
    await supabase.from("drafts").update({ current_pick: last.pick_number, status: "in_progress" }).eq("id", draft.id);
    setMsg("");
    onUndo();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-display text-xl text-bone">Pick History</h4>
        <button onClick={undoLast} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ember hover:border-ember">
          Undo Last Pick
        </button>
      </div>
      <div className="space-y-1">
        {[...picks].reverse().map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-md border-b border-line/50 px-2 py-1.5 text-sm">
            <span className="text-mute">#{p.pick_number} (Rd {p.round})</span>
            <span className="text-bone">{ownerMap.get(p.owner_id)?.name}</span>
            <span className="text-teal">{p.player_name}{p.is_keeper ? " · Keeper" : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Records ---------- */

function RecordsTab() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data: o } = await supabase.from("owners").select("*");
    const { data: r } = await supabase.from("all_time_records").select("*").order("sort_order", { ascending: true });
    setOwners(o ?? []);
    setRecords(r ?? []);
  }
  useEffect(() => { load(); }, []);

  function update(i: number, patch: Partial<RecordEntry>) {
    setRecords((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function save(r: RecordEntry) {
    const { id, ...rest } = r;
    const { error } = await supabase.from("all_time_records").update(rest).eq("id", id);
    setMsg(error ? `Error: ${error.message}` : "Saved.");
  }

  async function addRecord() {
    const title = prompt("Record title? e.g. Biggest Blowout");
    if (!title) return;
    const { error } = await supabase.from("all_time_records").insert({ title, sort_order: records.length });
    setMsg(error ? `Error: ${error.message}` : "Added.");
    load();
  }

  return (
    <div>
      <SectionMsg msg={msg} />
      <button onClick={addRecord} className="mb-4 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
        + Add Record
      </button>
      <div className="grid gap-3">
        {records.map((r, i) => (
          <div key={r.id} className="stat-card grid gap-2 rounded-xl p-4 sm:grid-cols-2">
            <input className={inputCls} value={r.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Title" />
            <select className={inputCls} value={r.holder_id ?? ""} onChange={(e) => update(i, { holder_id: e.target.value || null })}>
              <option value="">No owner</option>
              {owners.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
            </select>
            <input className={inputCls} value={r.value ?? ""} onChange={(e) => update(i, { value: e.target.value })} placeholder="Value, e.g. 187.4" />
            <input className={inputCls} value={r.season_year ?? ""} onChange={(e) => update(i, { season_year: e.target.value })} placeholder="Season year" />
            <textarea className={`${inputCls} sm:col-span-2`} value={r.description ?? ""} onChange={(e) => update(i, { description: e.target.value })} placeholder="Description" />
            <button onClick={() => save(r)} className="sm:col-span-2 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
              Save
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Photos ---------- */

function PhotosTab() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ season_year: "", url: "", caption: "" });

  async function load() {
    const { data } = await supabase.from("photos").select("*").order("season_year", { ascending: false });
    setPhotos(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.season_year || !form.url) {
      setMsg("Season year and photo URL are required.");
      return;
    }
    const { error } = await supabase.from("photos").insert(form);
    setMsg(error ? `Error: ${error.message}` : "Added.");
    setForm({ season_year: "", url: "", caption: "" });
    load();
  }

  async function remove(id: string) {
    await supabase.from("photos").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <SectionMsg msg={msg} />
      <div className="stat-card mb-6 grid gap-3 rounded-xl p-4 sm:grid-cols-3">
        <input className={inputCls} placeholder="Season year, e.g. 2024-25" value={form.season_year} onChange={(e) => setForm({ ...form, season_year: e.target.value })} />
        <input className={inputCls} placeholder="Image URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <input className={inputCls} placeholder="Caption (optional)" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
        <button onClick={add} className="sm:col-span-3 rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
          + Add Photo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="stat-card rounded-xl p-2 text-xs">
            <img src={p.url} alt={p.caption ?? ""} className="mb-2 h-24 w-full rounded-md object-cover" />
            <div className="text-teal">{p.season_year}</div>
            <div className="truncate text-mute">{p.caption}</div>
            <button onClick={() => remove(p.id)} className="mt-1 text-ember">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Settings ---------- */

function SettingsTab() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [msg, setMsg] = useState("");

  async function changePin() {
    if (pin.length < 4) return setMsg("PIN must be at least 4 characters.");
    if (pin !== confirmPin) return setMsg("PINs don't match.");
    const hash = await sha256(pin);
    const { error } = await supabase.from("app_settings").update({ value: hash }).eq("key", "admin_pin_hash");
    setMsg(error ? `Error: ${error.message}` : "PIN updated. Use it next time you log in.");
    setPin("");
    setConfirmPin("");
  }

  return (
    <div className="max-w-sm">
      <SectionMsg msg={msg} />
      <h3 className="mb-3 font-display text-xl text-bone">Change Admin PIN</h3>
      <div className="space-y-3">
        <input type="password" className={inputCls} placeholder="New PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
        <input type="password" className={inputCls} placeholder="Confirm new PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
        <button onClick={changePin} className="rounded-md bg-teal px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink">
          Update PIN
        </button>
      </div>
    </div>
  );
}
