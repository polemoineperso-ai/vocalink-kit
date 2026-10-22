/**
 * Prochaine étape suggérée pour une idée : une action concrète et petite.
 * - kind "email" ou "call" : peut devenir une action (onglet À faire) ;
 * - kind "think" : une piste de réflexion, à garder en note.
 * Validation pure (testée) de la réponse de l'IA : rien n'est accepté tel quel.
 */

export type NextStepKind = "email" | "call" | "think";

export type NextStep = { title: string; kind: NextStepKind; why: string };

const KINDS: NextStepKind[] = ["email", "call", "think"];
const TITLE_MAX = 120;
const WHY_MAX = 240;

export const NEXT_STEP_LABELS: Record<NextStepKind, string> = {
  email: "Email à écrire",
  call: "Appel à passer",
  think: "Piste de réflexion",
};

export function normalizeNextStep(input: Record<string, unknown> | null): NextStep | null {
  if (!input) return null;
  const title = typeof input.title === "string" ? input.title.trim().replace(/\s+/g, " ").slice(0, TITLE_MAX) : "";
  if (!title) return null;
  const kind = KINDS.includes(input.kind as NextStepKind) ? (input.kind as NextStepKind) : "think";
  const why = typeof input.why === "string" ? input.why.trim().replace(/\s+/g, " ").slice(0, WHY_MAX) : "";
  return { title: title[0].toUpperCase() + title.slice(1), kind, why };
}
