import Anthropic from "@anthropic-ai/sdk";

/**
 * Classification + extraction d'une idée dictée, en un seul appel LLM
 * (tool-call forcé) : détermine la catégorie (projet / email / appel-rappel
 * / idée pure) et extrait les champs pertinents pour cette catégorie.
 *
 * Ne lève jamais : un échec renvoie `null`, l'appelant retombe sur la
 * transcription brute affichée dans un champ éditable. Ne devine jamais un
 * champ absent du texte (email, date...) — consigne répétée dans le prompt
 * ET revalidée après coup, jamais fait confiance aveuglément.
 *
 * Fournisseur : Claude si ANTHROPIC_API_KEY est présente, sinon OpenAI
 * (OPENAI_API_KEY, déjà requise pour la transcription) — une installation
 * peut ainsi fonctionner avec une seule clé OpenAI. Aucune des deux :
 * renvoie `null` immédiatement, avant tout appel réseau.
 */

const MODEL = "claude-haiku-4-5-20251001";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
// Surchargeable sans redéployer le code si OpenAI retire ce modèle.
const OPENAI_MODEL = process.env.OPENAI_CLASSIFICATION_MODEL || "gpt-4.1-mini";
const MIN_TEXT_LENGTH = 10;
const MAX_TEXT_LENGTH = 4000;

const CATEGORIES = ["PROJET", "EMAIL", "APPEL_RAPPEL", "IDEE_PURE"] as const;
export type IdeaCategory = (typeof CATEGORIES)[number];

export type IdeaExtraction = {
  category: IdeaCategory;
  title: string;
  summary: string;
  tags: string[];
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactCompany: string | null;
  contactRole: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  dueDate: string | null; // YYYY-MM-DD, uniquement si explicite dans le texte
  dueTime: string | null; // HH:MM, uniquement si explicite dans le texte
};

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client ??= new Anthropic({ apiKey });
  return client;
}

export function isClassificationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

type ToolCallParams = {
  prompt: string;
  toolName: string;
  toolDescription: string;
  schema: { type: "object"; properties: unknown; required: string[] };
  maxTokens?: number;
};

function callTool(params: ToolCallParams): Promise<Record<string, unknown> | null> {
  return process.env.ANTHROPIC_API_KEY ? callClaudeTool(params) : callOpenAITool(params);
}

async function callOpenAITool(params: ToolCallParams): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: params.maxTokens ?? 800,
        tools: [
          {
            type: "function",
            function: { name: params.toolName, description: params.toolDescription, parameters: params.schema },
          },
        ],
        tool_choice: { type: "function", function: { name: params.toolName } },
        messages: [{ role: "user", content: params.prompt }],
      }),
    });
    if (!res.ok) {
      console.error("[classification] échec OpenAI", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (typeof args !== "string") return null;
    const parsed: unknown = JSON.parse(args);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch (e) {
    console.error("[classification] échec de l'appel OpenAI (tool call)", e);
    return null;
  }
}

async function callClaudeTool(params: ToolCallParams): Promise<Record<string, unknown> | null> {
  const anthropic = getClient();
  if (!anthropic) return null;
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: params.maxTokens ?? 800,
      tools: [{ name: params.toolName, description: params.toolDescription, input_schema: params.schema }],
      tool_choice: { type: "tool", name: params.toolName },
      messages: [{ role: "user", content: params.prompt }],
    });
    const block = message.content.find((b) => b.type === "tool_use");
    return block && block.type === "tool_use" ? (block.input as Record<string, unknown>) : null;
  } catch (e) {
    console.error("[classification] échec de l'appel Claude (tool use)", e);
    return null;
  }
}

