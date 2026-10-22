"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { processIdea } from "@/lib/actions/idea-actions";
import type { IdeaExtraction } from "@/lib/classification";

/**
 * Enregistrement + transcription + classification d'une idée. Bouton
 * classique avec relecture audio avant envoi, pas de dictée continue en
 * direct (Whisper est une API fichier complet, pas du streaming).
 *
 * Ne remplit jamais le formulaire toute seule : `onExtracted` remonte le
 * résultat au parent, qui l'applique comme des valeurs par défaut
 * éditables — la relecture humaine avant "Enregistrer" reste obligatoire.
 */

type RecorderState = "idle" | "requesting" | "recording" | "recorded" | "processing" | "done" | "error";

function MicIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function IdeaRecorder({
  onExtracted,
}: {
  onExtracted: (transcript: string, extraction: IdeaExtraction | null) => void;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPending, startTransition] = useTransition();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (state !== "recording") return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [state]);

  async function startRecording() {
    setErrorMessage(null);
    setElapsed(0);
    setState("requesting");
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErrorMessage("Ce navigateur ne permet pas l'enregistrement audio.");
      setState("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      setErrorMessage("Micro indisponible — vérifiez l'autorisation donnée au navigateur.");
      setState("error");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioBlobRef.current = null;
    setAudioUrl(null);
    setErrorMessage(null);
    setState("idle");
  }

  function transcribeAndClassify() {
    const blob = audioBlobRef.current;
    if (!blob) return;
    setState("processing");
    setErrorMessage(null);
    startTransition(async () => {
      const result = await processIdea(blob);
      if (!result.ok) {
        setErrorMessage(result.error);
        setState("error");
        return;
      }
      onExtracted(result.transcript, result.extraction);
      setState("done");
    });
  }

  const showBigButton = state === "idle" || state === "requesting" || state === "recording" || state === "error";

  return (
    <div className="flex flex-col items-center gap-4">
      {showBigButton ? (
        <>
          <div className="relative grid place-items-center py-2">
            {state === "recording" ? (
              <span className="absolute h-44 w-44 animate-ping rounded-full bg-danger-soft" aria-hidden="true" />
            ) : (
              <span className="absolute h-44 w-44 rounded-full bg-brand-soft" aria-hidden="true" />
            )}
            {state === "recording" ? (
              <button
                type="button"
                onClick={stopRecording}
                aria-label="Arrêter"
                className="relative grid h-32 w-32 place-items-center rounded-full bg-danger text-white shadow-lg transition active:scale-95"
              >
                <span className="h-9 w-9 rounded-lg bg-white" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={state === "requesting"}
                aria-label="Démarrer l'enregistrement"
                className="relative grid h-32 w-32 place-items-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-hover active:scale-95 disabled:opacity-60"
              >
                <MicIcon />
              </button>
            )}
          </div>
          <p className="text-center text-base font-medium">
            {state === "recording" ? (
              <>
                <span className="tabular-nums">{formatDuration(elapsed)}</span> · Touchez pour arrêter
              </>
            ) : state === "requesting" ? (
              "Autorisation du micro…"
            ) : (
              "Touchez et parlez"
            )}
          </p>
          {state === "idle" ? (
            <p className="max-w-xs text-center text-sm text-muted">
              Vous pourrez réécouter et tout relire avant d&apos;enregistrer.
            </p>
          ) : null}
        </>
      ) : null}

      {(state === "recorded" || state === "processing" || state === "done") && audioUrl ? (
        <div className="card flex w-full flex-col gap-4 p-5">
          <p className="section-title">Votre enregistrement</p>
          <audio src={audioUrl} controls className="w-full" />
          {state === "processing" ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
              Vocalink écoute et range votre idée…
            </p>
          ) : null}
          {state === "recorded" ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={transcribeAndClassify} disabled={isPending} className="btn btn-primary flex-1">
                Transcrire et classer
              </button>
              <button type="button" onClick={reset} disabled={isPending} className="btn btn-secondary">
                Recommencer
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="w-full rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{errorMessage}</p>
      ) : null}
    </div>
  );
}
