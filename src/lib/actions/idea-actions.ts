"use server";

import { prisma } from "@/lib/prisma";
import { isTranscriptionAvailable, transcribeAudio } from "@/lib/transcription";
import { classifyAndExtractIdea, isClassificationAvailable, type IdeaExtraction } from "@/lib/classification";
import { isNotionAvailable, upsertProjectPage } from "@/lib/notion";
import { isGoogleTasksAvailable, upsertTask } from "@/lib/google-tasks";
import { resolveDueAt, todayInParis } from "@/lib/due-date";
import { normalizeContact, type ContactInput } from "@/lib/contact";
import { IdeaCategory, IdeaStatus, IdeaPriority, type Idea } from "@prisma/client";

/**
 * Server Actions de Vocalink. Doctrine :
 * l'IA ne persiste jamais rien elle-même — `processIdea` renvoie transcript
 * + extraction pour relecture, `saveIdea` est une action séparée
 * déclenchée explicitement par l'utilisateur après édition. Ne lève jamais
 * en cas d'échec IA : l'utilisateur garde toujours la transcription brute
 * en repli.
 */

export type ProcessIdeaResult =
  | { ok: true; transcript: string; extraction: IdeaExtraction | null }
  | { ok: false; error: string };

export async function processIdea(audio: Blob): Promise<ProcessIdeaResult> {
  if (!isTranscriptionAvailable()) {
    return { ok: false, error: "Transcription indisponible — clé OPENAI_API_KEY manquante." };
  }

  const transcript = await transcribeAudio(audio);
  if (!transcript || transcript.trim().length === 0) {
    return { ok: false, error: "La transcription a échoué — réessayez." };
  }

  if (!isClassificationAvailable()) {
    return { ok: true, transcript, extraction: null };
  }

  const extraction = await classifyAndExtractIdea(transcript, todayInParis());
  return { ok: true, transcript, extraction };
}

export type SaveIdeaInput = ContactInput & {
  category: IdeaCategory;
  priority: IdeaPriority;
  title: string;
  summary: string;
  tags: string[];
  transcript: string;
  emailSubject?: string | null;
  emailBody?: string | null;
  dueDate?: string | null; // YYYY-MM-DD, fourni par l'utilisateur — toutes catégories
  dueTime?: string | null; // HH:MM
  parentId?: string | null;
};

const MAX_PARENT_CHAIN_HOPS = 50;

/**
 * Le rattachement à un projet parent est manuel (pas de garde-fou naturel
 * contre les cycles). Le sélecteur du formulaire exclut déjà l'idée
 * elle-même et ses descendants, mais on revalide ici en dernier recours :
 * si l'idée qu'on modifie se retrouve dans la chaîne de parents du
 * `parentId` proposé, on ignore silencieusement le rattachement plutôt que
 * de bloquer la sauvegarde ou de créer un cycle.
 */
async function resolveParentId(ideaId: string | null, proposedParentId: string | null | undefined): Promise<string | null> {
  if (!proposedParentId) return null;
  if (proposedParentId === ideaId) return null;
  if (!ideaId) return proposedParentId;

  let currentId: string | null = proposedParentId;
  let hops = 0;
  while (currentId && hops < MAX_PARENT_CHAIN_HOPS) {
    if (currentId === ideaId) {
      console.warn("[idea-actions] rattachement ignoré — cycle détecté", { ideaId, proposedParentId });
      return null;
    }
    const parent: { parentId: string | null } | null = await prisma.idea.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = parent?.parentId ?? null;
    hops++;
  }
  return proposedParentId;
}

/**
 * Synchronise vers Notion après une écriture réussie si la catégorie est
 * Projet — appel séparé, jamais dans la même transaction que l'écriture
 * principale : une panne Notion ne doit jamais affecter la sauvegarde de
 * l'idée elle-même (voir lib/notion.ts, ne lève jamais).
 */
