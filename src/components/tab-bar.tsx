"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Layers, Mic } from "lucide-react";

/**
 * Barre de navigation flottante en bas d'écran : Aujourd'hui · micro ·
 * Idées. Le micro, au centre et plus gros, est accessible partout au pouce.
 */
export function TabBar() {
  const pathname = usePathname();
  const onToday = pathname === "/";
  const onIdeas = pathname.startsWith("/ideas");

  const tab = (active: boolean) =>
    `flex w-20 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition ${active ? "text-brand" : "text-muted"}`;

  return (
    <nav className="tab-bar" aria-label="Navigation">
      <Link href="/" className={tab(onToday)} aria-current={onToday ? "page" : undefined}>
        <CalendarDays size={22} strokeWidth={onToday ? 2.4 : 2} aria-hidden="true" />
        Aujourd&apos;hui
      </Link>
      <Link
        href="/capture"
        aria-label="Dicter une idée"
        className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-hover active:scale-95"
      >
        <Mic size={26} strokeWidth={2.2} aria-hidden="true" />
      </Link>
      <Link href="/ideas" className={tab(onIdeas)} aria-current={onIdeas ? "page" : undefined}>
        <Layers size={22} strokeWidth={onIdeas ? 2.4 : 2} aria-hidden="true" />
        Idées
      </Link>
    </nav>
  );
}
