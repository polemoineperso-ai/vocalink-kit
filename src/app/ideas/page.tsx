import { redirect } from "next/navigation";

/**
 * Ancienne adresse de la liste, conservée pour les liens existants
 * (notifications, favoris) : les vues de dates mènent à « À faire », le
 * reste (tags compris) à « Mes idées ».
 */
export default async function LegacyIdeasPage({ searchParams }: { searchParams: Promise<{ vue?: string; tag?: string }> }) {
  const { vue, tag } = await searchParams;
  if (vue === "today" || vue === "overdue") redirect(`/a-faire?vue=${vue}`);
  if (vue === "attente") redirect("/a-faire");
  redirect(tag ? `/?tag=${encodeURIComponent(tag)}` : "/");
}
