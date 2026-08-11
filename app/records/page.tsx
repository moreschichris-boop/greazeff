import { supabase, Owner, Season, SeasonResult } from "@/lib/supabase";
import CareerStatsTable, { CareerRow } from "@/components/CareerStatsTable";
import RecordsTabs from "@/components/RecordsTabs";
import SeasonsBrowser from "@/components/SeasonsBrowser";

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
  const seasonMap = new Map<string, Season>((seasons ?? []).map((s) => [s.id, s]));
  const sortedSeasons = [...(seasons ?? [])].sort((a, b) => a.year.localeCompare(b.year));

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

  // --- Auto-computed single-season / career records, built entirely from
  // season_results + seasons — nothing here is hand-entered. ---

  // Best single-season record: most wins, tiebroken by win% then points for.
  let bestSeason: SeasonResult | null = null;
  for (const r of results ?? []) {
    if (!bestSeason) { bestSeason = r; continue; }
    const games = r.wins + r.losses + r.ties;
    const bestGames = bestSeason.wins + bestSeason.losses + bestSeason.ties;
    const pct = games > 0 ? r.wins / games : 0;
    const bestPct = bestGames > 0 ? bestSeason.wins / bestGames : 0;
    if (
      r.wins > bestSeason.wins ||
      (r.wins === bestSeason.wins && pct > bestPct) ||
      (r.wins === bestSeason.wins && pct === bestPct && Number(r.points_for) > Number(bestSeason.points_for))
    ) {
      bestSeason = r;
    }
  }

  // Most points scored in a single season.
  let topScoringSeason: SeasonResult | null = null;
  for (const r of results ?? []) {
    if (!topScoringSeason || Number(r.points_for) > Number(topScoringSeason.points_for)) topScoringSeason = r;
  }

  // Longest championship drought: longest run of consecutive participated
  // seasons without winning it all, for any single owner.
  let droughtOwner: Owner | undefined;
  let droughtLength = 0;
  let droughtStartYear = "";
  let droughtEndYear = "";
  let droughtOngoing = false;

  for (const o of owners ?? []) {
    let streak = 0;
    let streakStart = "";
    let best = 0;
    let bestStart = "";
    let bestEnd = "";
    let lastYear = "";
    for (const s of sortedSeasons) {
      const played = (results ?? []).some((r) => r.season_id === s.id && r.owner_id === o.id);
      if (!played) continue;
      const won = s.champion_id === o.id;
      if (won) {
        streak = 0;
        streakStart = "";
      } else {
        if (streak === 0) streakStart = s.year;
        streak += 1;
        lastYear = s.year;
        if (streak > best) {
          best = streak;
          bestStart = streakStart;
          bestEnd = s.year;
        }
      }
    }
    if (best > droughtLength) {
      droughtLength = best;
      droughtOwner = o;
      droughtStartYear = bestStart;
      droughtEndYear = bestEnd;
      droughtOngoing = bestEnd === lastYear && bestEnd === sortedSeasons[sortedSeasons.length - 1]?.year;
    }
  }

  // Worst single-season record: fewest wins, tiebroken by worst win% then fewest points for.
  let worstSeason: SeasonResult | null = null;
  for (const r of results ?? []) {
    if (!worstSeason) { worstSeason = r; continue; }
    const games = r.wins + r.losses + r.ties;
    const worstGames = worstSeason.wins + worstSeason.losses + worstSeason.ties;
    const pct = games > 0 ? r.wins / games : 0;
    const worstPct = worstGames > 0 ? worstSeason.wins / worstGames : 0;
    if (
      r.wins < worstSeason.wins ||
      (r.wins === worstSeason.wins && pct < worstPct) ||
      (r.wins === worstSeason.wins && pct === worstPct && Number(r.points_for) < Number(worstSeason.points_for))
    ) {
      worstSeason = r;
    }
  }

  // Fewest points scored in a single season.
  let leastScoringSeason: SeasonResult | null = null;
  for (const r of results ?? []) {
    if (!leastScoringSeason || Number(r.points_for) < Number(leastScoringSeason.points_for)) leastScoringSeason = r;
  }

  const computedRecords = [
    {
      title: "Best Single-Season Record",
      value: bestSeason
        ? `${ownerMap.get(bestSeason.owner_id)?.name} — ${bestSeason.wins}-${bestSeason.losses}${bestSeason.ties ? `-${bestSeason.ties}` : ""}`
        : null,
      subtitle: bestSeason ? seasonMap.get(bestSeason.season_id)?.year : undefined,
    },
    {
      title: "Worst Single-Season Record",
      value: worstSeason
        ? `${ownerMap.get(worstSeason.owner_id)?.name} — ${worstSeason.wins}-${worstSeason.losses}${worstSeason.ties ? `-${worstSeason.ties}` : ""}`
        : null,
      subtitle: worstSeason ? seasonMap.get(worstSeason.season_id)?.year : undefined,
    },
    {
      title: "Most Points in a Season",
      value: topScoringSeason
        ? `${ownerMap.get(topScoringSeason.owner_id)?.name} — ${Number(topScoringSeason.points_for).toFixed(1)}`
        : null,
      subtitle: topScoringSeason ? seasonMap.get(topScoringSeason.season_id)?.year : undefined,
    },
    {
      title: "Fewest Points in a Season",
      value: leastScoringSeason
        ? `${ownerMap.get(leastScoringSeason.owner_id)?.name} — ${Number(leastScoringSeason.points_for).toFixed(1)}`
        : null,
      subtitle: leastScoringSeason ? seasonMap.get(leastScoringSeason.season_id)?.year : undefined,
    },
    {
      title: "Longest Championship Drought",
      value: droughtOwner ? `${droughtOwner.name} — ${droughtLength} season${droughtLength === 1 ? "" : "s"}` : null,
      subtitle: droughtOwner ? `${droughtStartYear} – ${droughtEndYear}${droughtOngoing ? " (ongoing)" : ""}` : undefined,
    },
  ];

  // Anything hand-added in Admin > Records beyond the auto-computed cards
  // above still shows below (e.g. Biggest Blowout, once weekly scores are
  // ever entered — that one needs game-level data this site doesn't track).
  // The original seed placeholders are filtered out entirely since they're
  // either redundant with the leaderboards above or now computed here.
  const seedTitles = [
    "Most Championships",
    "Most Runner-Up Finishes",
    "Best Single-Season Record",
    "Biggest Blowout",
    "Most Points in a Season",
    "Longest Championship Drought",
  ];
  const extraManualRecords = (manualRecords ?? []).filter((r) => !seedTitles.includes(r.title));

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">All-Time Records</h1>
      <p className="mt-2 text-mute">The Greaze record book, built from every season on file.</p>
      <div className="divider-tentacle my-6" />

      <RecordsTabs
        seasonsTab={<SeasonsBrowser seasons={seasons ?? []} owners={owners ?? []} results={results ?? []} />}
        overview={
          <>
            <h2 className="font-display text-2xl tracking-wide text-bone">Career Stats — All Teams</h2>
            <p className="mt-1 text-sm text-mute">
              Cumulative totals across every season entered. Click any column to sort.
            </p>
            <div className="divider-tentacle my-4" />
            <CareerStatsTable rows={careerRows} />

            <h2 className="mt-14 font-display text-2xl tracking-wide text-bone">Leaderboards</h2>
            <div className="divider-tentacle my-4" />
            <div className="grid gap-6 sm:grid-cols-2">
              <Leaderboard title="Most Championships" tone="gold" rows={champs} />
              <Leaderboard title="Most Runner-Up Finishes" tone="teal" rows={runnerUps} />
              <Leaderboard title="Most Regular Season Titles" tone="teal" rows={regSeason} />
              <Leaderboard title="Most Toilet Bowl Finishes" tone="ember" rows={toiletBowls} />
            </div>

            <h2 className="mt-14 font-display text-2xl tracking-wide text-bone">Record Book</h2>
            <p className="mt-1 text-sm text-mute">
              Computed automatically from every season's standings on file.
            </p>
            <div className="divider-tentacle my-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              {computedRecords.map((r) => (
                <div key={r.title} className="stat-card rounded-xl p-5">
                  <div className="text-xs font-semibold uppercase tracking-widest text-teal">{r.title}</div>
                  <div className="mt-1 font-display text-xl text-bone">{r.value ?? "Not enough data yet"}</div>
                  {r.subtitle && <div className="text-xs text-mute">{r.subtitle}</div>}
                </div>
              ))}
              <div className="stat-card rounded-xl p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-teal">Biggest Blowout</div>
                <div className="mt-1 font-display text-xl text-bone">Not available</div>
                <p className="mt-2 text-sm text-mute">
                  Needs individual weekly matchup scores, which aren&apos;t tracked here — only season-ending
                  standings are. Add game data and a table for it later if you want this one.
                </p>
              </div>
              {extraManualRecords.map((r) => (
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
          </>
        }
      />
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
