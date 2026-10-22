"use client";

import { useRef, useState, useTransition } from "react";
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

export function IdeaRecorder({
  onExtracted,
}: {
  onExtracted: (transcript: string, extraction: IdeaExtraction | null) => void;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);

  async function startRecording() {
    setErrorMessage(null);
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <p className="text-sm text-gray-500">
        Parlez librement. Réécoutez avant d&apos;envoyer — rien n&apos;est enregistré avant que vous relisiez et
        confirmiez.
      </p>

      {state === "idle" ? (
        <button
          type="button"
          onClick={startRecording}
          className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          Démarrer l&apos;enregistrement
        </button>
      ) : null}

      {state === "requesting" ? (
        <p className="text-sm text-gray-500">Demande d&apos;autorisation du micro…</p>
      ) : null}

      {state === "recording" ? (
        <button
          type="button"
          onClick={stopRecording}
          className="w-fit rounded-md bg-red-600 px-4 py-2 text-sm text-white"
        >
          Arrêter
        </button>
      ) : null}

      {(state === "recorded" || state === "processing" || state === "done") && audioUrl ? (
        <div className="flex flex-col gap-2">
          <audio src={audioUrl} controls className="w-full" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Recommencer
            </button>
            {state !== "done" ? (
              <button
                type="button"
                onClick={transcribeAndClassify}
                disabled={isPending}
                className="rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                {isPending ? "Traitement…" : "Transcrire et classer"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {state === "done" ? (
        <button type="button" onClick={reset} className="w-fit text-sm text-gray-500 underline">
          Enregistrer une autre idée
        </button>
      ) : null}

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
