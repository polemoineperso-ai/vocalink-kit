import Link from "next/link";
import { logout } from "@/lib/actions/auth-actions";

function getNotionUrl(): string | null {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) return null;
  return `https://www.notion.so/${databaseId.replace(/-/g, "")}`;
}

export default function Home() {
  const notionUrl = getNotionUrl();

  return (
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">Vocalink</h1>
      <p className="text-sm text-gray-500">Dites une idée, elle se transforme en projet, email, appel ou rappel.</p>
      <div className="flex gap-3">
        <Link href="/capture" className="rounded-md bg-black px-4 py-2 text-sm text-white">
          Enregistrer une idée
        </Link>
        <Link href="/ideas" className="rounded-md border px-4 py-2 text-sm">
          Voir mes idées
        </Link>
        {notionUrl ? (
          <a href={notionUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border px-4 py-2 text-sm">
            Ouvrir Notion ↗
          </a>
        ) : null}
      </div>
      {process.env.APP_PASSWORD ? (
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-400 underline">
            Se déconnecter
          </button>
        </form>
      ) : null}
    </main>
  );
}
