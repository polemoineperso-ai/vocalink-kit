import { describe, it, expect } from "vitest";
import { filterIdeas } from "@/lib/idea-filter";
import type { Idea } from "@prisma/client";

function makeIdea(overrides: Partial<Idea> & { id: string }): Idea {
  return {
    createdAt: new Date(),
    status: "PENDING",
    category: "IDEE_PURE",
    priority: "MEDIUM",
    transcript: "",
    title: "Titre",
    summary: "Résumé",
    tags: "",
    emailRecipient: null,
    contactName: null,
    contactPhone: null,
    contactEmail: null,
    contactCompany: null,
    contactRole: null,
    emailSubject: null,
    emailBody: null,
    dueAt: null,
    dueEstimated: false,
    parentId: null,
    notionPageId: null,
    notionPageUrl: null,
    ...overrides,
  } as Idea;
}

describe("filterIdeas", () => {
  const ideas = [
    makeIdea({ id: "1", title: "Acheter du café", summary: "Pour le bureau", tags: "courses, café", category: "IDEE_PURE" }),
    makeIdea({ id: "2", title: "Appeler le dentiste", summary: "Douleur dent", tags: "santé", category: "APPEL_RAPPEL", priority: "HIGH" }),
    makeIdea({ id: "3", title: "Projet Vocalink", summary: "Améliorer l'app", tags: "dev", category: "PROJET", status: "ACTIONED" }),
    makeIdea({ id: "4", title: "Relancer la proposition", summary: "Proposition site web", contactName: "Marie Curie", contactCompany: "ACME" }),
  ];

  it("sans filtre, renvoie tout", () => {
    expect(filterIdeas(ideas, {})).toHaveLength(4);
  });

  it("filtre par recherche texte sur le titre", () => {
    expect(filterIdeas(ideas, { search: "dentiste" }).map((i) => i.id)).toEqual(["2"]);
  });

  it("recherche insensible à la casse, sur résumé et tags aussi", () => {
    expect(filterIdeas(ideas, { search: "CAFÉ" }).map((i) => i.id)).toEqual(["1"]);
    expect(filterIdeas(ideas, { search: "dev" }).map((i) => i.id)).toEqual(["3"]);
  });

  it("recherche aussi sur le contact (nom, société)", () => {
    expect(filterIdeas(ideas, { search: "marie" }).map((i) => i.id)).toEqual(["4"]);
    expect(filterIdeas(ideas, { search: "acme" }).map((i) => i.id)).toEqual(["4"]);
  });

  it("filtre par catégorie", () => {
    expect(filterIdeas(ideas, { category: "APPEL_RAPPEL" }).map((i) => i.id)).toEqual(["2"]);
  });

  it("filtre par statut", () => {
    expect(filterIdeas(ideas, { status: "ACTIONED" }).map((i) => i.id)).toEqual(["3"]);
  });

  it("filtre par priorité", () => {
    expect(filterIdeas(ideas, { priority: "HIGH" }).map((i) => i.id)).toEqual(["2"]);
  });

  it("combine plusieurs filtres (ET logique)", () => {
    expect(filterIdeas(ideas, { category: "APPEL_RAPPEL", priority: "HIGH" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterIdeas(ideas, { category: "APPEL_RAPPEL", priority: "LOW" })).toHaveLength(0);
  });
});
