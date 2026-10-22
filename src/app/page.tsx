import Link from "next/link";
import { logout } from "@/lib/actions/auth-actions";
import { getHomeStats } from "@/lib/actions/idea-actions";
import { getAppSettings } from "@/lib/actions/settings-actions";
import { AppBadge } from "@/components/app-badge";
import { AppHeader } from "@/components/app-header";
import { CaptureFlow } from "@/components/capture-flow";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { Onboarding } from "@/components/onboarding";

export const dynamic = "force-dynamic";

function getNotionUrl(): string | null {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) return null;
  return `https://www.notion.so/${databaseId.replace(/-/g, "")}`;
}

function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ dicter?: string }> }) {
  const notionUrl = getNotionUrl();
  const [{ dicter }, stats, settings] = await Promise.all([searchParams, getHomeStats(), getAppSettings()]);

  if (!settings.onboarded) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-12 pt-4">
        <AppHeader showIdeasLink={false} />
        <Onboarding />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-12 pt-4">
      <AppHeader />
      <AppBadge count={stats.dueToday + stats.overdue} />

      <section className="pt-4 text-center">
        {settings.firstName ? <p className="text-muted">Bonjour {settings.firstName} 👋</p> : null}
        <h1 className="text-3xl font-semibold tracking-tight">Une idée ?</h1>
        <p className="mt-2 text-muted">
          {stats.pending === 0
            ? "Aucune idée en attente. Tout est rangé."
            : `${pluralize(stats.pending, "idée vous attend", "idées vous attendent")}.`}
        </p>
      </section>

      <CaptureFlow autoStart={dicter === "1"} />

      {stats.pending > 0 ? (
        <section className="grid grid-cols-3 gap-3">
          <Link href="/ideas?vue=today" className="card flex flex-col items-center gap-0.5 p-4 text-center transition hover:border-appel">
            <span className="text-2xl font-semibold text-appel-ink">{stats.dueToday}</span>
            <span className="text-xs text-muted">aujourd&apos;hui</span>
          </Link>
          <Link
            href="/ideas?vue=overdue"
            className={`card flex flex-col items-center gap-0.5 p-4 text-center transition ${stats.overdue > 0 ? "bg-warn-soft" : ""}`}
          >
            <span className={`text-2xl font-semibold ${stats.overdue > 0 ? "text-warn" : ""}`}>{stats.overdue}</span>
            <span className="text-xs text-muted">en retard</span>
          </Link>
          <Link href="/ideas?vue=attente" className="card flex flex-col items-center gap-0.5 p-4 text-center transition hover:border-brand">
            <span className="text-2xl font-semibold">{stats.pending}</span>
            <span className="text-xs text-muted">en attente au total</span>
          </Link>
        </section>
      ) : null}

      <NotificationsToggle hideWhenOn />

      <footer className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        {notionUrl ? (
          <a href={notionUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            Ouvrir Notion ↗
          </a>
        ) : null}
        {process.env.APP_PASSWORD ? (
          <form action={logout}>
            <button type="submit" className="btn btn-ghost">
              Se déconnecter
            </button>
          </form>
        ) : null}
      </footer>
    </main>
  );
}
