import React from 'react';
import { Flame, Heart, Gem } from "lucide-react";

/** Top status bar — sticky on main app tabs. */
export function TopStatusBar() {
  // In a real app we'd fetch this from Context or Store.
  // For now we'll mock values to showcase the design.
  const streak = 5;
  const gems = 120;
  const hearts = 5;
  const lang = { flag: "🇬🇧", code: "en", englishName: "English" };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-2.5 flex items-center justify-between gap-3">
        <button className="flex items-center gap-1.5 chip !py-1 !px-2 hover:bg-accent transition-colors">
          <span className="text-xl leading-none">{lang.flag}</span>
          <span className="text-xs">{lang.englishName.slice(0, 3).toUpperCase()}</span>
        </button>
        <div className="flex items-center gap-2">
          <Stat icon={<Flame className="h-4 w-4" />} value={streak} color="text-streak" />
          <Stat icon={<Gem className="h-4 w-4" />} value={gems} color="text-gem" />
          <Stat
            icon={<Heart className="h-4 w-4 fill-current" />}
            value={hearts}
            color="text-heart"
          />
        </div>
      </div>
    </header>
  );
}

function Stat({
  icon,
  value,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  color: string;
}) {
  return (
    <div className="chip !py-1 !px-2.5 gap-1">
      <span className={color}>{icon}</span>
      <span className="font-extrabold text-sm tabular-nums">{value}</span>
    </div>
  );
}
