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
