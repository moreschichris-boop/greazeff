"use client";

import { useEffect, useState } from "react";
import { supabase, Owner, Season, FinanceEntry, SeasonPayout, SeasonCost } from "@/lib/supabase";

export default function FinancesPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [payouts, setPayouts] = useState<SeasonPayout[]>([]);
  const [costs, setCosts] = useState<SeasonCost[]>([]);
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
    (async () => {
      const [{ data: e }, { data: p }, { data: c }] = await Promise.all([
        supabase.from("finance_entries").select("*").eq("season_id", seasonId),
        supabase.from("season_payouts").select("*").eq("season_id", seasonId).order("sort_order", { ascending: true }),
        supabase.from("season_costs").select("*").eq("season_id", seasonId).order("sort_order", { ascending: true }),
      ]);
      setEntries(e ?? []);
      setPayouts(p ?? []);
      setCosts(c ?? []);
    })();
  }, [seasonId]);

  const ownerMap = new Map(owners.map((o) => [o.id, o]));
  const totalCosts = costs.reduce((sum, c) => sum + Number(c.amount), 0);

  if (loading) return <p className="text-mute">Loading...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-wide text-bone">League Finances</h1>
        <select
          className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-bone"
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
        >
          {seasons.map((s) => (<option key={s.id} value={s.id}>{s.year}</option>))}
        </select>
      </div>
      <p className="mt-2 text-mute">Dues, FAAB fees, weekly bonuses/penalties, and who&apos;s squared up.</p>
      <div className="divider-tentacle my-6" />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-mute">
              <th className="py-2 pr-3">Owner</th>
              <th className="px-2">Entry Fee</th>
              <th className="px-2">FAAB Spend</th>
              <th className="px-2">Loser Weeks</th>
              <th className="px-2">Loser Penalty</th>
              <th className="px-2">Total Owed</th>
              <th className="px-2">Paid</th>
              <th className="px-2">Balance</th>
              <th className="px-2">Winner Weeks</th>
              <th className="px-2">Winner Bonus</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const total = Number(e.entry_fee) + Number(e.faab_spend) + Number(e.loser_penalty);
              const balance = total - Number(e.amount_paid);
              return (
                <tr key={e.id} className="border-b border-line/50">
                  <td className="py-2 pr-3 font-semibold text-bone">{ownerMap.get(e.owner_id)?.name}</td>
                  <td className="px-2 text-mute">${Number(e.entry_fee).toFixed(0)}</td>
                  <td className="px-2 text-mute">${Number(e.faab_spend).toFixed(0)}</td>
                  <td className="px-2 text-mute">{e.loser_weeks}</td>
                  <td className="px-2 text-mute">${Number(e.loser_penalty).toFixed(0)}</td>
                  <td className="px-2 text-bone">${total.toFixed(0)}</td>
                  <td className="px-2 text-mute">${Number(e.amount_paid).toFixed(0)}</td>
                  <td className={`px-2 font-semibold ${balance > 0 ? "text-ember" : "text-teal"}`}>
                    {balance > 0 ? `$${balance.toFixed(0)} owed` : "Paid up"}
                  </td>
                  <td className="px-2 text-mute">{e.winner_weeks}</td>
                  <td className="px-2 text-gold">${Number(e.winner_bonus).toFixed(0)}</td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr><td colSpan={10} className="py-4 text-mute">No finance data entered for this season yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(payouts.length > 0 || costs.length > 0) && (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {payouts.length > 0 && (
            <div className="stat-card rounded-xl p-5">
              <h2 className="font-display text-xl text-bone">Season Payouts</h2>
              <div className="divider-tentacle my-3" />
              <ul className="space-y-2">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-mute">{p.title}{p.owner_id ? ` — ${ownerMap.get(p.owner_id)?.name}` : ""}</span>
                    <span className="font-display text-gold">${Number(p.amount).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {costs.length > 0 && (
            <div className="stat-card rounded-xl p-5">
              <h2 className="font-display text-xl text-bone">Costs</h2>
              <div className="divider-tentacle my-3" />
              <ul className="space-y-2">
                {costs.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-mute">
                      {c.description}{c.paid_by_owner_id ? ` (paid by ${ownerMap.get(c.paid_by_owner_id)?.name})` : ""}
                    </span>
                    <span className="font-display text-ember">${Number(c.amount).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm font-semibold">
                <span className="text-bone">Total Costs</span>
                <span className="text-ember">${totalCosts.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
