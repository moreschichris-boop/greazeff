"use client";

import { useState, ReactNode } from "react";

export default function RecordsTabs({
  overview,
  seasonsTab,
}: {
  overview: ReactNode;
  seasonsTab: ReactNode;
}) {
  const [tab, setTab] = useState<"overview" | "seasons">("overview");

  return (
    <div>
      <div className="mb-8 flex gap-2">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          All-Time
        </TabButton>
        <TabButton active={tab === "seasons"} onClick={() => setTab("seasons")}>
          Seasons
        </TabButton>
      </div>
      {tab === "overview" ? overview : seasonsTab}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wide ${
        active ? "bg-teal text-ink" : "border border-line text-mute hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}
