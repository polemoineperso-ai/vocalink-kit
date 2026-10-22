"use server";

import { prisma } from "@/lib/prisma";
import { isClassificationAvailable, suggestNextStep } from "@/lib/classification";
import { saveIdea } from "@/lib/actions/idea-actions";
import { isAction, statusForStage } from "@/lib/idea-kind";
import type { NextStep, NextStepKind } from "@/lib/next-step";

/**
 * Prochaine étape suggérée pour une idée : demandée à la demande (pas à
 * chaque ouverture de fiche), gardée sur l'idée, puis acceptée (devient une
 * action liée ou une note) ou écartée. L'IA ne crée jamais rien seule.
 */

export type NextStepResult = { ok: true; step: NextStep } | { ok: false; error: string };

export async function requestNextStep(ideaId: string): Promise<NextStepResult> {
  if (!isClassificationAvailable()) return { ok: false, error: "Suggestion indisponible — aucune clé d'IA configurée." };
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { notes: { orderBy: { createdAt: "asc" }, select: { text: true } } },
  });
  if (!idea) return { ok: false, error: "Idée introuvable." };

  const step = await suggestNextStep({
    title: idea.title,
    summary: idea.summary,
    notes: idea.notes.map((n) => n.text),
    contactName: idea.contactName,
  });
  if (!step) return { ok: false, error: "Pas de suggestion pour le moment — réessayez." };

  await prisma.idea.update({
    where: { id: ideaId },
    data: { nextStepTitle: step.title, nextStepKind: step.kind, nextStepWhy: step.why || null },
  });
  return { ok: true, step };
}

export async function dismissNextStep(ideaId: string): Promise<void> {
  await prisma.idea.update({ where: { id: ideaId }, data: { nextStepTitle: null, nextStepKind: null, nextStepWhy: null } });
}

export type AcceptResult = { created: "action"; actionId: string } | { created: "note" } | null;

/**
 * Accepter la suggestion : un email ou un appel devient une ACTION liée à
 * l'idée (contact repris, onglet À faire) et l'idée passe « En cours » ;
 * une piste de réflexion devient une NOTE et l'idée passe « En réflexion »
 * si elle était « Nouvelle ».
 */
export async function acceptNextStep(ideaId: string): Promise<AcceptResult> {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea?.nextStepTitle) return null;
  const kind = (idea.nextStepKind ?? "think") as NextStepKind;
  const clear = { nextStepTitle: null, nextStepKind: null, nextStepWhy: null };

  if (kind === "think" || isAction(idea.category)) {
    await prisma.ideaNote.create({
      data: { ideaId, text: idea.nextStepWhy ? `${idea.nextStepTitle} — ${idea.nextStepWhy}` : idea.nextStepTitle, source: "text" },
    });
    const stage = idea.stage === "NEW" ? "THINKING" : idea.stage;
    await prisma.idea.update({ where: { id: ideaId }, data: { ...clear, stage, status: statusForStage(stage) } });
    return { created: "note" };
  }

  const action = await saveIdea({
    category: kind === "email" ? "EMAIL" : "APPEL_RAPPEL",
    priority: idea.priority,
    title: idea.nextStepTitle,
    summary: idea.nextStepWhy ?? `Prochaine étape de « ${idea.title} ».`,
    tags: idea.tags.split(",").map((t) => t.trim()),
    transcript: "",
    contactName: idea.contactName,
    contactPhone: idea.contactPhone,
    contactEmail: idea.contactEmail,
    contactCompany: idea.contactCompany,
    contactRole: idea.contactRole,
    parentId: idea.id,
  });
  const stage = idea.stage === "NEW" || idea.stage === "THINKING" ? "IN_PROGRESS" : idea.stage;
  await prisma.idea.update({ where: { id: ideaId }, data: { ...clear, stage, status: statusForStage(stage) } });
  return { created: "action", actionId: action.id };
}
