import { isAction, isActiveStage } from "@/lib/idea-kind";
import type { IdeaCategory, IdeaStage } from "@prisma/client";

/**
 * « À redécouvrir » : chaque jour, une idée encore vivante mais oubliée
 * remonte (écran Mes idées et brief du matin). Fonction pure, testée.
 *
 * - candidate : une IDÉE active (pas une action), sans activité (création
 *   ou dernière note) depuis DORMANT_DAYS ;
 * - jamais reproposée moins de COOLDOWN_DAYS après avoir été traitée
 *   (développée, remise à plus tard, archivée) ;
 * - choix déterministe : la plus longtemps oubliée. Accueil et brief
 *   montrent donc la même idée le même jour.
 */

export const DORMANT_DAYS = 7;
export const COOLDOWN_DAYS = 14;
const DAY_MS = 86_400_000;

export type RediscoverCandidate = {
  id: string;
  category: IdeaCategory;
  stage: IdeaStage;
  createdAt: Date | string;
  resurfacedAt: Date | string | null;
  lastNoteAt: Date | string | null;
};

function lastActivity(idea: RediscoverCandidate): number {
  const created = new Date(idea.createdAt).getTime();
  return idea.lastNoteAt ? Math.max(created, new Date(idea.lastNoteAt).getTime()) : created;
}

export function pickRediscovery<T extends RediscoverCandidate>(ideas: T[], now: Date = new Date()): T | null {
  const nowMs = now.getTime();
  const candidates = ideas.filter(
    (idea) =>
      !isAction(idea.category) &&
      isActiveStage(idea.stage) &&
      nowMs - lastActivity(idea) >= DORMANT_DAYS * DAY_MS &&
      (!idea.resurfacedAt || nowMs - new Date(idea.resurfacedAt).getTime() >= COOLDOWN_DAYS * DAY_MS),
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((oldest, idea) => (lastActivity(idea) < lastActivity(oldest) ? idea : oldest));
}
