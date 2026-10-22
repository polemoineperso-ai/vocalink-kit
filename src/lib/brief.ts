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

export function buildMorningBrief(pendingIdeas: BriefIdea[], firstName: string | null, now: Date = new Date()): PushPayload | null {
  const today = todayInParis(now);
  const dueToday = pendingIdeas
    .filter((i) => i.dueAt && todayInParis(i.dueAt) === today && i.dueAt >= now)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
  const overdue = pendingIdeas.filter((i) => i.dueAt && i.dueAt < now);
  const hello = firstName ? `Bonjour ${firstName} ☀️` : "Bonjour ☀️";
  // Pastille de l'icône : ce qui demande de l'attention aujourd'hui.
  const badgeCount = dueToday.length + overdue.length;

  if (dueToday.length === 0 && overdue.length === 0) {
    if (pendingIdeas.length === 0) return null;
    return {
      title: hello,
      body: `Rien de prévu aujourd'hui. ${pendingIdeas.length} action${pendingIdeas.length > 1 ? "s" : ""} sans date : un petit tri ?`,
      url: "/a-faire",
      badgeCount,
    };
  }

  const parts: string[] = [];
  if (dueToday.length > 0) {
    const listed = dueToday
      .slice(0, MAX_LISTED)
      .map((i) => (i.dueEstimated ? i.title : `${i.title} (${timeInParis(i.dueAt!)})`));
    const more = dueToday.length > MAX_LISTED ? ` et ${dueToday.length - MAX_LISTED} autre${dueToday.length - MAX_LISTED > 1 ? "s" : ""}` : "";
    parts.push(`Aujourd'hui : ${listed.join(", ")}${more}.`);
  }
  if (overdue.length > 0) parts.push(`${overdue.length} en retard.`);

  return { title: hello, body: parts.join(" "), url: "/a-faire", badgeCount };
}
