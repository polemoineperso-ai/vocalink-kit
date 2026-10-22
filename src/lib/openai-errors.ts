/**
 * Traduit une réponse d'erreur d'OpenAI en cause compréhensible, et en
 * message qui dit quoi faire. Partagé par la transcription, la
 * classification et le test « Tout fonctionne ? » des Réglages.
 *
 * « model » (modèle retiré ou inconnu) déclenche le plan B : l'appelant
 * essaie le modèle suivant de sa liste (voir modelChain).
 */

export type OpenAIFailure = "key" | "quota" | "busy" | "model" | "network" | "other" | "silence";

export function classifyOpenAIError(status: number, body: string): OpenAIFailure {
  let code = "";
  let message = "";
  try {
    const error = (JSON.parse(body) as { error?: { code?: unknown; type?: unknown; message?: unknown } }).error;
    code = `${error?.code ?? ""} ${error?.type ?? ""}`;
    message = String(error?.message ?? "");
  } catch {
    // Corps illisible : on se fie au code HTTP.
  }
  if (status === 401) return "key";
  if (/insufficient_quota|billing_hard_limit/.test(code)) return "quota";
  if (status === 429 || status >= 500) return "busy";
  if (/model_not_found/.test(code)) return "model";
  if ((status === 400 || status === 404) && /model/i.test(message) && /(not exist|not found|deprecated|not supported|no longer)/i.test(message)) {
    return "model";
  }
  return "other";
}

const MESSAGES: Record<OpenAIFailure, string> = {
  key: "Clé OpenAI refusée : elle a expiré ou a été supprimée. Remplacez-la (guide, « Changer la clé »).",
  quota: "Crédit OpenAI épuisé ou expiré. Rechargez-le sur platform.openai.com, rubrique Billing.",
  busy: "OpenAI est momentanément surchargé — réessayez dans un instant.",
  network: "OpenAI est injoignable — vérifiez la connexion, puis réessayez.",
  model: "La transcription a échoué — réessayez. Si ça continue, signalez-le (Réglages).",
  other: "La transcription a échoué — réessayez. Si ça continue, signalez-le (Réglages).",
  // Pas une erreur d'OpenAI : rien d'audible dans l'enregistrement (voir transcript-filter.ts).
  silence: "Rien d'audible dans l'enregistrement — parlez près du micro, puis réessayez.",
};

export function openAIFailureMessage(failure: OpenAIFailure): string {
  return MESSAGES[failure];
}

/** Modèle choisi dans les réglages (s'il y en a un), puis les modèles de repli, sans doublon. */
export function modelChain(configured: string | undefined, fallbacks: string[]): string[] {
  return [...new Set([configured?.trim(), ...fallbacks].filter((m): m is string => Boolean(m)))];
}
