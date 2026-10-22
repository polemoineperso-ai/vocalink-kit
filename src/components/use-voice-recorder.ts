"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Enregistrement au micro, partagé par la dictée d'une idée et celle d'une
 * note : autorisation, niveaux pour l'onde sonore, minuterie, arrêt
 * automatique. `onRecorded` reçoit le fichier audio à l'arrêt.
 */

export type RecorderPhase = "idle" | "requesting" | "recording" | "error";

// Au-delà, le fichier devient lourd pour la transcription (limite Whisper : 25 Mo).
export const MAX_RECORDING_SECONDS = 5 * 60;

// 32 kbit/s suffisent pour la voix : 5 minutes ≈ 1,2 Mo. Sans ce réglage, le
// navigateur choisit souvent 128 kbit/s et une dictée d'une minute dépasse
// déjà 1 Mo (constaté sur iPhone).
const AUDIO_BITS_PER_SECOND = 32_000;

// Taille maximale envoyée au serveur (limite de 4 Mo dans next.config.ts,
// moins une marge pour l'enveloppe de la requête).
export const MAX_AUDIO_BYTES = 3.8 * 1024 * 1024;
// En dessous, c'est un toucher par erreur : rien n'est envoyé (ni payé).
const MIN_RECORDING_MS = 1000;

export const AUDIO_TOO_LARGE_MESSAGE = "Enregistrement trop long pour être envoyé — dictez en plusieurs fois.";

function createRecorder(stream: MediaStream): MediaRecorder {
  try {
    return new MediaRecorder(stream, { audioBitsPerSecond: AUDIO_BITS_PER_SECOND });
  } catch {
    return new MediaRecorder(stream);
  }
}

export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function useVoiceRecorder({ onRecorded, bars = 28 }: { onRecorded: (audio: Blob) => void; bars?: number }) {
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0.08));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const onRecordedRef = useRef(onRecorded);
  const startedAtRef = useRef(0);

  useEffect(() => {
    onRecordedRef.current = onRecorded;
  }, [onRecorded]);

  useEffect(() => {
    if (phase !== "recording") return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) recorderRef.current?.stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  // Libère le micro si l'on quitte l'écran en cours d'enregistrement.
  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    },
    [],
  );

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

  const start = useCallback(
    async ({ silentFailure = false }: { silentFailure?: boolean } = {}) => {
      setError(null);
      setElapsed(0);
      setLevels(Array(bars).fill(0.08));
      setPhase("requesting");
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("Ce navigateur ne permet pas l'enregistrement audio.");
        setPhase("error");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        const recorder = createRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          if (frameRef.current) cancelAnimationFrame(frameRef.current);
          audioCtxRef.current?.close().catch(() => {});
          stream.getTracks().forEach((t) => t.stop());
          setPhase("idle");
          if (Date.now() - startedAtRef.current < MIN_RECORDING_MS) {
            setError("Trop court : parlez, puis touchez pour terminer.");
            return;
          }
          onRecordedRef.current(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        };
        recorderRef.current = recorder;
        recorder.start();
        startedAtRef.current = Date.now();
        startWaveform(stream);
        setPhase("recording");
      } catch {
        if (silentFailure) {
          // Le navigateur exige un toucher : on attend simplement le bouton.
          setPhase("idle");
          return;
        }
        setError("Micro indisponible — autorisez-le dans les réglages du navigateur.");
        setPhase("error");
      }
    },
    [bars],
  );

  const stop = useCallback(() => recorderRef.current?.stop(), []);

  return { phase, error, elapsed, levels, start, stop };
}
