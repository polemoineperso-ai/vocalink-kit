import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { classifyAndExtractIdea, isClassificationAvailable } from "@/lib/classification";

// Chemin OpenAI uniquement (installation avec une seule clé) — fetch simulé,
// aucun appel réseau réel.
describe("classifyAndExtractIdea via OpenAI (sans clé Anthropic)", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function mockOpenAIResponse(args: Record<string, unknown>) {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { arguments: JSON.stringify(args) } }] } }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("est disponible avec la seule clé OpenAI", () => {
    expect(isClassificationAvailable()).toBe(true);
  });

  it("appelle OpenAI avec un tool call forcé et extrait les champs", async () => {
    const fetchMock = mockOpenAIResponse({
      category: "APPEL_RAPPEL",
      title: "Appeler Jean Dupont",
      summary: "Rappeler Jean pour le devis.",
      contact_name: "Jean Dupont",
      contact_phone: "06 12 34 56 78",
      due_date: "2026-10-23",
    });

    const result = await classifyAndExtractIdea("Rappeler Jean Dupont au 06 12 34 56 78 demain", "2026-10-22");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(init.body);
    expect(body.tool_choice).toEqual({ type: "function", function: { name: "record_idea" } });
    expect(init.headers.Authorization).toBe("Bearer sk-test");

    expect(result).toMatchObject({
      category: "APPEL_RAPPEL",
      title: "Appeler Jean Dupont",
      contactName: "Jean Dupont",
      contactPhone: "06 12 34 56 78",
      contactEmail: null,
      dueDate: "2026-10-23",
    });
  });

  it("renvoie null sans planter si OpenAI répond en erreur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("quota", { status: 429 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await classifyAndExtractIdea("Une idée assez longue pour être classée", "2026-10-22")).toBeNull();
  });
});
