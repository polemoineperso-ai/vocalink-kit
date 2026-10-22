import { describe, it, expect } from "vitest";
import { isLikelyHallucination } from "@/lib/transcript-filter";

describe("isLikelyHallucination", () => {
  it("repère les phrases inventées sur un silence", () => {
    expect(isLikelyHallucination("« Sous-titres réalisés para la communauté d'Amara.org »")).toBe(true);
    expect(isLikelyHallucination("Sous-titrage ST' 501")).toBe(true);
    expect(isLikelyHallucination("Merci d'avoir regardé cette vidéo !")).toBe(true);
    expect(isLikelyHallucination("Merci.")).toBe(true);
    expect(isLikelyHallucination("Merci. Sous-titres réalisés par la communauté d'Amara.org")).toBe(true);
    expect(isLikelyHallucination("   ")).toBe(true);
  });

  it("garde une vraie dictée, même si elle contient « merci »", () => {
    expect(isLikelyHallucination("Rappeler Sophie Martin demain à 10 h pour le devis.")).toBe(false);
    expect(isLikelyHallucination("Écrire à Paul pour lui dire merci pour le dîner")).toBe(false);
    expect(isLikelyHallucination("Idée : une vidéo sous-titrée pour le salon")).toBe(false);
  });
});
