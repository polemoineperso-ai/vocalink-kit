import Link from "next/link";
import { ChevronLeft, Download, ExternalLink, FileJson, LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth-actions";
import { getAppSettings } from "@/lib/actions/settings-actions";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { CopyShortcutUrl, FirstNameField, HealthCheck } from "@/components/settings-panels";
import { AboutPanel } from "@/components/update-check";
import { repoFromEnv } from "@/lib/version";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAppSettings();
  const notionId = process.env.NOTION_DATABASE_ID;
  const notionUrl = notionId ? `https://www.notion.so/${notionId.replace(/-/g, "")}` : null;

  return (
    <main className="safe-top mx-auto w-full max-w-xl px-4 pb-16">
      <nav className="flex items-center py-2">
        <Link href="/" className="-ml-1.5 flex items-center font-medium text-brand">
          <ChevronLeft size={22} aria-hidden="true" />
          Mes idées
        </Link>
      </nav>
      <h1 className="large-title mt-1">Réglages</h1>

      <h2 className="group-label">Vous</h2>
      <div className="group">
        <FirstNameField initial={settings.firstName ?? ""} />
      </div>

      <h2 className="group-label">Notifications</h2>
      <NotificationsToggle />

      <h2 className="group-label">Dicter en un geste</h2>
      <div className="group">
        <CopyShortcutUrl />
        <div className="row items-start">
          <p className="text-sm leading-relaxed text-muted">
            <b className="text-ink">iPhone</b> : app <b className="text-ink">Raccourcis</b> → <b className="text-ink">+</b> → action{" "}
            <b className="text-ink">Ouvrir les URL</b>, collez l&apos;adresse, nommez-le « Vocalink ». Lancez-le avec Siri, le
            bouton Action ou un double toucher au dos de l&apos;iPhone. Il s&apos;ouvre dans Safari : connectez-vous une fois.
            <br />
            <b className="text-ink">Android</b> : appui long sur l&apos;icône Vocalink → <b className="text-ink">Dicter</b>.
          </p>
        </div>
      </div>

      {notionUrl ? (
        <>
          <h2 className="group-label">Intégrations</h2>
          <div className="group">
            <a href={notionUrl} target="_blank" rel="noopener noreferrer" className="row">
              <span className="row-title flex-1">Base Notion des projets</span>
              <ExternalLink size={17} className="text-faint" aria-hidden="true" />
            </a>
          </div>
        </>
      ) : null}

      <h2 className="group-label">Mes données</h2>
      <div className="group">
        <a href="/export?format=csv" download className="row">
          <span className="icon-btn bg-brand-soft text-brand-ink" aria-hidden="true">
            <Download size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="row-title block">Exporter mes idées</span>
            <span className="row-sub block">Un tableau qui s&apos;ouvre dans Excel, avec notes et contacts</span>
          </span>
        </a>
        <a href="/export?format=json" download className="row">
          <span className="icon-btn bg-subtle text-muted" aria-hidden="true">
            <FileJson size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="row-title block">Sauvegarde complète</span>
            <span className="row-sub block">Toutes les informations, au format JSON</span>
          </span>
        </a>
      </div>

      <h2 className="group-label">Dépannage</h2>
      <div className="group">
        <HealthCheck />
      </div>

      <h2 className="group-label">À propos</h2>
      <AboutPanel repo={repoFromEnv(process.env)} />

      {process.env.APP_PASSWORD ? (
        <div className="group mt-8">
          <form action={logout}>
            <button type="submit" className="row w-full text-danger">
              <LogOut size={18} aria-hidden="true" />
              <span className="row-title">Se déconnecter</span>
            </button>
          </form>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-faint">Vocalink — ne perdez plus jamais une idée.</p>
    </main>
  );
}
