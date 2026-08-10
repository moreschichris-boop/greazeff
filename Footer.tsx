import SquidMark from "./SquidMark";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line/70 bg-abyss/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-8 text-center">
        <SquidMark size={30} />
        <p className="font-display text-lg tracking-wide text-bone">GREAZE FANTASY FOOTBALL LEAGUE</p>
        <p className="text-xs text-mute">Established 2011 &middot; 12 teams &middot; PPR &middot; Yahoo Fantasy</p>
      </div>
    </footer>
  );
}
