import { describe, it, expect } from "vitest";
import { csvCell, exportFilename, ideasToCsv, ideasToJson, type IdeaWithNotes } from "@/lib/export";

const idea = (overrides: Partial<IdeaWithNotes> = {}): IdeaWithNotes =>
  ({
    id: "i1",
    createdAt: new Date("2026-10-23T08:30:00Z"),
    status: "PENDING",
    stage: "NEW",
    category: "APPEL_RAPPEL",
    priority: "HIGH",
    transcript: "Rappeler Sophie demain",
    title: "Rappeler Sophie",
    summary: "Pour le devis; cuisine",
    tags: "devis, cuisine",
    emailRecipient: null,
    emailSubject: null,
    emailBody: null,
    contactName: "Sophie Martin",
    contactPhone: "06 12 34 56 78",
    contactEmail: null,
    contactCompany: null,
    contactRole: null,
    dueAt: new Date("2026-10-24T08:00:00Z"),
    dueEstimated: false,
    parentId: null,
    notionPageId: null,
    notionPageUrl: null,
    googleTaskId: null,
    resurfacedAt: null,
    nextStepTitle: null,
    nextStepKind: null,
    nextStepWhy: null,
    notes: [],
    ...overrides,
  }) as IdeaWithNotes;

describe("csvCell", () => {
  it("met entre guillemets ce qui casserait le tableau", () => {
    expect(csvCell("simple")).toBe("simple");
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell('il a dit "oui"')).toBe('"il a dit ""oui"""');
    expect(csvCell("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
    expect(csvCell(null)).toBe("");
  });

  it("neutralise un texte qui ressemble à une formule Excel", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+33 6 12")).toBe("'+33 6 12");
    expect(csvCell("-5 %")).toBe("'-5 %");
  });
});

describe("ideasToCsv", () => {
  it("un tableau pour Excel en français : BOM, « ; », libellés en clair", () => {
    const csv = ideasToCsv([idea({ notes: [{ id: "n1", ideaId: "i1", text: "Elle préfère le matin", source: "voice", createdAt: new Date("2026-10-23T09:00:00Z") }] })]);
    expect(csv.startsWith("﻿Titre;Résumé;Catégorie")).toBe(true);
    const row = csv.split("\r\n")[1];
    expect(row).toContain("Rappeler Sophie;\"Pour le devis; cuisine\";Appel / Rappel;Nouvelle;À faire;Haute");
    expect(row).toContain("24/10/2026 10:00");
    expect(row).toContain("[23/10/2026 11:00] Elle préfère le matin");
  });
});

describe("ideasToJson / exportFilename", () => {
  it("sauvegarde complète datée", () => {
    const now = new Date("2026-10-23T22:30:00Z");
    const data = JSON.parse(ideasToJson([idea()], "1.0.4", now));
    expect(data).toMatchObject({ app: "Vocalink", version: "1.0.4", exportedAt: now.toISOString() });
    expect(data.ideas[0].contactName).toBe("Sophie Martin");
    // Nom de fichier à la date de Paris (déjà le 24 à 0 h 30).
    expect(exportFilename("csv", now)).toBe("vocalink-idees-2026-10-24.csv");
  });
});
