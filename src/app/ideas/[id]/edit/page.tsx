import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getIdea } from "@/lib/actions/idea-actions";
import { EditIdeaForm } from "@/components/edit-idea-form";

export const dynamic = "force-dynamic";

export default async function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) notFound();

  return (
    <main className="safe-top mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-12">
      <nav className="flex items-center py-2">
        <Link href={`/ideas/${idea.id}`} className="-ml-1.5 flex items-center font-medium text-brand">
          <ChevronLeft size={22} aria-hidden="true" />
          Annuler
        </Link>
      </nav>
      <h1 className="large-title">Modifier</h1>
      <EditIdeaForm idea={idea} />
    </main>
  );
}
