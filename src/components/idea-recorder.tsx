"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw } from "lucide-react";
import { processIdea } from "@/lib/actions/idea-actions";
import { AUDIO_TOO_LARGE_MESSAGE, formatDuration, MAX_AUDIO_BYTES, useVoiceRecorder } from "@/components/use-voice-recorder";
import type { IdeaExtraction } from "@/lib/classification";
import { clearPendingAudio, loadPendingAudio, savePendingAudio } from "@/lib/pending-audio";

/**
 * Dictée plein écran : démarre seule, onde sonore en direct, et transcription
 * dès l'arrêt (plus d'étape « réécouter ») — la relecture du TEXTE avant
 * d'enregistrer reste obligatoire (formulaire suivant).
 *
 * Ne remplit jamais le formulaire toute seule : `onExtracted` remonte le
 * résultat au parent, qui l'applique comme des valeurs par défaut éditables.
 */
export function IdeaRecorder({
  onExtracted,
  autoStart = false,
  resumePending = false,
}: {
  onExtracted: (transcript: string, extraction: IdeaExtraction | null) => void;
  /** Démarrage dès l'ouverture (bouton micro, raccourci « Dicter en un geste »). */
  autoStart?: boolean;
  /** Reprend la dictée restée en attente sur le téléphone (carte de l'accueil). */
  resumePending?: boolean;
}) {
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  // « Réessayer » n'a de sens que si l'enregistrement peut être renvoyé tel quel.
  const [canRetry, setCanRetry] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const autoStarted = useRef(false);
  const resumed = useRef(false);

  async function transcribe() {
    const blob = blobRef.current;
    if (!blob) return;
    if (blob.size > MAX_AUDIO_BYTES) {
      blobRef.current = null;
      void clearPendingAudio();
      setCanRetry(false);
      setProcessError(AUDIO_TOO_LARGE_MESSAGE);
      return;
    }
    setProcessing(true);
    setProcessError(null);
    let result: Awaited<ReturnType<typeof processIdea>>;
    try {
      result = await processIdea(blob);
    } catch {
      // Réseau coupé, serveur injoignable… : l'audio reste là pour réessayer.
      result = { ok: false, error: "Envoi impossible — vérifiez la connexion puis réessayez." };
    }
    setProcessing(false);
    if (!result.ok) {
      if (result.discard) {
        // Rien d'audible : inutile de le garder ni de le renvoyer.
        blobRef.current = null;
        void clearPendingAudio();
      }
      setCanRetry(!result.discard);
      setProcessError(result.error);
      return;
    }
    void clearPendingAudio();
    onExtracted(result.transcript, result.extraction);
  }

  const recorder = useVoiceRecorder({
    onRecorded: (audio) => {
      blobRef.current = audio;
      // Gardée sur le téléphone jusqu'à la transcription : rien n'est perdu si l'envoi échoue.
      void savePendingAudio(audio);
      void transcribe();
    },
  });

  // Dernière version de transcribe, pour la reprise ci-dessous (qui ne doit tourner qu'une fois).
  const transcribeRef = useRef(transcribe);
  useEffect(() => {
    transcribeRef.current = transcribe;
  });

  useEffect(() => {
    if (!resumePending || resumed.current) return;
    resumed.current = true;
    void loadPendingAudio().then((pending) => {
      if (!pending) return;
      blobRef.current = pending.blob;
      void transcribeRef.current();
    });
  }, [resumePending]);

  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    void recorder.start({ silentFailure: true });
  }, [autoStart, recorder]);

  const recording = recorder.phase === "recording";
  // L'erreur du dernier enregistrement (trop court, micro) passe avant celle d'un envoi précédent.
  const errorMessage = recorder.error ?? processError;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <div className="min-h-14">
        {processing ? (
          <>
            <p className="text-xl font-semibold">Vocalink écrit…</p>
            <p className="mt-1 text-muted">Transcription et rangement de votre idée</p>
          </>
        ) : recording ? (
          <>
            <p className="num text-4xl font-semibold tracking-tight">{formatDuration(recorder.elapsed)}</p>
            <p className="mt-1 text-muted">Je vous écoute</p>
          </>
        ) : recorder.phase === "requesting" ? (
          <p className="text-xl font-semibold">Ouverture du micro…</p>
        ) : (
          <>
            <p className="text-xl font-semibold">Dites votre idée</p>
            <p className="mt-1 text-muted">Comme elle vient : Vocalink range tout.</p>
          </>
        )}
      </div>

      {/* Onde sonore : barres qui suivent le niveau de la voix. */}
      <div className="flex h-24 items-center gap-[3px]" aria-hidden="true">
        {recorder.levels.map((level, i) => (
          <span
            key={i}
            className={`w-[5px] rounded-full transition-[height] duration-75 ${
              recording ? "bg-brand" : processing ? "animate-pulse bg-brand/40" : "bg-line"
            }`}
            style={{ height: `${Math.round((processing ? 0.25 + ((i * 7) % 5) / 10 : level) * 96)}px` }}
          />
        ))}
      </div>

      {recording ? (
        <button
          type="button"
          onClick={recorder.stop}
          aria-label="Arrêter et transcrire"
          className="grid h-24 w-24 place-items-center rounded-full bg-danger shadow-xl transition active:scale-95"
        >
          <span className="h-8 w-8 rounded-lg bg-white" aria-hidden="true" />
        </button>
      ) : processing ? (
        <div className="h-24" />
      ) : (
        <button
          type="button"
          onClick={() => recorder.start()}
          disabled={recorder.phase === "requesting"}
          aria-label="Démarrer l'enregistrement"
          className="grid h-24 w-24 place-items-center rounded-full bg-brand text-white shadow-xl transition hover:bg-brand-hover active:scale-95 disabled:opacity-60"
        >
          <Mic size={38} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}

      <div className="min-h-16 max-w-xs">
        {recording ? <p className="text-sm text-muted">Touchez pour terminer</p> : null}
        {!recording && !processing && errorMessage ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-danger">{errorMessage}</p>
            {processError && canRetry ? (
              <button type="button" onClick={() => void transcribe()} className="btn btn-secondary">
                <RotateCcw size={16} aria-hidden="true" />
                Réessayer la transcription
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
