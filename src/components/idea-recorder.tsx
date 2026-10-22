"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw } from "lucide-react";
import { processIdea } from "@/lib/actions/idea-actions";
import type { IdeaExtraction } from "@/lib/classification";

/**
 * Dictée plein écran : démarre seule, onde sonore en direct, et transcription
 * dès l'arrêt (plus d'étape « réécouter ») — la relecture du TEXTE avant
 * d'enregistrer reste obligatoire (formulaire suivant).
 *
 * Ne remplit jamais le formulaire toute seule : `onExtracted` remonte le
 * résultat au parent, qui l'applique comme des valeurs par défaut éditables.
 */

type RecorderState = "idle" | "requesting" | "recording" | "processing" | "error";

const BAR_COUNT = 28;
// Au-delà, le fichier devient lourd pour la transcription (limite Whisper : 25 Mo).
const MAX_SECONDS = 5 * 60;

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function IdeaRecorder({
  onExtracted,
  autoStart = false,
}: {
  onExtracted: (transcript: string, extraction: IdeaExtraction | null) => void;
  /** Démarrage dès l'ouverture (bouton micro, raccourci « Dicter en un geste »). */
  autoStart?: boolean;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.08));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    if (state !== "recording") return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(seconds);
      if (seconds >= MAX_SECONDS) recorderRef.current?.stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [state]);

  // Libère le micro si l'on quitte l'écran en cours d'enregistrement.
  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    },
    [],
  );

  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    void startRecording({ silentFailure: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois, à l'ouverture
  }, [autoStart]);

  function startWaveform(stream: MediaStream) {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        setLevels((prev) => [...prev.slice(1), Math.max(0.08, Math.min(1, avg * 2.2))]);
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Onde sonore facultative : l'enregistrement marche sans.
    }
  }

  async function startRecording({ silentFailure = false }: { silentFailure?: boolean } = {}) {
    setErrorMessage(null);
    setElapsed(0);
    setLevels(Array(BAR_COUNT).fill(0.08));
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
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        audioCtxRef.current?.close().catch(() => {});
        stream.getTracks().forEach((t) => t.stop());
        blobRef.current = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        void transcribe();
      };
      recorderRef.current = recorder;
      recorder.start();
      startWaveform(stream);
      setState("recording");
    } catch {
      if (silentFailure) {
        // Le navigateur exige un toucher : on attend simplement le bouton.
        setState("idle");
        return;
      }
      setErrorMessage("Micro indisponible — autorisez-le dans les réglages du navigateur.");
      setState("error");
    }
  }

  async function transcribe() {
    const blob = blobRef.current;
    if (!blob) return;
    setState("processing");
    setErrorMessage(null);
    const result = await processIdea(blob);
    if (!result.ok) {
      setErrorMessage(result.error);
      setState("error");
      return;
    }
    onExtracted(result.transcript, result.extraction);
  }

  const recording = state === "recording";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <div className="min-h-14">
        {state === "processing" ? (
          <>
            <p className="text-xl font-semibold">Vocalink écrit…</p>
            <p className="mt-1 text-muted">Transcription et rangement de votre idée</p>
          </>
        ) : recording ? (
          <>
            <p className="num text-4xl font-semibold tracking-tight">{formatDuration(elapsed)}</p>
            <p className="mt-1 text-muted">Je vous écoute</p>
          </>
        ) : state === "requesting" ? (
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
        {levels.map((level, i) => (
          <span
            key={i}
            className={`w-[5px] rounded-full transition-[height] duration-75 ${
              recording ? "bg-brand" : state === "processing" ? "animate-pulse bg-brand/40" : "bg-line"
            }`}
            style={{ height: `${Math.round((state === "processing" ? 0.25 + ((i * 7) % 5) / 10 : level) * 96)}px` }}
          />
        ))}
      </div>

      {recording ? (
        <button
          type="button"
          onClick={() => recorderRef.current?.stop()}
          aria-label="Arrêter et transcrire"
          className="grid h-24 w-24 place-items-center rounded-full bg-danger shadow-xl transition active:scale-95"
        >
          <span className="h-8 w-8 rounded-lg bg-white" aria-hidden="true" />
        </button>
      ) : state === "processing" ? (
        <div className="h-24" />
      ) : (
        <button
          type="button"
          onClick={() => startRecording()}
          disabled={state === "requesting"}
          aria-label="Démarrer l'enregistrement"
          className="grid h-24 w-24 place-items-center rounded-full bg-brand text-white shadow-xl transition hover:bg-brand-hover active:scale-95 disabled:opacity-60"
        >
          <Mic size={38} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}

      <div className="min-h-16 max-w-xs">
        {recording ? <p className="text-sm text-muted">Touchez pour terminer</p> : null}
        {state === "error" && errorMessage ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-danger">{errorMessage}</p>
            {blobRef.current ? (
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
