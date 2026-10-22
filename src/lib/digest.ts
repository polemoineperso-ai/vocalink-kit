import { differenceInCalendarDays, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendEmail, getAppUrl } from "@/lib/mailer";
import { digestEmail } from "@/lib/email-templates";
import type { IdeaCategory, IdeaPriority } from "@prisma/client";

/**
 * Digest périodique des idées PENDING oubliées — voir
 * src/app/api/cron/digest/route.ts pour le point d'entrée HTTP (déclenché
 * par une tâche planifiée externe, pas par une session utilisateur — un
 * digest doit partir même si personne n'ouvre l'application ce jour-là).
 *
 * Seuil : PENDING depuis plus de DIGEST_STALE_DAYS, toutes catégories
 * confondues. Les Appel/Rappel ont déjà leur propre rappel via le lien
 * calendrier préparé à la sauvegarde — le digest ne duplique pas ça, il
 * rattrape les idées de toute catégorie jamais vraiment traitées.
 */

const DIGEST_STALE_DAYS = 3;

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  PROJET: "Projet",
  EMAIL: "Email",
  APPEL_RAPPEL: "Appel / Rappel",
  IDEE_PURE: "Idée pure",
};

const PRIORITY_LABELS: Record<IdeaPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};

const PRIORITY_RANK: Record<IdeaPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export async function runDigest(): Promise<{ staleCount: number; sent: boolean }> {
  const threshold = subDays(new Date(), DIGEST_STALE_DAYS);
  const ideas = await prisma.idea.findMany({
    where: { status: "PENDING", createdAt: { lte: threshold } },
    orderBy: { createdAt: "asc" },
  });

  if (ideas.length === 0) return { staleCount: 0, sent: false };

  const to = process.env.DIGEST_TO_EMAIL;
  if (!to) {
    console.warn("[digest] DIGEST_TO_EMAIL non configuré — envoi ignoré.");
    return { staleCount: ideas.length, sent: false };
  }

  try {
    const now = new Date();
    // Les plus importantes d'abord, puis les plus anciennes à priorité égale.
    const sorted = [...ideas].sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const items = sorted.map((idea) => ({
      title: idea.title,
      categoryLabel: CATEGORY_LABELS[idea.category],
      priorityLabel: PRIORITY_LABELS[idea.priority],
      ageDays: differenceInCalendarDays(now, idea.createdAt),
      href: `${getAppUrl()}/ideas/${idea.id}/edit`,
    }));
    const { subject, text } = digestEmail({ items });
    const sent = await sendEmail({ to, subject, text });
    return { staleCount: ideas.length, sent };
  } catch (e) {
    console.error("[digest] échec inattendu", e);
    return { staleCount: ideas.length, sent: false };
  }
}
