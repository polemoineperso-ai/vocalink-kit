import { getHomeStats, listIdeas } from "@/lib/actions/idea-actions";
import { isDueView } from "@/lib/idea-filter";
import { ACTION_CATEGORIES, isAction } from "@/lib/idea-kind";
import { formatToday } from "@/lib/idea-sections";
import { AppBadge } from "@/components/app-badge";
import { IdeasFilterList } from "@/components/ideas-filter-list";
import { TabBar } from "@/components/tab-bar";

export const dynamic = "force-dynamic";

/** Onglet « À faire » : les actions (appels, emails) nées des idées, rangées par moment. */
export default async function TodoPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const [{ vue }, ideas, stats] = await Promise.all([searchParams, listIdeas(), getHomeStats()]);
  const actions = ideas.filter((i) => isAction(i.category));

  return (
    <main className="safe-top safe-bottom-space mx-auto w-full max-w-xl px-4">
      <AppBadge count={stats.dueToday + stats.overdue} />
      <p className="eyebrow pt-2">{formatToday()}</p>
      <h1 className="large-title mt-0.5">À faire</h1>
      <p className="mt-1 text-muted">Les appels et emails nés de vos idées.</p>

      <IdeasFilterList
        key={vue ?? ""}
        ideas={actions}
        initialDue={isDueView(vue) ? vue : ""}
        categories={ACTION_CATEGORIES}
      />

      <TabBar />
    </main>
  );
}
