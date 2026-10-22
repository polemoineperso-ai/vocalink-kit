import { toZonedTime, format } from "date-fns-tz";
import { APP_TIMEZONE, todayInParis } from "@/lib/due-date";

/**
 * Rangement des idées par moment (écrans Aujourd'hui et Idées) et libellés
 * de date courts, toujours en heure de Paris (le serveur tourne en UTC).
 * Fonctions pures, testées.
 */

export type SectionKey = "overdue" | "today" | "tomorrow" | "week" | "later" | "undated";

export const SECTION_LABELS: Record<SectionKey, string> = {
  overdue: "En retard",
  today: "Aujourd'hui",
  tomorrow: "Demain",
  week: "Cette semaine",
  later: "Plus tard",
  undated: "Sans date",
};

const SECTION_ORDER: SectionKey[] = ["overdue", "today", "tomorrow", "week", "later", "undated"];

type Dated = { dueAt: Date | string | null; createdAt: Date | string };

function dayKey(date: Date): string {
  return todayInParis(date);
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / 86_400_000);
}

export function sectionOf(idea: Dated, now: Date = new Date()): SectionKey {
  if (!idea.dueAt) return "undated";
  const due = new Date(idea.dueAt);
  if (due < now) return "overdue";
  const diff = daysBetween(dayKey(now), dayKey(due));
  if (diff <= 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 6) return "week";
  return "later";
}

/** Sections non vides, dans l'ordre ; idées datées par échéance, les autres des plus récentes aux plus anciennes. */
export function groupBySection<T extends Dated>(ideas: T[], now: Date = new Date()): { key: SectionKey; label: string; items: T[] }[] {
  const buckets = new Map<SectionKey, T[]>();
  for (const idea of ideas) {
    const key = sectionOf(idea, now);
    buckets.set(key, [...(buckets.get(key) ?? []), idea]);
  }
  return SECTION_ORDER.filter((key) => buckets.has(key)).map((key) => {
    const items = [...buckets.get(key)!].sort((a, b) =>
      key === "undated"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
    );
    return { key, label: SECTION_LABELS[key], items };
  });
}

const WEEKDAYS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** « 10:00 », « Demain 9:00 », « Lun. 9:00 », « 28 oct. », « Hier 12:00 »… (heure masquée si estimée). */
export function formatDue(dueAt: Date | string, now: Date = new Date(), estimated = false): string {
  const due = new Date(dueAt);
  const zoned = toZonedTime(due, APP_TIMEZONE);
  const time = format(zoned, "H:mm", { timeZone: APP_TIMEZONE });
  const diff = daysBetween(dayKey(now), dayKey(due));
  const withTime = (label: string) => (estimated ? label : `${label} ${time}`);
  if (diff === 0) return estimated ? "Aujourd'hui" : time;
  if (diff === 1) return withTime("Demain");
  if (diff === -1) return withTime("Hier");
  if (diff > 1 && diff <= 6) return withTime(WEEKDAYS[zoned.getDay()]);
  return `${zoned.getDate()} ${MONTHS[zoned.getMonth()]}`;
}

/** Date longue du jour pour l'en-tête : « Jeudi 22 octobre ». */
export function formatToday(now: Date = new Date()): string {
  const zoned = toZonedTime(now, APP_TIMEZONE);
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${days[zoned.getDay()]} ${zoned.getDate()} ${months[zoned.getMonth()]}`;
}

/** Message d'accueil selon l'heure de Paris. */
export function greeting(now: Date = new Date()): string {
  const hour = toZonedTime(now, APP_TIMEZONE).getHours();
  if (hour < 5 || hour >= 18) return "Bonsoir";
  return "Bonjour";
}


/** Âge d'une idée : « Aujourd'hui », « Hier », « Il y a 3 jours », « Il y a 2 semaines », puis la date. */
export function formatAge(createdAt: Date | string, now: Date = new Date()): string {
  const created = new Date(createdAt);
  const diff = daysBetween(dayKey(created), dayKey(now));
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} jours`;
  if (diff < 28) {
    const weeks = Math.floor(diff / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  const zoned = toZonedTime(created, APP_TIMEZONE);
  return `${zoned.getDate()} ${MONTHS[zoned.getMonth()]}`;
}
