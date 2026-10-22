"use server";

import { prisma } from "@/lib/prisma";
import { classifyOpenAIError, modelChain, openAIFailureMessage, type OpenAIFailure } from "@/lib/openai-errors";

/**
 * « Tout fonctionne ? » (Réglages) : vérifie en quelques secondes les deux
 * choses dont dépend Vocalink — sa base de données et la clé OpenAI (avec
 * son crédit). Le test OpenAI est une vraie demande minuscule (quelques
 * mots, coût négligeable) : c'est la seule façon de savoir si le crédit est
 * épuisé, OpenAI n'offrant pas de consultation du solde par la clé.
 */

export type HealthItem = { label: string; ok: boolean; detail: string };

const CHAT_URL = "https://api.openai.com/v1/chat/completions";
const CHECK_MODELS = ["gpt-4.1-mini", "gpt-4o-mini", "gpt-5-mini"];

async function checkDatabase(): Promise<HealthItem> {
  try {
    const ideas = await prisma.idea.count();
    return { label: "Base de données", ok: true, detail: `Joignable · ${ideas} idée${ideas > 1 ? "s" : ""}` };
  } catch (e) {
    console.error("[santé] base injoignable", e);
    return { label: "Base de données", ok: false, detail: "Injoignable — réessayez dans une minute. Si ça continue, signalez-le." };
  }
}

async function checkOpenAI(): Promise<HealthItem> {
  const label = "Clé et crédit OpenAI";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { label, ok: false, detail: "Aucune clé OpenAI configurée dans Vercel (OPENAI_API_KEY)." };

  let failure: OpenAIFailure = "other";
  for (const model of modelChain(process.env.OPENAI_CLASSIFICATION_MODEL, CHECK_MODELS)) {
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "Réponds OK." }], max_completion_tokens: 16 }),
      });
      if (res.ok) return { label, ok: true, detail: "Clé valide, crédit disponible" };
      const body = await res.text().catch(() => "");
      failure = classifyOpenAIError(res.status, body);
      if (failure !== "model") break;
    } catch {
      failure = "network";
      break;
    }
  }
  const detail = failure === "model" || failure === "other" ? "Réponse inattendue d'OpenAI. Si ça continue, signalez-le." : openAIFailureMessage(failure);
  return { label, ok: false, detail };
}

export async function checkHealth(): Promise<HealthItem[]> {
  return Promise.all([checkDatabase(), checkOpenAI()]);
}
