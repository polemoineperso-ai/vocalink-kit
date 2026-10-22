import { notFound } from "next/navigation";
import { getIdea } from "@/lib/actions/idea-actions";
import { AppHeader } from "@/components/app-header";
import { EditIdeaForm } from "@/components/edit-idea-form";

export const dynamic = "force-dynamic";

export default async function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 pb-12 pt-4">
      <AppHeader />
      <h1 className="text-2xl font-semibold">Modifier l&apos;idée</h1>
      <EditIdeaForm idea={idea} />
    </main>
  );
}
