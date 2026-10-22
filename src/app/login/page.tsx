import { login } from "@/lib/actions/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand text-white shadow-lg" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vocalink</h1>
          <p className="mt-1 text-muted">Ne perdez plus jamais une idée.</p>
        </div>
      </div>

      <form action={login} className="card flex flex-col gap-4 p-6">
        <input type="hidden" name="next" value={next ?? "/"} />
        <label className="field-label">
          Mot de passe
          <input type="password" name="password" autoFocus autoComplete="current-password" />
        </label>
        {error ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">Mot de passe incorrect.</p> : null}
        <button type="submit" className="btn btn-primary w-full py-3.5">
          Se connecter
        </button>
      </form>
    </main>
  );
}
