import type { IdeaCategory, IdeaStage, IdeaStatus } from "@prisma/client";

/**
 * Deux natures dans Vocalink :
 * - une IDÉE (Projet, Idée) mûrit : Nouvelle → En réflexion → En cours →
 *   Réalisée, ou Archivée. Jamais « en retard » : pas de culpabilité.
 * - une ACTION (Email, Appel / Rappel) se fait : elle a souvent une date,
 *   se coche, et vit dans l'onglet « À faire ».
 */

export const ACTION_CATEGORIES: IdeaCategory[] = ["EMAIL", "APPEL_RAPPEL"];

export function isAction(category: IdeaCategory): boolean {
  return ACTION_CATEGORIES.includes(category);
}

export const STAGE_ORDER: IdeaStage[] = ["NEW", "THINKING", "IN_PROGRESS", "DONE"];

export const STAGE_STYLE: Record<IdeaStage, { label: string; plural: string; chip: string; bar: string }> = {
  NEW: { label: "Nouvelle", plural: "Nouvelles", chip: "bg-brand-soft text-brand-ink", bar: "bg-brand" },
  THINKING: { label: "En réflexion", plural: "En réflexion", chip: "bg-projet-soft text-projet-ink", bar: "bg-projet" },
  IN_PROGRESS: { label: "En cours", plural: "En cours", chip: "bg-email-soft text-email-ink", bar: "bg-email" },
  DONE: { label: "Réalisée", plural: "Réalisées", chip: "bg-ok-soft text-ok", bar: "bg-ok" },
  ARCHIVED: { label: "Archivée", plural: "Archivées", chip: "bg-subtle text-muted", bar: "bg-faint" },
};

/** Idée encore « vivante » (ni réalisée ni archivée). */
export function isActiveStage(stage: IdeaStage): boolean {
  return stage !== "DONE" && stage !== "ARCHIVED";
}

/**
 * `status` suit l'étape pour une idée : une idée réalisée ou archivée est
 * « traitée » (tâche Google cochée, sortie des rappels), les autres non.
 */
export function statusForStage(stage: IdeaStage): IdeaStatus {
  return isActiveStage(stage) ? "PENDING" : "ACTIONED";
}
