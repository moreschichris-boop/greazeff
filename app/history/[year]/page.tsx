import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, Owner } from "@/lib/supabase";

export const revalidate = 0;

export default async function SeasonPage({ params }: { params: { year: string } }) {
  const { data: season } = await supabase.from("seasons").select("*").eq("year", params.year).single();
  if (!season) return notFound();

  const { data: owners } = await supabase.from("owners").select("*");
  const ownerMap = new Map<string, Owner>((owners ?? []).map((o) => [o.id, o]));

  const { data: results } = await supabase
    .from("season_results")
    .select("*")
    .eq("season_id", season.id)
    .order("final_rank", { ascending: true });

  return (
    <div>
      <Link href="/history" className="text-sm font-semibold text-teal hover:underline">
        &larr; All seasons
      </Link>
      <h1 className="mt-3 font-display text-5xl tracking-wide text-bone">{season.year}</h1>
      <div className="divider-tentacle my-6" />

      <div className="grid gap-4 sm:grid-cols-4">
        <Badge label="Champion" name={ownerMap.get(season.champion_id ?? "")?.name} tone="gold" />
        <Badge label="Runner-Up" name={ownerMap.get(season.runner_up_id ?? "")?.name} />
        <Badge label="Reg. Season Winner" name={ownerMap.get(season.reg_season_winner_id ?? "")?.name} />
        <Badge label="Toilet Bowl" name={ownerMap.get(season.last_place_id ?? "")?.name} tone="ember" />
      </div>

      {season.notes && (
        <p className="mt-6 rounded-lg border border-line bg-panel/60 p-4 text-sm text-mute">{season.notes}</p>
      )}

      <h2 className="mt-12 font-display text-2xl tracking-wide text-bone">Final Standings</h2>
      <div className="divider-tentacle my-4" />
      {results && results.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-mute">
                <th className="py-2">Rank</th>
                <th>Owner</th>
                <th>Record</th>
                <th>Points For</th>
                <th>Points Against</th>
                <th>Playoffs</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className="py-2 font-display text-lg text-bone">{r.final_rank ?? "—"}</td>
                  <td className="text-bone">{ownerMap.get(r.owner_id)?.name}</td>
                  <td className="text-mute">
                    {r.wins}-{r.losses}{r.ties ? `-${r.ties}` : ""}
                  </td>
                  <td className="text-mute">{r.points_for ?? "—"}</td>
                  <td className="text-mute">{r.points_against ?? "—"}</td>
                  <td className="text-mute">{r.made_playoffs ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-mute">
          Full standings for this season haven&apos;t been entered yet — add them from the admin panel.
        </p>
      )}
    </div>
  );
}

function Badge({ label, name, tone }: { label: string; name?: string; tone?: "gold" | "ember" }) {
  return (
    <div className="stat-card rounded-xl p-5 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-mute">{label}</div>
      <div className={`mt-1 font-display text-xl ${tone === "gold" ? "text-gold" : tone === "ember" ? "text-ember" : "text-bone"}`}>
        {name ?? "—"}
      </div>
    </div>
  );
}