async function syncNotionIfNeeded(idea: Idea): Promise<Idea> {
  if (idea.category !== IdeaCategory.PROJET || !isNotionAvailable()) return idea;

  const result = await upsertProjectPage({
    notionPageId: idea.notionPageId,
    title: idea.title,
    summary: idea.summary,
    tags: idea.tags,
    transcript: idea.transcript,
    status: idea.status,
  });
  if (!result) return idea;

  return prisma.idea.update({
    where: { id: idea.id },
    data: { notionPageId: result.pageId, notionPageUrl: result.pageUrl },
  });
}

/**
 * Synchronise vers Google Tasks après une écriture réussie — TOUTES les
 * catégories, contrairement à Notion (réservé aux Projets). Même logique de
 * découplage : appel séparé, jamais dans la même transaction que l'écriture
 * principale (voir lib/google-tasks.ts, ne lève jamais).
 */
async function syncGoogleTaskIfNeeded(idea: Idea): Promise<Idea> {
  if (!isGoogleTasksAvailable()) return idea;

  const result = await upsertTask({
    googleTaskId: idea.googleTaskId,
    title: idea.title,
    summary: idea.summary,
    category: idea.category,
    tags: idea.tags,
    contact: idea,
    dueAt: idea.dueAt,
    status: idea.status,
  });
  if (!result) return idea;

  return prisma.idea.update({
    where: { id: idea.id },
    data: { googleTaskId: result.taskId },
  });
}

export async function saveIdea(input: SaveIdeaInput): Promise<Idea> {
  const { dueAt, dueEstimated } = resolveDueAt(input);
  const parentId = await resolveParentId(null, input.parentId);

  const idea = await prisma.idea.create({
    data: {
      category: input.category,
      priority: input.priority,
      title: input.title.trim().slice(0, 200) || "Idée sans titre",
      summary: input.summary.trim(),
      tags: input.tags.filter((t) => t.trim().length > 0).join(", "),
      transcript: input.transcript,
      ...normalizeContact(input),
      emailSubject: input.category === IdeaCategory.EMAIL ? (input.emailSubject?.trim() || null) : null,
      emailBody: input.category === IdeaCategory.EMAIL ? (input.emailBody?.trim() || null) : null,
      dueAt,
      dueEstimated,
      parentId,
    },
  });

  const afterNotion = await syncNotionIfNeeded(idea);
  return syncGoogleTaskIfNeeded(afterNotion);
}

export async function updateIdeaStatus(id: string, status: IdeaStatus): Promise<void> {
  const idea = await prisma.idea.update({ where: { id }, data: { status } });
  // Reflète "Marquer traité"/"Marquer en attente" dans Google Tasks (coché/décoché).
  await syncGoogleTaskIfNeeded(idea);
}

export async function deleteIdea(id: string): Promise<void> {
  await prisma.idea.delete({ where: { id } });
}

export async function listIdeas(): Promise<Idea[]> {
  return prisma.idea.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getIdea(id: string): Promise<Idea | null> {
  return prisma.idea.findUnique({ where: { id } });
}

export type UpdateIdeaInput = Omit<SaveIdeaInput, "transcript">;

export async function updateIdea(id: string, input: UpdateIdeaInput): Promise<Idea> {
  const { dueAt, dueEstimated } = resolveDueAt(input);
  const parentId = await resolveParentId(id, input.parentId);

  const idea = await prisma.idea.update({
    where: { id },
    data: {
      category: input.category,
      priority: input.priority,
      title: input.title.trim().slice(0, 200) || "Idée sans titre",
      summary: input.summary.trim(),
      tags: input.tags.filter((t) => t.trim().length > 0).join(", "),
      ...normalizeContact(input),
      emailSubject: input.category === IdeaCategory.EMAIL ? (input.emailSubject?.trim() || null) : null,
      emailBody: input.category === IdeaCategory.EMAIL ? (input.emailBody?.trim() || null) : null,
      dueAt,
      dueEstimated,
      parentId,
    },
  });

  const afterNotion = await syncNotionIfNeeded(idea);
  return syncGoogleTaskIfNeeded(afterNotion);
}
