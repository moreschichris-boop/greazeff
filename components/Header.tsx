"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SquidMark from "./SquidMark";

const links = [
  { href: "/", label: "Home" },
  { href: "/draft", label: "Draft" },
  { href: "/history", label: "History" },
  { href: "/rosters", label: "Rosters" },
  { href: "/records", label: "Records" },
  { href: "/owners", label: "Owners" },
  { href: "/gallery", label: "Gallery" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <SquidMark size={38} />
          <div className="leading-none">
            <div className="font-display text-2xl tracking-wide text-bone">GREAZE</div>
            <div className="-mt-1 text-[10px] uppercase tracking-[0.3em] text-teal">
              Fantasy Football League
            </div>
          </div>
        </Link>

        <nav className="hidden gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                  active ? "bg-teal/15 text-teal" : "text-mute hover:text-bone"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/admin"
          className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-mute hover:border-teal hover:text-teal"
        >
          Admin
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-3 py-1.5 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-mute hover:text-teal"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
