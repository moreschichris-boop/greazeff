import Link from "next/link";
import { supabase, Owner } from "@/lib/supabase";

export const revalidate = 0;

export default async function HistoryPage() {
  const { data: owners } = await supabase.from("owners").select("*");
  const { data: seasons } = await supabase.from("seasons").select("*").order("year", { ascending: false });

  const ownerMap = new Map<string, Owner>((owners ?? []).map((o) => [o.id, o]));

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">Season History</h1>
      <p className="mt-2 text-mute">Every year of the Greaze, champion to cellar-dweller.</p>
      <div className="divider-tentacle my-6" />

      <div className="space-y-3">
        {(seasons ?? []).map((s) => (
          <Link
            key={s.id}
            href={`/history/${s.year}`}
            className="stat-card grid grid-cols-2 gap-3 rounded-xl p-5 transition hover:border-teal/60 sm:grid-cols-5 sm:items-center"
          >
            <div className="font-display text-2xl text-bone">{s.year}</div>
            <Field label="Champion" value={ownerMap.get(s.champion_id ?? "")?.name} tone="gold" />
            <Field label="Runner-Up" value={ownerMap.get(s.runner_up_id ?? "")?.name} />
            <Field label="Reg. Season" value={ownerMap.get(s.reg_season_winner_id ?? "")?.name} />
            <Field label="Toilet Bowl" value={ownerMap.get(s.last_place_id ?? "")?.name} tone="ember" />
          </Link>
        ))}
        {(!seasons || seasons.length === 0) && (
          <p className="text-mute">No seasons yet — add them from the admin panel.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, tone }: { label: string; value?: string; tone?: "gold" | "ember" }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-mute">{label}</div>
      <div className={`text-sm font-semibold ${tone === "gold" ? "text-gold" : tone === "ember" ? "text-ember" : "text-bone"}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}
