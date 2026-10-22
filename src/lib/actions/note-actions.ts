"use server";

import { prisma } from "@/lib/prisma";
import { isTranscriptionAvailable, transcribeAudio } from "@/lib/transcription";
import { openAIFailureMessage } from "@/lib/openai-errors";
import { cleanNoteText } from "@/lib/note-text";
import { isAction, statusForStage } from "@/lib/idea-kind";
import type { IdeaNote } from "@prisma/client";

/**
 * Notes ajoutées à une idée (dictées ou écrites). Comme pour les idées,
 * rien n'est inventé : une note dictée est la transcription de la voix.
 * Ajouter une note à une idée « Nouvelle » la fait passer « En réflexion ».
 */

// discard : l'enregistrement ne vaut pas d'être renvoyé (rien d'audible).
export type AddNoteResult = { ok: true; note: IdeaNote; advanced: boolean } | { ok: false; error: string; discard?: boolean };

async function createNote(ideaId: string, rawText: string, source: "voice" | "text"): Promise<AddNoteResult> {
  const text = cleanNoteText(rawText);
  if (!text) return { ok: false, error: "La note est vide." };

  const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { stage: true, category: true } });
  if (!idea) return { ok: false, error: "Idée introuvable." };

  const note = await prisma.ideaNote.create({ data: { ideaId, text, source } });
  const advanced = !isAction(idea.category) && idea.stage === "NEW";
  if (advanced) {
    await prisma.idea.update({ where: { id: ideaId }, data: { stage: "THINKING", status: statusForStage("THINKING") } });
  }
  return { ok: true, note, advanced };
}

export async function addVoiceNote(ideaId: string, audio: Blob): Promise<AddNoteResult> {
  if (!isTranscriptionAvailable()) return { ok: false, error: "Transcription indisponible — clé OPENAI_API_KEY manquante." };
  const transcription = await transcribeAudio(audio);
  if (!transcription.ok) {
    return { ok: false, error: openAIFailureMessage(transcription.failure), discard: transcription.failure === "silence" };
  }
  return createNote(ideaId, transcription.text, "voice");
}

export async function addTextNote(ideaId: string, text: string): Promise<AddNoteResult> {
  return createNote(ideaId, text, "text");
}

export type DeletedNote = { ideaId: string; text: string; source: string; createdAt: string };

/** Supprime une note et renvoie de quoi la restaurer (« Annuler »). */
export async function deleteNote(id: string): Promise<DeletedNote | null> {
  const note = await prisma.ideaNote.findUnique({ where: { id } });
  if (!note) return null;
  await prisma.ideaNote.delete({ where: { id } });
  return { ideaId: note.ideaId, text: note.text, source: note.source, createdAt: note.createdAt.toISOString() };
}

export async function restoreNote(note: DeletedNote): Promise<void> {
  await prisma.ideaNote.create({
    data: { ideaId: note.ideaId, text: note.text, source: note.source, createdAt: new Date(note.createdAt) },
  });
}
