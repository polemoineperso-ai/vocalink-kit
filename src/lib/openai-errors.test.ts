import { describe, it, expect } from "vitest";
import { classifyOpenAIError, modelChain, openAIFailureMessage } from "@/lib/openai-errors";

const body = (code: string, message = "", type = "") => JSON.stringify({ error: { code, message, type } });

describe("classifyOpenAIError", () => {
  it("clé refusée", () => {
    expect(classifyOpenAIError(401, body("invalid_api_key", "Incorrect API key provided"))).toBe("key");
  });

  it("crédit épuisé, distinct d'une simple surcharge", () => {
    expect(classifyOpenAIError(429, body("insufficient_quota", "You exceeded your current quota", "insufficient_quota"))).toBe("quota");
    expect(classifyOpenAIError(429, body("rate_limit_exceeded", "Rate limit reached"))).toBe("busy");
    expect(classifyOpenAIError(503, "Service Unavailable")).toBe("busy");
  });

  it("modèle retiré ou inconnu : déclenche le plan B", () => {
    expect(classifyOpenAIError(404, body("model_not_found", "The model `whisper-1` does not exist"))).toBe("model");
    expect(classifyOpenAIError(400, body("", "The model gpt-4.1-mini has been deprecated"))).toBe("model");
  });

  it("autre erreur", () => {
    expect(classifyOpenAIError(400, body("invalid_request_error", "Invalid file format"))).toBe("other");
    expect(classifyOpenAIError(400, "pas du JSON")).toBe("other");
  });
});

describe("openAIFailureMessage", () => {
  it("dit quoi faire selon la cause", () => {
    expect(openAIFailureMessage("quota")).toContain("Rechargez");
    expect(openAIFailureMessage("key")).toContain("Changer la clé");
  });
});

describe("modelChain", () => {
  it("le modèle choisi passe en premier, sans doublon ni vide", () => {
    expect(modelChain("gpt-x", ["a", "b"])).toEqual(["gpt-x", "a", "b"]);
    expect(modelChain("a", ["a", "b"])).toEqual(["a", "b"]);
    expect(modelChain(undefined, ["a", "b"])).toEqual(["a", "b"]);
    expect(modelChain("  ", ["a"])).toEqual(["a"]);
  });
});
