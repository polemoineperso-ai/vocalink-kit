import Link from "next/link";
import { listIdeas } from "@/lib/actions/idea-actions";
import { IdeasFilterList } from "@/components/ideas-filter-list";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const ideas = await listIdeas();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Mes idées</h1>
        <Link href="/capture" className="text-sm text-gray-500 underline">
          Enregistrer une idée
        </Link>
      </div>

      <IdeasFilterList ideas={ideas} />
    </main>
  );
}
