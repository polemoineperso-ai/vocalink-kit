import { login } from "@/lib/actions/auth-actions";
import { BrandMark } from "@/lib/brand-mark";
import { formatWait } from "@/lib/login-throttle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; attente?: string }>;
}) {
  const { next, error, attente } = await searchParams;
  const waitMinutes = Number(attente) > 0 ? Math.ceil(Number(attente)) : 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand text-white shadow-lg" aria-hidden="true">
          <BrandMark size={48} strokeWidth={1.5} />
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
        {waitMinutes ? (
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            Trop d&apos;essais ratés : par sécurité, la connexion est bloquée. Réessayez dans {formatWait(waitMinutes)}.
          </p>
        ) : error ? (
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">Mot de passe incorrect.</p>
        ) : null}
        <button type="submit" className="btn btn-primary w-full py-3.5">
          Se connecter
        </button>
      </form>
    </main>
  );
}
