import { describe, it, expect } from "vitest";
import { filterIdeas, splitTags } from "@/lib/idea-filter";
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

describe("filterIdeas — vues aujourd'hui / en retard", () => {
  // 22/10/2026 15 h à Paris.
  const NOW = new Date("2026-10-22T13:00:00Z");
  const ideas = [
    makeIdea({ id: "retard", dueAt: new Date("2026-10-21T10:00:00Z") }),
    makeIdea({ id: "ce-soir", dueAt: new Date("2026-10-22T17:00:00Z") }),
    makeIdea({ id: "demain", dueAt: new Date("2026-10-23T08:00:00Z") }),
    makeIdea({ id: "sans-date" }),
    makeIdea({ id: "retard-traitee", dueAt: new Date("2026-10-20T10:00:00Z"), status: "ACTIONED" }),
  ];

  it("en retard : en attente avec échéance passée", () => {
    expect(filterIdeas(ideas, { due: "overdue" }, NOW).map((i) => i.id)).toEqual(["retard"]);
  });

  it("aujourd'hui : en attente, prévue plus tard dans la journée (Paris)", () => {
    expect(filterIdeas(ideas, { due: "today" }, NOW).map((i) => i.id)).toEqual(["ce-soir"]);
  });
});

describe("filterIdeas — par tag", () => {
  const ideas = [
    makeIdea({ id: "a", tags: "appel, Acme, Jean Dupont" }),
    makeIdea({ id: "b", tags: "acme" }),
    makeIdea({ id: "c", tags: "acmeco, devis" }),
    makeIdea({ id: "d", tags: "" }),
  ];

  it("tag exact, sans tenir compte des majuscules (pas « acmeco »)", () => {
    expect(filterIdeas(ideas, { tag: "ACME" }).map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("splitTags nettoie la liste", () => {
    expect(splitTags(" appel ,, Acme ,")).toEqual(["appel", "Acme"]);
  });
});
