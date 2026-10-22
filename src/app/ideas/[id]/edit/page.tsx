import { notFound } from "next/navigation";
import { getIdea } from "@/lib/actions/idea-actions";
import { EditIdeaForm } from "@/components/edit-idea-form";

export const dynamic = "force-dynamic";

export default async function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) notFound();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold">Modifier l&apos;idée</h1>
      <EditIdeaForm idea={idea} />
    </main>
  );
}
