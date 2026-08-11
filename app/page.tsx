import Link from "next/link";
import { supabase, Owner, Season } from "@/lib/supabase";
import SquidMark from "@/components/SquidMark";

export const revalidate = 0;

export default async function HomePage() {
  const { data: owners } = await supabase.from("owners").select("*");
  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .order("year", { ascending: false });

  const ownerMap = new Map<string, Owner>((owners ?? []).map((o) => [o.id, o]));
  const latest: Season | undefined = seasons?.[0];
  const yearsRunning = seasons?.length ?? 0;

  const champCounts = new Map<string, number>();
  for (const s of seasons ?? []) {
    if (s.champion_id) champCounts.set(s.champion_id, (champCounts.get(s.champion_id) ?? 0) + 1);
  }
  const topChamps = [...champCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ owner: ownerMap.get(id), count }));

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-depth px-6 py-14 text-center sm:px-12">
        <div className="mx-auto mb-5 w-fit">
          <SquidMark size={84} />
        </div>
        <h1 className="font-display text-5xl tracking-wide text-bone sm:text-6xl">
          THE <span className="text-teal">GREAZE</span> FANTASY FOOTBALL LEAGUE
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-mute">
          {yearsRunning > 0 ? `${yearsRunning} seasons` : "Since 2011"} of glory, heartbreak, and
          the Toilet Bowl. Twelve owners. One league. All PPR, all business.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/history" className="rounded-md bg-teal px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink hover:bg-teal/90">
            Season History
          </Link>
          <Link href="/records" className="rounded-md border border-line px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-bone hover:border-teal hover:text-teal">
            All-Time Records
          </Link>
        </div>
      </section>

      {latest && (
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label={`${latest.year} Champion`} value={ownerMap.get(latest.champion_id ?? "")?.name ?? "TBD"} accent="gold" />
          <StatCard label="Regular Season Winner" value={ownerMap.get(latest.reg_season_winner_id ?? "")?.name ?? "TBD"} accent="teal" />
          <StatCard label="Toilet Bowl" value={ownerMap.get(latest.last_place_id ?? "")?.name ?? "TBD"} accent="ember" />
        </section>
      )}

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-3xl tracking-wide text-bone">Championship Leaders</h2>
          <Link href="/records" className="text-sm font-semibold text-teal hover:underline">
            Full record book &rarr;
          </Link>
        </div>
        <div className="divider-tentacle mb-6" />
        <div className="grid gap-4 sm:grid-cols-3">
          {topChamps.map(({ owner, count }, i) => (
            <div key={owner?.id ?? i} className="stat-card rounded-xl p-5">
              <div className="text-4xl font-display text-gold">#{i + 1}</div>
              <div className="mt-2 text-lg font-semibold text-bone">{owner?.name ?? "Unknown"}</div>
              <div className="text-sm text-mute">{count} championship{count === 1 ? "" : "s"}</div>
            </div>
          ))}
          {topChamps.length === 0 && (
            <p className="text-mute">No championship data yet — add seasons from the admin panel.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <QuickLink href="/owners" title="Meet the Owners" desc="Profiles, photos, and the annual questionnaire for all 12 franchises." />
        <QuickLink href="/gallery" title="Photo Gallery" desc="Draft day chaos, trophy presentations, and Toilet Bowl punishments by year." />
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "gold" | "teal" | "ember" }) {
  const colors = { gold: "text-gold", teal: "text-teal", ember: "text-ember" };
  return (
    <div className="stat-card rounded-xl p-6 text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-mute">{label}</div>
      <div className={`mt-2 font-display text-2xl ${colors[accent]}`}>{value}</div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="stat-card block rounded-xl p-6 transition hover:border-teal/60">
      <h3 className="font-display text-2xl tracking-wide text-bone">{title}</h3>
      <p className="mt-2 text-sm text-mute">{desc}</p>
    </Link>
  );
}
