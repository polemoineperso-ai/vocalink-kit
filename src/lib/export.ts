import type { Idea, IdeaNote } from "@prisma/client";
import { CATEGORY_STYLE, PRIORITY_STYLE } from "@/lib/category-style";
import { STAGE_STYLE } from "@/lib/idea-kind";

/**
 * Export des idées : un tableau qui s'ouvre dans Excel (CSV) et une
 * sauvegarde complète (JSON). Vos idées ne restent jamais prisonnières de
 * Vocalink. Les réglages (dont les clés des notifications) ne sont pas
 * exportés.
 */

export type IdeaWithNotes = Idea & { notes: IdeaNote[] };

const STATUS_LABELS: Record<Idea["status"], string> = { PENDING: "À faire", ACTIONED: "Fait" };

function parisDateTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" });
}

/**
 * Une cellule CSV : entre guillemets si besoin, et neutralisée si elle
 * commence comme une formule (=, +, -, @) — sinon Excel pourrait exécuter
 * un texte dicté comme une formule.
 */
export function csvCell(value: string | null | undefined): string {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const COLUMNS: [string, (idea: IdeaWithNotes) => string][] = [
  ["Titre", (i) => i.title],
  ["Résumé", (i) => i.summary],
  ["Catégorie", (i) => CATEGORY_STYLE[i.category].label],
  ["Étape", (i) => STAGE_STYLE[i.stage].label],
  ["Statut", (i) => STATUS_LABELS[i.status]],
  ["Priorité", (i) => PRIORITY_STYLE[i.priority].label],
  ["Tags", (i) => i.tags],
  ["Échéance", (i) => parisDateTime(i.dueAt)],
  ["Contact", (i) => i.contactName ?? ""],
  ["Téléphone", (i) => i.contactPhone ?? ""],
  ["Email", (i) => i.contactEmail ?? ""],
  ["Société", (i) => i.contactCompany ?? ""],
  ["Fonction", (i) => i.contactRole ?? ""],
  ["Objet de l'email", (i) => i.emailSubject ?? ""],
  ["Texte de l'email", (i) => i.emailBody ?? ""],
  ["Notes", (i) => i.notes.map((n) => `[${parisDateTime(n.createdAt)}] ${n.text}`).join("\n")],
  ["Dictée d'origine", (i) => i.transcript],
  ["Créée le", (i) => parisDateTime(i.createdAt)],
];

/** CSV pour Excel en français : séparateur « ; » et BOM pour que les accents s'affichent bien. */
export function ideasToCsv(ideas: IdeaWithNotes[]): string {
  const lines = [COLUMNS.map(([title]) => csvCell(title)).join(";")];
  for (const idea of ideas) lines.push(COLUMNS.map(([, read]) => csvCell(read(idea))).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function ideasToJson(ideas: IdeaWithNotes[], version: string, now: Date = new Date()): string {
  return JSON.stringify({ app: "Vocalink", version, exportedAt: now.toISOString(), ideas }, null, 2);
}

export function exportFilename(format: "csv" | "json", now: Date = new Date()): string {
  const day = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }); // AAAA-MM-JJ
  return `vocalink-idees-${day}.${format}`;
}
