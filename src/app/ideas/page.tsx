import { getHomeStats, listIdeas } from "@/lib/actions/idea-actions";
import { isDueView } from "@/lib/idea-filter";
import { AppBadge } from "@/components/app-badge";
import { IdeasFilterList } from "@/components/ideas-filter-list";
import { TabBar } from "@/components/tab-bar";

export const dynamic = "force-dynamic";

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ vue?: string; tag?: string }> }) {
  const [{ vue, tag }, ideas, stats] = await Promise.all([searchParams, listIdeas(), getHomeStats()]);

  return (
    <main className="safe-top safe-bottom-space mx-auto w-full max-w-xl px-4">
      <AppBadge count={stats.dueToday + stats.overdue} />
      <h1 className="large-title pt-2">Idées</h1>

      <IdeasFilterList
        // Une vue différente (compteur, tag) remet les filtres à zéro.
        key={`${vue ?? ""}|${tag ?? ""}`}
        ideas={ideas}
        initialDue={isDueView(vue) ? vue : ""}
        initialTag={tag ?? ""}
      />

      <TabBar />
    </main>
  );
}
