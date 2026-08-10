import { supabase, Owner } from "@/lib/supabase";
import CareerStatsTable, { CareerRow } from "@/components/CareerStatsTable";

export const revalidate = 0;

export default async function RecordsPage() {
  const { data: owners } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });
  const { data: seasons } = await supabase.from("seasons").select("*");
  const { data: results } = await supabase.from("season_results").select("*");
  const { data: manualRecords } = await supabase
    .from("all_time_records")
    .select("*")
    .order("sort_order", { ascending: true });

  const ownerMap = new Map<string, Owner>((owners ?? []).map((o) => [o.id, o]));

  const tally = (key: "champion_id" | "runner_up_id" | "reg_season_winner_id" | "last_place_id") => {
    const counts = new Map<string, number>();
    for (const s of seasons ?? []) {
      const id = s[key];
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ owner: ownerMap.get(id), count }));
  };

  const champs = tally("champion_id");
  const runnerUps = tally("runner_up_id");
  const regSeason = tally("reg_season_winner_id");
  const toiletBowls = tally("last_place_id");

  const champCount = new Map(champs.map((c) => [c.owner?.id, c.count]));
  const runnerUpCount = new Map(runnerUps.map((c) => [c.owner?.id, c.count]));
  const regSeasonCount = new Map(regSeason.map((c) => [c.owner?.id, c.count]));
  const toiletBowlCount = new Map(toiletBowls.map((c) => [c.owner?.id, c.count]));

  const careerRows: CareerRow[] = (owners ?? []).map((o) => {
    const ownerResults = (results ?? []).filter((r) => r.owner_id === o.id);
    const wins = ownerResults.reduce((sum, r) => sum + (r.wins ?? 0), 0);
    const losses = ownerResults.reduce((sum, r) => sum + (r.losses ?? 0), 0);
    const ties = ownerResults.reduce((sum, r) => sum + (r.ties ?? 0), 0);
    const pointsFor = ownerResults.reduce((sum, r) => sum + Number(r.points_for ?? 0), 0);
    const pointsAgainst = ownerResults.reduce((sum, r) => sum + Number(r.points_against ?? 0), 0);
    const playoffAppearances = ownerResults.filter((r) => r.made_playoffs).length;
    const totalGames = wins + losses + ties;

    return {
      ownerId: o.id,
      name: o.name,
      seasons: ownerResults.length,
      wins,
      losses,
      ties,
      winPct: totalGames > 0 ? wins / totalGames : 0,
      pointsFor,
      pointsAgainst,
      championships: champCount.get(o.id) ?? 0,
      runnerUps: runnerUpCount.get(o.id) ?? 0,
      regSeasonTitles: regSeasonCount.get(o.id) ?? 0,
      toiletBowls: toiletBowlCount.get(o.id) ?? 0,
      playoffAppearances,
    };
  });

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">All-Time Records</h1>
      <p className="mt-2 text-mute">The Greaze record book, built from every season on file.</p>
      <div className="divider-tentacle my-6" />

      <div className="grid gap-6 sm:grid-cols-2">
        <Leaderboard title="Most Championships" tone="gold" rows={champs} />
        <Leaderboard title="Most Runner-Up Finishes" tone="teal" rows={runnerUps} />
        <Leaderboard title="Most Regular Season Titles" tone="teal" rows={regSeason} />
        <Leaderboard title="Most Toilet Bowl Finishes" tone="ember" rows={toiletBowls} />
      </div>

      <h2 className="mt-14 font-display text-2xl tracking-wide text-bone">Career Stats — All Teams</h2>
      <p className="mt-1 text-sm text-mute">
        Cumulative totals across every season entered. Click any column to sort.
      </p>
      <div className="divider-tentacle my-4" />
      <CareerStatsTable rows={careerRows} />

      <h2 className="mt-14 font-display text-2xl tracking-wide text-bone">Record Book</h2>
      <p className="mt-1 text-sm text-mute">
        Single-season and single-game records, curated by hand from league history.
      </p>
      <div className="divider-tentacle my-4" />
      <div className="grid gap-4 sm:grid-cols-2">
        {(manualRecords ?? []).map((r) => (
          <div key={r.id} className="stat-card rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-teal">{r.title}</div>
            <div className="mt-1 font-display text-xl text-bone">
              {r.holder_id ? ownerMap.get(r.holder_id)?.name : r.value ?? "Not yet set"}
              {r.value && r.holder_id ? ` — ${r.value}` : ""}
            </div>
            {r.season_year && <div className="text-xs text-mute">{r.season_year}</div>}
            {r.description && <p className="mt-2 text-sm text-mute">{r.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Leaderboard({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: "gold" | "teal" | "ember";
  rows: { owner?: Owner; count: number }[];
}) {
  const toneClass = { gold: "text-gold", teal: "text-teal", ember: "text-ember" }[tone];
  return (
    <div className="stat-card rounded-xl p-6">
      <h3 className={`font-display text-xl tracking-wide ${toneClass}`}>{title}</h3>
      <ol className="mt-4 space-y-2">
        {rows.slice(0, 6).map((r, i) => (
          <li key={r.owner?.id ?? i} className="flex items-center justify-between border-b border-line/50 pb-2 text-sm">
            <span className="text-bone">
              <span className="mr-2 text-mute">{i + 1}.</span>
              {r.owner?.name ?? "Unknown"}
            </span>
            <span className="font-display text-lg text-bone">{r.count}</span>
          </li>
        ))}
        {rows.length === 0 && <p className="text-sm text-mute">No data yet.</p>}
      </ol>
    </div>
  );
}
