import { describe, it, expect } from "vitest";
import { normalizeContact, hasContact, formatContactIdentity, formatContactLines } from "@/lib/contact";

const EMPTY = normalizeContact({});

describe("normalizeContact", () => {
  it("transforme champs vides ou blancs en null et retire les espaces", () => {
    expect(normalizeContact({ contactName: "  Jean Dupont ", contactPhone: "   ", contactEmail: "" })).toEqual({
      contactName: "Jean Dupont",
      contactPhone: null,
      contactEmail: null,
      contactCompany: null,
      contactRole: null,
    });
  });
});

describe("hasContact", () => {
  it("faux si aucun champ, vrai dès qu'un champ est rempli", () => {
    expect(hasContact(EMPTY)).toBe(false);
    expect(hasContact({ ...EMPTY, contactPhone: "0612345678" })).toBe(true);
  });

  it("ignore les autres champs quand on lui passe une idée entière", () => {
    const idea = { ...EMPTY, id: "abc", title: "Titre", summary: "Résumé", dueEstimated: true };
    expect(hasContact(idea)).toBe(false);
  });
});

describe("formatContactIdentity", () => {
  it("combine nom, fonction et société", () => {
    expect(
      formatContactIdentity({ ...EMPTY, contactName: "Jean Dupont", contactRole: "Directeur", contactCompany: "ACME" }),
    ).toBe("Jean Dupont — Directeur, ACME");
  });

  it("fonctionne avec une partie seulement", () => {
    expect(formatContactIdentity({ ...EMPTY, contactCompany: "ACME" })).toBe("ACME");
    expect(formatContactIdentity({ ...EMPTY, contactName: "Jean Dupont" })).toBe("Jean Dupont");
  });

  it("null si ni nom, ni fonction, ni société", () => {
    expect(formatContactIdentity({ ...EMPTY, contactPhone: "0612345678" })).toBeNull();
  });
});

describe("formatContactLines", () => {
  it("liste identité, téléphone et email présents", () => {
    expect(
      formatContactLines({ ...EMPTY, contactName: "Jean Dupont", contactPhone: "06 12 34 56 78", contactEmail: "jean@acme.fr" }),
    ).toEqual(["Contact : Jean Dupont", "Tél : 06 12 34 56 78", "Email : jean@acme.fr"]);
  });

  it("tableau vide sans contact", () => {
    expect(formatContactLines(EMPTY)).toEqual([]);
  });
});
