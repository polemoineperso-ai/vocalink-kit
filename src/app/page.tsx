import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, ListChecks } from "lucide-react";
import { getHomeStats, getRediscovery, listIdeas } from "@/lib/actions/idea-actions";
import { getAppSettings } from "@/lib/actions/settings-actions";
import { prisma } from "@/lib/prisma";
import { isAction } from "@/lib/idea-kind";
import { greeting } from "@/lib/idea-sections";
import { AppBadge } from "@/components/app-badge";
import { IdeasBoard } from "@/components/ideas-board";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { RediscoverCard } from "@/components/rediscover-card";
import { Onboarding } from "@/components/onboarding";
import { TabBar } from "@/components/tab-bar";

export const dynamic = "force-dynamic";

/** Accueil : « Mes idées ». Les actions (appels, emails) vivent dans l'onglet À faire. */
export default async function IdeasHomePage({ searchParams }: { searchParams: Promise<{ dicter?: string; tag?: string }> }) {
  const [{ dicter, tag }, ideas, stats, settings, notes, rediscovery] = await Promise.all([
    searchParams,
    listIdeas(),
    getHomeStats(),
    getAppSettings(),
    prisma.ideaNote.findMany({ select: { ideaId: true, text: true } }),
    getRediscovery(),
  ]);

  if (!settings.onboarded) {
    return (
      <main className="safe-top mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-12">
        <Onboarding />
      </main>
    );
  }

  // « Dicter en un geste » (raccourci iPhone, Android) : l'écran de dictée démarre seul.
  if (dicter === "1") redirect("/capture");

  const now = new Date();
  const onlyIdeas = ideas.filter((i) => !isAction(i.category));
  const urgent = stats.dueToday + stats.overdue;
  const initial = settings.firstName?.trim()[0]?.toUpperCase() ?? "•";
  // Notes par idée : nombre (affiché sur la carte) et texte (pris en compte par la recherche).
  const notesByIdea: Record<string, { count: number; text: string }> = {};
  for (const note of notes) {
    const entry = (notesByIdea[note.ideaId] ??= { count: 0, text: "" });
    entry.count += 1;
    entry.text += ` ${note.text}`;
  }

  return (
    <main className="safe-top safe-bottom-space mx-auto w-full max-w-xl px-4">
      <AppBadge count={urgent} />

      <header className="flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="eyebrow">
            {greeting(now)}
            {settings.firstName ? ` ${settings.firstName}` : ""}
          </p>
          <h1 className="large-title mt-0.5">Mes idées</h1>
        </div>
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold text-muted shadow-sm"
        >
          {initial}
        </Link>
      </header>

      {urgent > 0 ? (
        <Link
          href="/a-faire"
          className={`mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 transition active:scale-[0.99] ${stats.overdue ? "bg-warn-soft text-warn" : "bg-surface"}`}
        >
          <ListChecks size={18} aria-hidden="true" />
          <span className="flex-1 text-sm font-semibold">
            {[
              stats.dueToday ? `${stats.dueToday} action${stats.dueToday > 1 ? "s" : ""} aujourd'hui` : null,
              stats.overdue ? `${stats.overdue} en retard` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <ChevronRight size={17} aria-hidden="true" />
        </Link>
      ) : null}

      {rediscovery ? (
        <RediscoverCard
          idea={{
            id: rediscovery.id,
            title: rediscovery.title,
            summary: rediscovery.summary,
            createdAt: rediscovery.createdAt.toISOString(),
            stage: rediscovery.stage,
          }}
        />
      ) : null}

      <div className="mt-4">
        <NotificationsToggle hideWhenOn />
      </div>

      <IdeasBoard key={tag ?? ""} ideas={onlyIdeas} initialTag={tag ?? ""} notesByIdea={notesByIdea} />

      <TabBar />
    </main>
  );
}
