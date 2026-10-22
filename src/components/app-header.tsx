import Link from "next/link";

/** En-tête commun : logo vers l'accueil, accès à la liste. */
export function AppHeader({ showIdeasLink = true }: { showIdeasLink?: boolean }) {
  return (
    <header className="flex items-center justify-between py-2">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
            <line x1="12" y1="18" x2="12" y2="22" />
          </svg>
        </span>
        Vocalink
      </Link>
      {showIdeasLink ? (
        <Link href="/ideas" className="btn btn-secondary px-4 py-2 text-sm">
          Mes idées
        </Link>
      ) : null}
    </header>
  );
}