export async function classifyAndExtractIdea(text: string, today: string): Promise<IdeaExtraction | null> {
  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_LENGTH) return null;

  const input = await callTool({
    toolName: "record_idea",
    toolDescription: "Enregistre la catégorie et les champs extraits de l'idée dictée.",
    maxTokens: 900,
    schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: [...CATEGORIES],
          description:
            "PROJET : une idée à développer plus tard. EMAIL : l'idée demande explicitement d'écrire/envoyer un message à quelqu'un. APPEL_RAPPEL : l'idée demande explicitement d'appeler quelqu'un ou de se rappeler de faire quelque chose à un moment donné. IDEE_PURE : une idée notée sans action de suivi identifiable. Choisis la catégorie la plus évidente ; en cas de doute, IDEE_PURE.",
        },
        title: { type: "string", description: "Titre court, moins de 80 caractères, toujours renseigné." },
        summary: { type: "string", description: "Résumé en 1 à 3 phrases, toujours renseigné." },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "0 à 5 mots-clés courts. Omettre si aucun mot-clé évident.",
        },
        contact_name: {
          type: "string",
          description: "Nom et prénom de la personne à contacter (destinataire, personne à appeler...), toutes catégories, uniquement si cité. Omettre sinon.",
        },
        contact_phone: {
          type: "string",
          description: "Numéro de téléphone du contact, uniquement s'il est dicté chiffre par chiffre ou en entier. Omettre sinon.",
        },
        contact_email: {
          type: "string",
          description: "Adresse email du contact, uniquement si elle est dictée en entier. Ne jamais construire une adresse à partir d'un nom. Omettre sinon.",
        },
        contact_company: {
          type: "string",
          description: "Société ou organisme du contact, uniquement si cité. Omettre sinon.",
        },
        contact_role: {
          type: "string",
          description: "Fonction ou poste du contact, uniquement si cité. Omettre sinon.",
        },
        email_subject: { type: "string", description: "Objet suggéré, uniquement si category=EMAIL." },
        email_body: { type: "string", description: "Corps du message suggéré, uniquement si category=EMAIL." },
        due_date: {
          type: "string",
          description: `Date ISO YYYY-MM-DD, uniquement si déductible d'une indication temporelle explicite ("demain", "lundi"...) par rapport à aujourd'hui (${today}). Ne jamais deviner — omettre si aucune indication n'est donnée.`,
        },
        due_time: {
          type: "string",
          description: "Heure au format HH:MM (24h), uniquement si explicitement mentionnée. Ne jamais deviner — omettre sinon.",
        },
      },
      required: ["category", "title", "summary"],
    },
    prompt: `Tu analyses une idée dictée à voix haute par son auteur, pour la classer et en extraire les informations utiles à son suivi.

Règle stricte : n'invente jamais une information absente du texte (contact, téléphone, email, date, heure...). Si un champ n'est pas clairement déductible, omets-le plutôt que de deviner.

Aujourd'hui : ${today}.

Texte dicté :
"""
${trimmed.slice(0, MAX_TEXT_LENGTH)}
"""`,
  });

  if (!input) return null;

  const category =
    typeof input.category === "string" && (CATEGORIES as readonly string[]).includes(input.category)
      ? (input.category as IdeaCategory)
      : "IDEE_PURE";
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 200) : "";
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  const tags = Array.isArray(input.tags)
    ? input.tags
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim())
        .slice(0, 5)
    : [];
  const optionalString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
  const contactName = optionalString(input.contact_name);
  const contactPhone = optionalString(input.contact_phone);
  const contactEmail = optionalString(input.contact_email);
  const contactCompany = optionalString(input.contact_company);
  const contactRole = optionalString(input.contact_role);
  const emailSubject = typeof input.email_subject === "string" ? input.email_subject.trim() : null;
  const emailBody = typeof input.email_body === "string" ? input.email_body.trim() : null;
  const dueDate = typeof input.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.due_date) ? input.due_date : null;
  const dueTime = typeof input.due_time === "string" && /^\d{2}:\d{2}$/.test(input.due_time) ? input.due_time : null;

  // Extraction inexploitable (ni titre ni résumé) — l'appelant retombe sur
  // la transcription brute plutôt que d'afficher un formulaire vide.
  if (!title && !summary) return null;

  return {
    category,
    title,
    summary,
    tags,
    contactName,
    contactPhone,
    contactEmail,
    contactCompany,
    contactRole,
    emailSubject,
    emailBody,
    dueDate,
    dueTime,
  };
}
