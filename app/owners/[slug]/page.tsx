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
  const champs = (seasons ?? []).filter((s) => s.champion_id === owner.id);
  const runnerUps = (seasons ?? []).filter((s) => s.runner_up_id === owner.id);
  const regSeasons = (seasons ?? []).filter((s) => s.reg_season_winner_id === owner.id);
  const toiletBowls = (seasons ?? []).filter((s) => s.last_place_id === owner.id);

  const questionnaire = owner.questionnaire ?? [];

  return (
    <div>
      <Link href="/owners" className="text-sm font-semibold text-teal hover:underline">
        &larr; All owners
      </Link>

      <div className="mt-4 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        {owner.photo_url ? (
          <Image
            src={owner.photo_url}
            alt={owner.name}
            width={120}
            height={120}
            className="h-28 w-28 rounded-full object-cover ring-4 ring-teal/60"
          />
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

      {owner.bio && <p className="mt-6 max-w-2xl text-mute">{owner.bio}</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Championships" value={champs.length} tone="gold" />
        <MiniStat label="Runner-Ups" value={runnerUps.length} />
        <MiniStat label="Reg. Season Titles" value={regSeasons.length} />
        <MiniStat label="Toilet Bowls" value={toiletBowls.length} tone="ember" />
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

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "gold" | "ember" }) {
  return (
    <div className="stat-card rounded-xl p-4 text-center">
      <div className={`font-display text-2xl ${tone === "gold" ? "text-gold" : tone === "ember" ? "text-ember" : "text-bone"}`}>
        {value}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-mute">{label}</div>
    </div>
  );
}
