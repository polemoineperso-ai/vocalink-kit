import { describe, it, expect } from "vitest";
import { normalizeNextStep } from "@/lib/next-step";

describe("normalizeNextStep", () => {
  it("accepte une suggestion complète et la nettoie", () => {
    expect(normalizeNextStep({ title: "  écrire à la   mairie ", kind: "email", why: "Pour une subvention." })).toEqual({
      title: "Écrire à la mairie",
      kind: "email",
      why: "Pour une subvention.",
    });
  });

  it("type inconnu → piste de réflexion", () => {
    expect(normalizeNextStep({ title: "Lister les voisins intéressés", kind: "meeting" })?.kind).toBe("think");
  });

  it("rejette une réponse vide ou sans titre", () => {
    expect(normalizeNextStep(null)).toBeNull();
    expect(normalizeNextStep({ kind: "call" })).toBeNull();
    expect(normalizeNextStep({ title: "   " })).toBeNull();
  });
});
