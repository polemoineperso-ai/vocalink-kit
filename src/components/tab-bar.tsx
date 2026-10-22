"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightbulb, ListChecks, Mic } from "lucide-react";

/**
 * Barre de navigation flottante en bas d'écran : Idées · micro · À faire.
 * Les idées d'abord (l'objet de l'app), les actions ensuite. Le micro, au
 * centre et plus gros, est accessible partout au pouce.
 */
export function TabBar() {
  const pathname = usePathname();
  const onIdeas = pathname === "/";
  const onTodo = pathname.startsWith("/a-faire");

  const tab = (active: boolean) =>
    `flex w-20 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition ${active ? "text-brand" : "text-muted"}`;

  return (
    <nav className="tab-bar" aria-label="Navigation">
      <Link href="/" className={tab(onIdeas)} aria-current={onIdeas ? "page" : undefined}>
        <Lightbulb size={22} strokeWidth={onIdeas ? 2.4 : 2} aria-hidden="true" />
        Idées
      </Link>
      <Link
        href="/capture"
        aria-label="Dicter une idée"
        className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-hover active:scale-95"
      >
        <Mic size={26} strokeWidth={2.2} aria-hidden="true" />
      </Link>
      <Link href="/a-faire" className={tab(onTodo)} aria-current={onTodo ? "page" : undefined}>
        <ListChecks size={22} strokeWidth={onTodo ? 2.4 : 2} aria-hidden="true" />
        À faire
      </Link>
    </nav>
  );
}
