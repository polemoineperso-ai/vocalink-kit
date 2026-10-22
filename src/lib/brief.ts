import { toZonedTime, format } from "date-fns-tz";
import { APP_TIMEZONE, todayInParis } from "@/lib/due-date";
import type { PushPayload } from "@/lib/push";

/**
 * Brief du matin (fonction pure, testable), à partir des ACTIONS en attente : ce qui est prévu aujourd'hui
 * et ce qui est en retard, en une notification courte. Renvoie `null` s'il
 * n'y a rien à dire — pas de notification vide qui habitue à ignorer.
 */

export type BriefIdea = { title: string; dueAt: Date | null; dueEstimated: boolean };

const MAX_LISTED = 3;

function timeInParis(date: Date): string {
  return format(toZonedTime(date, APP_TIMEZONE), "HH:mm", { timeZone: APP_TIMEZONE });
}

const REDISCOVER_TITLE_MAX = 60;

/**
 * `rediscovery` : l'idée « À redécouvrir » du jour, ajoutée en dernière
 * ligne (« 💡 À redécouvrir : … »). Un jour sans action, le brief peut ne
 * parler que d'elle, et ouvre alors directement sa fiche.
 */
export function buildMorningBrief(
  pendingIdeas: BriefIdea[],
  firstName: string | null,
  now: Date = new Date(),
  rediscovery: { id: string; title: string } | null = null,
): PushPayload | null {
  const today = todayInParis(now);
  const dueToday = pendingIdeas
    .filter((i) => i.dueAt && todayInParis(i.dueAt) === today && i.dueAt >= now)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
  const overdue = pendingIdeas.filter((i) => i.dueAt && i.dueAt < now);
  const hello = firstName ? `Bonjour ${firstName} ☀️` : "Bonjour ☀️";
  // Pastille de l'icône : ce qui demande de l'attention aujourd'hui.
  const badgeCount = dueToday.length + overdue.length;

  const lines: string[] = [];
  if (dueToday.length > 0 || overdue.length > 0) {
    const parts: string[] = [];
    if (dueToday.length > 0) {
      const listed = dueToday
        .slice(0, MAX_LISTED)
        .map((i) => (i.dueEstimated ? i.title : `${i.title} (${timeInParis(i.dueAt!)})`));
      const more = dueToday.length > MAX_LISTED ? ` et ${dueToday.length - MAX_LISTED} autre${dueToday.length - MAX_LISTED > 1 ? "s" : ""}` : "";
      parts.push(`Aujourd'hui : ${listed.join(", ")}${more}.`);
    }
    if (overdue.length > 0) parts.push(`${overdue.length} en retard.`);
    lines.push(parts.join(" "));
  } else if (pendingIdeas.length > 0) {
    lines.push(`Rien de prévu aujourd'hui. ${pendingIdeas.length} action${pendingIdeas.length > 1 ? "s" : ""} sans date : un petit tri ?`);
  }

  if (rediscovery) {
    const title =
      rediscovery.title.length > REDISCOVER_TITLE_MAX ? `${rediscovery.title.slice(0, REDISCOVER_TITLE_MAX - 1)}…` : rediscovery.title;
    lines.push(`💡 À redécouvrir : ${title}`);
  }

  if (lines.length === 0) return null;
  // Toucher la notification : les actions s'il y en a d'urgentes, sinon l'idée à redécouvrir.
  const url = badgeCount === 0 && rediscovery ? `/ideas/${rediscovery.id}` : "/a-faire";
  return { title: hello, body: lines.join("\n"), url, badgeCount };
}
