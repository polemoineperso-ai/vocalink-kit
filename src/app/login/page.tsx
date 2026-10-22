import { login } from "@/lib/actions/auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Vocalink</h1>
      <form action={login} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? "/"} />
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            type="password"
            name="password"
            autoFocus
            autoComplete="current-password"
            className="rounded-md border px-2 py-1.5"
          />
        </label>
        {error ? <p className="text-sm text-red-600">Mot de passe incorrect.</p> : null}
        <button type="submit" className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white">
          Se connecter
        </button>
      </form>
    </main>
  );
}
