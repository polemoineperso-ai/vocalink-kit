import type { IdeaCategory } from "@prisma/client";
import { formatContactLines, type ContactFields } from "@/lib/contact";

/**
 * Synchronisation Google Tasks — TOUTES les idées, quelle que soit leur
 * catégorie (contrairement à Notion, réservé aux Projets). Même doctrine
 * que notion.ts/transcription.ts : ne lève jamais, `null` en repli si une
 * des trois variables manque ou si l'appel échoue. La sauvegarde de l'idée
 * n'est jamais bloquée par une panne Google.
 *
 * Contrairement à Notion (jeton d'intégration statique), Google Tasks
 * exige OAuth — une autorisation unique (scripts/get-google-refresh-token.mjs,
 * lancée une fois à la main) produit un refresh token stocké comme n'importe
 * quel autre secret. L'app ne fait ensuite que des échanges silencieux
 * refresh→access token, jamais de connexion interactive.
 */

const TASKS_API = "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks";
const NOTES_MAX_LENGTH = 8000; // limite API ~8192 octets, marge de sécurité

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  PROJET: "Projet",
  EMAIL: "Email",
  APPEL_RAPPEL: "Appel / Rappel",
  IDEE_PURE: "Idée pure",
};

export function isGoogleTasksAvailable(): boolean {
  return (
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
    Boolean(process.env.GOOGLE_REFRESH_TOKEN)
  );
}

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      console.error("[google-tasks] échec du rafraîchissement du token", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { access_token?: unknown };
    return typeof data.access_token === "string" ? data.access_token : null;
  } catch (e) {
    console.error("[google-tasks] erreur réseau lors du rafraîchissement du token", e);
    return null;
  }
}

function buildNotes(idea: { summary: string; category: IdeaCategory; tags: string; contact: ContactFields }): string {
  const lines = [`Catégorie : ${CATEGORY_LABELS[idea.category]}`];
  if (idea.tags) lines.push(`Tags : ${idea.tags}`);
  lines.push(...formatContactLines(idea.contact));
  lines.push("", idea.summary);
  return lines.join("\n").slice(0, NOTES_MAX_LENGTH);
}

export type GoogleTaskSyncInput = {
  googleTaskId: string | null;
  title: string;
  summary: string;
  category: IdeaCategory;
  tags: string;
  contact: ContactFields;
  dueAt: Date | null;
  status: "PENDING" | "ACTIONED";
};

export async function upsertTask(idea: GoogleTaskSyncInput): Promise<{ taskId: string } | null> {
  if (!isGoogleTasksAvailable()) return null;
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const body: Record<string, unknown> = {
    title: idea.title || "Idée sans titre",
    notes: buildNotes(idea),
    status: idea.status === "ACTIONED" ? "completed" : "needsAction",
    completed: idea.status === "ACTIONED" ? new Date().toISOString() : null,
  };
  // L'API Google Tasks ne conserve que la date, pas l'heure — connu et
  // accepté (l'heure reste visible dans Vocalink et dans le lien calendrier
  // pour Appel/Rappel).
  if (idea.dueAt) body.due = idea.dueAt.toISOString();

  const url = idea.googleTaskId ? `${TASKS_API}/${idea.googleTaskId}` : TASKS_API;
  const method = idea.googleTaskId ? "PATCH" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[google-tasks] échec de la synchronisation", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { id?: unknown };
    return typeof data.id === "string" ? { taskId: data.id } : null;
  } catch (e) {
    console.error("[google-tasks] erreur réseau lors de la synchronisation", e);
    return null;
  }
}
