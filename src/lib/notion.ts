import { Client } from "@notionhq/client";

/**
 * Synchronisation Notion pour les idées catégorisées Projet — même doctrine
 * que transcription.ts/classification.ts : ne lève jamais, `null` en
 * repli si NOTION_API_KEY/NOTION_DATABASE_ID sont absentes ou si l'appel
 * échoue (permissions, réseau, base non partagée avec l'intégration...).
 * L'idée se sauvegarde toujours normalement même si cette synchro échoue.
 *
 * Mise à jour en place (pas de création à chaque fois) : si l'idée a déjà
 * un notionPageId, on met à jour la page existante plutôt que d'en créer
 * une nouvelle — une correction faite après coup sur l'idée (titre, résumé
 * mal extrait...) doit se refléter dans Notion, pas y créer un doublon figé.
 */

const NOTION_RICH_TEXT_CHUNK = 2000; // limite API Notion par bloc rich_text

let client: Client | null = null;
function getClient(): Client | null {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return null;
  client ??= new Client({ auth: apiKey });
  return client;
}

export function isNotionAvailable(): boolean {
  return Boolean(process.env.NOTION_API_KEY) && Boolean(process.env.NOTION_DATABASE_ID);
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

export type NotionSyncInput = {
  notionPageId: string | null;
  title: string;
  summary: string;
  tags: string; // comma-separated, tel que stocké
  transcript: string;
  status: "PENDING" | "ACTIONED";
};

export type NotionSyncResult = { pageId: string; pageUrl: string } | null;

export async function upsertProjectPage(idea: NotionSyncInput): Promise<NotionSyncResult> {
  const notion = getClient();
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!notion || !databaseId) return null;

  const tags = idea.tags
    ? idea.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const properties = {
    Name: { title: [{ text: { content: idea.title || "Idée sans titre" } }] },
    Résumé: { rich_text: [{ text: { content: idea.summary.slice(0, NOTION_RICH_TEXT_CHUNK) } }] },
    Tags: { multi_select: tags.map((t) => ({ name: t.slice(0, 100) })) },
    Statut: { select: { name: idea.status } },
  };

  try {
    if (idea.notionPageId) {
      const page = await notion.pages.update({ page_id: idea.notionPageId, properties });
      const url = "url" in page ? (page.url as string) : `https://notion.so/${idea.notionPageId.replace(/-/g, "")}`;
      return { pageId: idea.notionPageId, pageUrl: url };
    }

    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      children: chunkText(idea.transcript, NOTION_RICH_TEXT_CHUNK).map((chunk) => ({
        object: "block" as const,
        type: "paragraph" as const,
        paragraph: { rich_text: [{ text: { content: chunk } }] },
      })),
    });
    const url = "url" in page ? (page.url as string) : null;
    if (!url) return null;
    return { pageId: page.id, pageUrl: url };
  } catch (e) {
    console.error("[notion] échec de la synchronisation", e);
    return null;
  }
}
