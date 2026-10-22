import Link from "next/link";
import { redirect } from "next/navigation";
import { listIdeas } from "@/lib/actions/idea-actions";
import { getAppSettings } from "@/lib/actions/settings-actions";
import { formatToday, greeting, groupBySection } from "@/lib/idea-sections";
import { AppBadge } from "@/components/app-badge";
import { IdeaRow } from "@/components/idea-row";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { Onboarding } from "@/components/onboarding";
import { TabBar } from "@/components/tab-bar";

export const dynamic = "force-dynamic";

const UPCOMING_LIMIT = 3;
const RECENT_LIMIT = 3;

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ dicter?: string }> }) {
  const [{ dicter }, ideas, settings] = await Promise.all([searchParams, listIdeas(), getAppSettings()]);

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
  const pending = ideas.filter((i) => i.status === "PENDING");
  const sections = groupBySection(pending, now);
  const items = (key: string) => sections.find((s) => s.key === key)?.items ?? [];
  const overdue = items("overdue");
  const today = items("today");
  const upcoming = [...items("tomorrow"), ...items("week")].slice(0, UPCOMING_LIMIT);
  const recent = items("undated").slice(0, RECENT_LIMIT);
  const initial = settings.firstName?.trim()[0]?.toUpperCase() ?? "•";

  return (
    <main className="safe-top safe-bottom-space mx-auto w-full max-w-xl px-4">
      <AppBadge count={today.length + overdue.length} />

      <header className="flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="eyebrow">{formatToday(now)}</p>
          <h1 className="large-title mt-0.5">Aujourd&apos;hui</h1>
        </div>
        <Link
          href="/reglages"
          aria-label="Réglages"
          className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold text-muted shadow-sm"
        >
          {initial}
        </Link>
      </header>
      <p className="mt-1 text-muted">
        {greeting(now)}
        {settings.firstName ? ` ${settings.firstName}` : ""}
        {today.length + overdue.length === 0 ? ", rien d'urgent aujourd'hui." : "."}
      </p>

      <section className="mt-5 grid grid-cols-3 gap-2.5" aria-label="Résumé">
        <Link href="/ideas?vue=today" className="rounded-2xl bg-surface p-3.5 transition active:scale-[0.98]">
          <p className="num text-2xl font-semibold">{today.length}</p>
          <p className="text-xs text-muted">prévues</p>
        </Link>
        <Link
          href="/ideas?vue=overdue"
          className={`rounded-2xl p-3.5 transition active:scale-[0.98] ${overdue.length ? "bg-warn-soft" : "bg-surface"}`}
        >
          <p className={`num text-2xl font-semibold ${overdue.length ? "text-warn" : ""}`}>{overdue.length}</p>
          <p className={`text-xs ${overdue.length ? "text-warn" : "text-muted"}`}>en retard</p>
        </Link>
        <Link href="/ideas" className="rounded-2xl bg-surface p-3.5 transition active:scale-[0.98]">
          <p className="num text-2xl font-semibold">{pending.length}</p>
          <p className="text-xs text-muted">à faire</p>
        </Link>
      </section>

      <div className="mt-4">
        <NotificationsToggle hideWhenOn />
      </div>

      {overdue.length ? (
        <>
          <h2 className="group-label text-warn">En retard</h2>
          <div className="group">
            {overdue.map((idea) => (
              <IdeaRow key={idea.id} idea={idea} />
            ))}
          </div>
        </>
      ) : null}

      <h2 className="group-label">Programme</h2>
      {today.length ? (
        <div className="group">
          {today.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} showTime />
          ))}
        </div>
      ) : (
        <div className="group">
          <div className="row">
            <p className="text-sm text-muted">
              Rien de prévu pour le reste de la journée. Une idée ? Touchez le micro en bas de l&apos;écran.
            </p>
          </div>
        </div>
      )}

      {upcoming.length ? (
        <>
          <h2 className="group-label">Bientôt</h2>
          <div className="group">
            {upcoming.map((idea) => (
              <IdeaRow key={idea.id} idea={idea} />
            ))}
          </div>
        </>
      ) : null}

      {recent.length ? (
        <>
          <div className="flex items-baseline justify-between">
            <h2 className="group-label">Idées récentes</h2>
            <Link href="/ideas" className="text-sm font-medium text-brand">
              Tout voir
            </Link>
          </div>
          <div className="group">
            {recent.map((idea) => (
              <IdeaRow key={idea.id} idea={idea} />
            ))}
          </div>
        </>
      ) : null}

      <TabBar />
    </main>
  );
}
