import type { IdeaCategory, IdeaPriority } from "@prisma/client";

/**
 * Libellés et couleurs par catégorie / priorité, partagés par toutes les
 * vues (carte, formulaire, filtres) pour qu'une catégorie ait partout la
 * même couleur. Classes Tailwind écrites en entier : Tailwind ne détecte
 * pas les noms construits dynamiquement.
 */

export const CATEGORY_STYLE: Record<
  IdeaCategory,
  { label: string; icon: string; chip: string; stripe: string; selected: string }
> = {
  PROJET: {
    label: "Projet",
    icon: "✦",
    chip: "bg-projet-soft text-projet-ink",
    stripe: "bg-projet",
    selected: "bg-projet-soft text-projet-ink",
  },
  EMAIL: {
    label: "Email",
    icon: "✉",
    chip: "bg-email-soft text-email-ink",
    stripe: "bg-email",
    selected: "bg-email-soft text-email-ink",
  },
  APPEL_RAPPEL: {
    label: "Appel / Rappel",
    icon: "☎",
    chip: "bg-appel-soft text-appel-ink",
    stripe: "bg-appel",
    selected: "bg-appel-soft text-appel-ink",
  },
  IDEE_PURE: {
    label: "Idée",
    icon: "✎",
    chip: "bg-idee-soft text-idee-ink",
    stripe: "bg-idee",
    selected: "bg-idee-soft text-idee-ink",
  },
};

export const CATEGORY_ORDER: IdeaCategory[] = ["PROJET", "EMAIL", "APPEL_RAPPEL", "IDEE_PURE"];

export const PRIORITY_STYLE: Record<IdeaPriority, { label: string; chip: string; selected: string }> = {
  LOW: { label: "Basse", chip: "bg-subtle text-muted", selected: "bg-subtle text-ink" },
  MEDIUM: { label: "Moyenne", chip: "bg-subtle text-muted", selected: "bg-subtle text-ink" },
  HIGH: { label: "Haute", chip: "bg-danger-soft text-danger", selected: "bg-danger-soft text-danger" },
};

export const PRIORITY_ORDER: IdeaPriority[] = ["LOW", "MEDIUM", "HIGH"];

/** Initiales d'un nom ("Jean Dupont" → "JD"), pour l'avatar du contact. */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}
