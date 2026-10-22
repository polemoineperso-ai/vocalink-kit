import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { IdeaCategory } from "@prisma/client";

/**
 * Logique de date/heure isolée dans son propre module pur (pas de "use
 * server", pas de Prisma) pour rester facilement testable — c'est
 * exactement la fonction qui a produit un bug de fuseau horaire en
 * production (voir resolveDueAt ci-dessous), invisible en local et jamais
 * couvert par un test avant ça.
 */

export const APP_TIMEZONE = "Europe/Paris";
const DEFAULT_DUE_HOUR = 9;

/** "Aujourd'hui" en heure de Paris — jamais UTC (fuseau du serveur Vercel). */
export function todayInParis(now: Date = new Date()): string {
  return format(toZonedTime(now, APP_TIMEZONE), "yyyy-MM-dd", { timeZone: APP_TIMEZONE });
}

/**
 * La date/heure est disponible pour toute catégorie (échéance optionnelle),
 * pas seulement Appel/Rappel. Seule différence : Appel/Rappel a besoin d'un
 * créneau pour préparer le lien calendrier, donc reçoit un créneau par
 * défaut (demain 9h, signalé "estimé") quand rien n'est précisé — les
 * autres catégories restent simplement sans échéance si rien n'est donné.
 *
 * L'heure saisie (dueDate/dueTime) est toujours une heure de Paris — le
 * serveur (fonctions Vercel) tourne en UTC, donc la construction doit
 * explicitement convertir Paris → UTC plutôt que d'utiliser `new Date(...)`
 * qui interprète la chaîne dans le fuseau du serveur (bug constaté en
 * production : "11h" enregistré affichait 13h, invisible en local où le PC
 * est déjà à l'heure française).
 */
export function resolveDueAt(
  input: { category: IdeaCategory; dueDate?: string | null; dueTime?: string | null },
  now: Date = new Date(),
): { dueAt: Date | null; dueEstimated: boolean } {
  if (input.dueDate) {
    const time = input.dueTime ?? `${String(DEFAULT_DUE_HOUR).padStart(2, "0")}:00`;
    const dueAt = fromZonedTime(`${input.dueDate}T${time}:00`, APP_TIMEZONE);
    return { dueAt, dueEstimated: false };
  }

  if (input.category !== IdeaCategory.APPEL_RAPPEL) return { dueAt: null, dueEstimated: false };

  // Aucune date fournie pour un Appel/Rappel — créneau par défaut : demain à 9h (heure de Paris), signalé comme estimé.
  const tomorrowInParis = toZonedTime(now, APP_TIMEZONE);
  tomorrowInParis.setDate(tomorrowInParis.getDate() + 1);
  const tomorrowDateStr = format(tomorrowInParis, "yyyy-MM-dd", { timeZone: APP_TIMEZONE });
  const dueAt = fromZonedTime(`${tomorrowDateStr}T${String(DEFAULT_DUE_HOUR).padStart(2, "0")}:00:00`, APP_TIMEZONE);
  return { dueAt, dueEstimated: true };
}

export type SnoozeOption = "tomorrow" | "monday" | "week";

export const SNOOZE_LABELS: Record<SnoozeOption, string> = {
  tomorrow: "Demain",
  monday: "Lundi",
  week: "Dans 1 semaine",
};

/**
 * « Reporter » : nouvelle échéance à partir d'aujourd'hui (Paris), en
 * gardant l'heure prévue (heure de Paris) ou 9 h s'il n'y en avait pas.
 * « Lundi » = le prochain lundi, jamais aujourd'hui.
 */
export function snoozeDueAt(current: Date | null, option: SnoozeOption, now: Date = new Date()): Date {
  const todayParis = toZonedTime(now, APP_TIMEZONE);
  const target = new Date(todayParis);
  if (option === "tomorrow") target.setDate(target.getDate() + 1);
  if (option === "week") target.setDate(target.getDate() + 7);
  if (option === "monday") target.setDate(target.getDate() + (((8 - target.getDay()) % 7) || 7));
  const date = format(target, "yyyy-MM-dd", { timeZone: APP_TIMEZONE });
  const time = current
    ? format(toZonedTime(current, APP_TIMEZONE), "HH:mm", { timeZone: APP_TIMEZONE })
    : `${String(DEFAULT_DUE_HOUR).padStart(2, "0")}:00`;
  return fromZonedTime(`${date}T${time}:00`, APP_TIMEZONE);
}
