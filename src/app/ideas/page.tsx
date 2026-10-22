import Link from "next/link";
import { getHomeStats, listIdeas } from "@/lib/actions/idea-actions";
import { AppBadge } from "@/components/app-badge";
import { AppHeader } from "@/components/app-header";
import { IdeasFilterList } from "@/components/ideas-filter-list";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const [ideas, stats] = await Promise.all([listIdeas(), getHomeStats()]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pb-28 pt-4">
      <AppHeader showIdeasLink={false} />
      <AppBadge count={stats.dueToday + stats.overdue} />
      <h1 className="text-2xl font-semibold">Mes idées</h1>

      <IdeasFilterList ideas={ideas} />

      <Link
        href="/"
        aria-label="Enregistrer une idée"
        className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand px-6 py-4 font-semibold text-white shadow-xl transition hover:bg-brand-hover active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
          <line x1="12" y1="18" x2="12" y2="22" />
        </svg>
        Nouvelle idée
      </Link>
    </main>
  );
}
