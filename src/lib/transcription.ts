/**
 * Transcription audio (speech-to-text) via l'API Whisper (OpenAI).
 *
 * Nécessite OPENAI_API_KEY (voir .env.example) — absente, la fonction
 * renvoie `null` immédiatement, avant tout appel réseau. Ne lève jamais :
 * un échec de transcription est une dégradation gérée par l'appelant,
 * jamais un crash du formulaire.
 *
 * L'audio n'est jamais stocké — reçu en mémoire depuis le navigateur,
 * envoyé à l'API, puis oublié dès la réponse obtenue.
 */

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const MODEL = "whisper-1";

export function isTranscriptionAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function transcribeAudio(audio: Blob, filename = "idea.webm"): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const form = new FormData();
    form.append("file", audio, filename);
    form.append("model", MODEL);
    form.append("language", "fr");

    const res = await fetch(WHISPER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      console.error("[transcription] échec Whisper", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { text?: unknown };
    return typeof data.text === "string" ? data.text : null;
  } catch (e) {
    console.error("[transcription] erreur appel Whisper", e);
    return null;
  }
}
