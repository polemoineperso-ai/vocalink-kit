/**
 * Transcription audio (speech-to-text) via l'API OpenAI.
 *
 * Nécessite OPENAI_API_KEY (voir .env.example) — absente, la fonction
 * renvoie un échec immédiatement, avant tout appel réseau. Ne lève jamais :
 * un échec de transcription est une dégradation gérée par l'appelant,
 * jamais un crash du formulaire. La cause (clé, crédit, surcharge…) est
 * renvoyée pour afficher un message qui dit quoi faire.
 *
 * Plan B des modèles : si OpenAI retire un modèle, le suivant de la liste
 * prend le relais. OPENAI_TRANSCRIPTION_MODEL permet d'en imposer un autre
 * sans toucher au code.
 *
 * L'audio n'est jamais stocké — reçu en mémoire depuis le navigateur,
 * envoyé à l'API, puis oublié dès la réponse obtenue.
 */

import { classifyOpenAIError, modelChain, type OpenAIFailure } from "@/lib/openai-errors";
import { isLikelyHallucination } from "@/lib/transcript-filter";

const TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";
const FALLBACK_MODELS = ["whisper-1", "gpt-4o-mini-transcribe"];

export type TranscriptionResult = { ok: true; text: string } | { ok: false; failure: OpenAIFailure };

export function isTranscriptionAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function transcribeAudio(audio: Blob, filename = "idea.webm"): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, failure: "key" };

  let failure: OpenAIFailure = "other";
  for (const model of modelChain(process.env.OPENAI_TRANSCRIPTION_MODEL, FALLBACK_MODELS)) {
    try {
      const form = new FormData();
      form.append("file", audio, filename);
      form.append("model", model);
      form.append("language", "fr");

      const res = await fetch(TRANSCRIPTION_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[transcription] échec OpenAI", model, res.status, body);
        failure = classifyOpenAIError(res.status, body);
        if (failure === "model") continue;
        return { ok: false, failure };
      }
      const data = (await res.json()) as { text?: unknown };
      const text = typeof data.text === "string" ? data.text.trim() : "";
      // Silence ou bruit : Whisper renvoie du vide ou une phrase inventée.
      return isLikelyHallucination(text) ? { ok: false, failure: "silence" } : { ok: true, text };
    } catch (e) {
      console.error("[transcription] OpenAI injoignable", model, e);
      return { ok: false, failure: "network" };
    }
  }
  return { ok: false, failure };
}
