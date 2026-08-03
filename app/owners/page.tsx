import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import SquidMark from "@/components/SquidMark";

export const revalidate = 0;

export default async function OwnersPage() {
  const { data: owners } = await supabase.from("owners").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wide text-bone">The Owners</h1>
      <p className="mt-2 text-mute">Twelve franchises. Twelve egos. One league.</p>
      <div className="divider-tentacle my-6" />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(owners ?? []).map((o) => (
          <Link key={o.id} href={`/owners/${o.slug}`} className="stat-card group rounded-xl p-5 text-center transition hover:border-teal/60">
            {o.photo_url ? (
              <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-xl bg-panel ring-2 ring-line group-hover:ring-teal">
                <Image
                  src={o.photo_url}
                  alt={o.name}
                  fill
                  className="object-contain object-center"
                  sizes="192px"
                />
              </div>
            ) : (
              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl bg-panel ring-2 ring-line group-hover:ring-teal">
                <SquidMark size={120} />
              </div>
            )}
            <div className="mt-4">
              <div className="font-display text-xl text-bone">{o.name}</div>
              {o.team_name && <div className="text-sm text-teal">{o.team_name}</div>}
            </div>
          </Link>
        ))}
        {(!owners || owners.length === 0) && <p className="text-mute">No owners yet — add them from the admin panel.</p>}
      </div>
    </div>
  );
}
