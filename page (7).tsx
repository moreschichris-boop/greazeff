import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SquidMark from "@/components/SquidMark";

export const revalidate = 0;

export default async function OwnerProfilePage({ params }: { params: { slug: string } }) {
  const { data: owner } = await supabase.from("owners").select("*").eq("slug", params.slug).single();
  if (!owner) return notFound();

  const { data: seasons } = await supabase.from("seasons").select("*");
  const { data: results } = await supabase.from("season_results").select("*").eq("owner_id", owner.id);

  const seasonMap = new Map((seasons ?? []).map((s) => [s.id, s]));
  const champs = (seasons ?? []).filter((s) => s.champion_id === owner.id).sort((a, b) => a.year.localeCompare(b.year));
  const runnerUps = (seasons ?? []).filter((s) => s.runner_up_id === owner.id).sort((a, b) => a.year.localeCompare(b.year));
  const regSeasons = (seasons ?? []).filter((s) => s.reg_season_winner_id === owner.id).sort((a, b) => a.year.localeCompare(b.year));
  const toiletBowls = (seasons ?? []).filter((s) => s.last_place_id === owner.id).sort((a, b) => a.year.localeCompare(b.year));

  const cardRows = (results ?? [])
    .map((r) => ({ ...r, season: seasonMap.get(r.season_id) }))
    .filter((r) => r.season)
    .sort((a, b) => a.season!.year.localeCompare(b.season!.year));

  const careerWins = cardRows.reduce((sum, r) => sum + r.wins, 0);
  const careerLosses = cardRows.reduce((sum, r) => sum + r.losses, 0);
  const careerTies = cardRows.reduce((sum, r) => sum + r.ties, 0);
  const careerPF = cardRows.reduce((sum, r) => sum + Number(r.points_for ?? 0), 0);
  const careerPA = cardRows.reduce((sum, r) => sum + Number(r.points_against ?? 0), 0);
  const playoffCount = cardRows.filter((r) => r.made_playoffs).length;

  const firstYear = cardRows[0]?.season?.year;

  function accoladeTag(id: string | undefined, y: string) {
    if (id === owner.id) return y;
    return null;
  }

  const writeup = buildWriteup({
    name: owner.name,
    seasonsPlayed: cardRows.length,
    firstYear,
    wins: careerWins,
    losses: careerLosses,
    ties: careerTies,
    playoffCount,
    champYears: champs.map((s) => s.year),
    runnerUpYears: runnerUps.map((s) => s.year),
    regSeasonYears: regSeasons.map((s) => s.year),
    toiletBowlYears: toiletBowls.map((s) => s.year),
  });

  const questionnaire = owner.questionnaire ?? [];

  return (
    <div>
      <Link href="/owners" className="text-sm font-semibold text-teal hover:underline">
        &larr; All owners
      </Link>

      <div className="mt-4 flex flex-col items-center gap-5 text-center">
        {owner.photo_url ? (
          <div className="relative aspect-square w-full max-w-xl overflow-hidden rounded-xl bg-panel ring-4 ring-teal/60">
            <Image
              src={owner.photo_url}
              alt={owner.name}
              fill
              className="object-contain"
              sizes="(min-width: 1280px) 576px, 90vw"
              priority
            />
          </div>
        ) : (
          <div className="ring-4 ring-teal/60 rounded-full">
            <SquidMark size={112} />
          </div>
        )}
        <div>
          <h1 className="font-display text-4xl tracking-wide text-bone">{owner.name}</h1>
          {owner.team_name && <p className="text-teal">{owner.team_name}</p>}
        </div>
      </div>

      {owner.bio && <p className="mx-auto mt-6 max-w-2xl text-center text-mute">{owner.bio}</p>}

      {/* --- Card back: season-by-season stat line, trading-card style --- */}
      <div className="mt-10 overflow-hidden rounded-xl border-2 border-teal/40 bg-depth">
        <div className="border-b border-teal/30 bg-panel/80 px-5 py-3">
          <h2 className="font-display text-xl tracking-widest text-teal">CAREER STATS</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-mute">
                <th className="py-2 pl-5">Year</th>
                <th className="px-2">Record</th>
                <th className="px-2">PF</th>
                <th className="px-2">PA</th>
                <th className="px-2">Rank</th>
                <th className="px-2 pr-5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {cardRows.map((r) => {
                const s = r.season!;
                const notes = [
                  accoladeTag(s.champion_id, "Champion"),
                  accoladeTag(s.runner_up_id, "Runner-Up"),
                  accoladeTag(s.reg_season_winner_id, "Reg. Season"),
                  accoladeTag(s.last_place_id, "Toilet Bowl"),
                ].filter(Boolean);
                return (
                  <tr key={r.id} className="border-b border-line/40">
                    <td className="py-2 pl-5 font-display text-base text-bone">{s.year}</td>
                    <td className="px-2 text-mute">{r.wins}-{r.losses}{r.ties ? `-${r.ties}` : ""}</td>
                    <td className="px-2 text-mute">{r.points_for ?? "—"}</td>
                    <td className="px-2 text-mute">{r.points_against ?? "—"}</td>
                    <td className="px-2 text-mute">{r.final_rank ?? "—"}</td>
                    <td className="px-2 pr-5">
                      {notes.map((n) => (
                        <span
                          key={n as string}
                          className={`mr-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            n === "Champion" ? "bg-gold/20 text-gold" : n === "Toilet Bowl" ? "bg-ember/20 text-ember" : "bg-teal/15 text-teal"
                          }`}
                        >
                          {n}
                        </span>
                      ))}
                    </td>
                  </tr>
                );
              })}
              {cardRows.length === 0 && (
                <tr><td colSpan={6} className="py-4 pl-5 text-mute">No season stats entered yet.</td></tr>
              )}
            </tbody>
            {cardRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-teal/40 bg-panel/60">
                  <td className="py-3 pl-5 font-display text-base text-teal">CAREER</td>
                  <td className="px-2 font-semibold text-bone">{careerWins}-{careerLosses}{careerTies ? `-${careerTies}` : ""}</td>
                  <td className="px-2 font-semibold text-bone">{careerPF.toFixed(1)}</td>
                  <td className="px-2 font-semibold text-bone">{careerPA.toFixed(1)}</td>
                  <td className="px-2 font-semibold text-bone">{playoffCount} playoffs</td>
                  <td className="px-2 pr-5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="border-t border-teal/30 px-5 py-5">
          <p className="text-sm leading-relaxed text-mute">{writeup}</p>
        </div>
      </div>

      {questionnaire.length > 0 && (
        <>
          <h2 className="mt-12 font-display text-2xl tracking-wide text-bone">The Questionnaire</h2>
          <div className="divider-tentacle my-4" />
          <div className="space-y-4">
            {questionnaire.map((q: { question: string; answer: string }, i: number) => (
              <div key={i} className="stat-card rounded-xl p-5">
                <div className="text-sm font-semibold text-teal">{q.question}</div>
                <div className="mt-1 text-bone">{q.answer}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function buildWriteup({
  name,
  seasonsPlayed,
  firstYear,
  wins,
  losses,
  ties,
  playoffCount,
  champYears,
  runnerUpYears,
  regSeasonYears,
  toiletBowlYears,
}: {
  name: string;
  seasonsPlayed: number;
  firstYear?: string;
  wins: number;
  losses: number;
  ties: number;
  playoffCount: number;
  champYears: string[];
  runnerUpYears: string[];
  regSeasonYears: string[];
  toiletBowlYears: string[];
}): string {
  if (seasonsPlayed === 0) return `No season stats entered yet for ${name}.`;

  const parts: string[] = [];
  parts.push(
    `${name} has been in the Greaze since ${firstYear}, playing ${seasonsPlayed} season${seasonsPlayed === 1 ? "" : "s"} to a career record of ${wins}-${losses}${ties ? `-${ties}` : ""} with ${playoffCount} playoff appearance${playoffCount === 1 ? "" : "s"}.`
  );

  if (champYears.length > 0) {
    parts.push(
      `${champYears.length}-time champion (${champYears.join(", ")}).`
    );
  } else {
    parts.push("Still chasing that first title.");
  }

  if (runnerUpYears.length > 0) {
    parts.push(`Runner-up ${runnerUpYears.length} time${runnerUpYears.length === 1 ? "" : "s"} (${runnerUpYears.join(", ")}).`);
  }

  if (regSeasonYears.length > 0) {
    parts.push(`Won the regular season crown ${regSeasonYears.length} time${regSeasonYears.length === 1 ? "" : "s"} (${regSeasonYears.join(", ")}).`);
  }

  if (toiletBowlYears.length > 0) {
    parts.push(`Also seen the Toilet Bowl ${toiletBowlYears.length} time${toiletBowlYears.length === 1 ? "" : "s"} (${toiletBowlYears.join(", ")}).`);
  }

  return parts.join(" ");
}
