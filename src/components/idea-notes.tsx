"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic, PenLine, RotateCcw, X } from "lucide-react";
import { addTextNote, addVoiceNote, deleteNote, restoreNote, type AddNoteResult } from "@/lib/actions/note-actions";
import { formatAge } from "@/lib/idea-sections";
import { AUDIO_TOO_LARGE_MESSAGE, formatDuration, MAX_AUDIO_BYTES, useVoiceRecorder } from "@/components/use-voice-recorder";
import { useToast } from "@/components/toast";

/**
 * Notes d'une idée : elle s'enrichit au fil des jours, à la voix ou par
 * écrit, sans toucher à son résumé d'origine.
 */

export type NoteView = { id: string; text: string; source: string; createdAt: string };

function noteTime(iso: string): string {
  const time = new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
  return `${formatAge(iso)} · ${time}`;
}

export function IdeaNotes({ ideaId, notes }: { ideaId: string; notes: NoteView[] }) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"idle" | "writing" | "transcribing">("idle");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Dernier enregistrement, gardé tant que la note n'est pas enregistrée :
  // « Réessayer » le renvoie sans avoir à redicter.
  const lastAudioRef = useRef<Blob | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  function afterAdd(result: AddNoteResult) {
    if (!result.ok) {
      setError(result.error);
      setMode("idle");
      return;
    }
    setError(null);
    setCanRetry(false);
    lastAudioRef.current = null;
    setDraft("");
    setMode("idle");
    router.refresh();
    toast(result.advanced ? "Note ajoutée · l'idée passe « En réflexion »" : "Note ajoutée");
  }

  const recorder = useVoiceRecorder({
    bars: 22,
    onRecorded: (audio) => {
      lastAudioRef.current = audio;
      sendVoiceNote();
    },
  });

  function sendVoiceNote() {
    const audio = lastAudioRef.current;
    if (!audio) return;
    if (audio.size > MAX_AUDIO_BYTES) {
      lastAudioRef.current = null;
      setCanRetry(false);
      setError(AUDIO_TOO_LARGE_MESSAGE);
      return;
    }
    setError(null);
    setMode("transcribing");
    startTransition(async () => {
      try {
        const result = await addVoiceNote(ideaId, audio);
        setCanRetry(!result.ok && !result.discard);
        afterAdd(result);
      } catch {
        // Réseau coupé, serveur injoignable… : on garde l'audio pour réessayer.
        setCanRetry(true);
        setError("Envoi impossible — vérifiez la connexion puis réessayez.");
        setMode("idle");
      }
    });
  }

  function saveText() {
    setCanRetry(false);
    startTransition(async () => afterAdd(await addTextNote(ideaId, draft)));
  }

  function remove(id: string) {
    startTransition(async () => {
      const deleted = await deleteNote(id);
      router.refresh();
      if (deleted) {
        toast("Note supprimée", async () => {
          await restoreNote(deleted);
          router.refresh();
        });
      }
    });
  }

  const recording = recorder.phase === "recording";

  return (
    <section>
      <h2 className="group-label">
        Notes {notes.length ? <span className="font-normal text-faint">{notes.length}</span> : null}
      </h2>

      {notes.length ? (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="group/note relative rounded-2xl bg-surface p-3.5 pr-10">
              <p className="flex items-center gap-1.5 text-xs text-faint">
                {note.source === "voice" ? <Mic size={12} aria-hidden="true" /> : <PenLine size={12} aria-hidden="true" />}
                {noteTime(note.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{note.text}</p>
              <button
                type="button"
                onClick={() => remove(note.id)}
                disabled={isPending}
                aria-label="Supprimer la note"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-subtle hover:text-ink"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2">
        {recording ? (
          <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-3">
            <div className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden="true">
              {recorder.levels.map((level, i) => (
                <span key={i} className="w-[3px] rounded-full bg-brand transition-[height] duration-75" style={{ height: `${Math.round(level * 32)}px` }} />
              ))}
            </div>
            <span className="num text-sm font-semibold text-brand-ink">{formatDuration(recorder.elapsed)}</span>
            <button type="button" onClick={recorder.stop} className="btn btn-primary px-4 py-2 text-sm">
              Terminer
            </button>
          </div>
        ) : mode === "transcribing" ? (
          <div className="flex items-center gap-2 rounded-2xl bg-surface p-4 text-sm text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
            Vocalink écrit la note…
          </div>
        ) : mode === "writing" ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-surface p-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Une précision, une piste, un contact…"
              className="!border-transparent !bg-subtle"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMode("idle")} className="btn btn-ghost">
                Annuler
              </button>
              <button type="button" onClick={saveText} disabled={isPending || !draft.trim()} className="btn btn-primary px-4 py-2 text-sm">
                Ajouter
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => recorder.start()}
              disabled={recorder.phase === "requesting"}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 py-3.5 font-semibold text-brand transition active:scale-[0.99]"
            >
              <Mic size={18} aria-hidden="true" />
              {recorder.phase === "requesting" ? "Ouverture du micro…" : "Ajouter une note à la voix"}
            </button>
            <button
              type="button"
              onClick={() => setMode("writing")}
              aria-label="Écrire une note"
              className="grid w-14 place-items-center rounded-2xl bg-surface text-muted transition active:scale-95"
            >
              <PenLine size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        {recorder.error ?? error ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm text-danger">{recorder.error ?? error}</p>
            {error && canRetry && mode === "idle" ? (
              <button type="button" onClick={sendVoiceNote} disabled={isPending} className="btn btn-secondary px-3 py-1.5 text-sm">
                <RotateCcw size={14} aria-hidden="true" />
                Réessayer
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
