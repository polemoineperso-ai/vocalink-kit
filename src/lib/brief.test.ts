import { describe, it, expect } from "vitest";
import { buildMorningBrief } from "@/lib/brief";

// 22 octobre 2026, 8 h à Paris (heure d'été : UTC+2).
const NOW = new Date("2026-10-22T06:00:00Z");
const at = (iso: string) => new Date(iso);

describe("buildMorningBrief", () => {
  it("rien en attente → pas de notification", () => {
    expect(buildMorningBrief([], "Marie", NOW)).toBeNull();
  });

  it("liste ce qui est prévu aujourd'hui avec l'heure de Paris, et les retards", () => {
    const brief = buildMorningBrief(
      [
        { title: "Écrire à Sophie", dueAt: at("2026-10-22T12:00:00Z"), dueEstimated: false },
        { title: "Rappeler Jean", dueAt: at("2026-10-22T08:00:00Z"), dueEstimated: false },
        { title: "Facture", dueAt: at("2026-10-20T08:00:00Z"), dueEstimated: false },
        { title: "Plus tard", dueAt: at("2026-10-25T08:00:00Z"), dueEstimated: false },
      ],
      "Marie",
      NOW,
    );
    expect(brief).toEqual({
      title: "Bonjour Marie ☀️",
      body: "Aujourd'hui : Rappeler Jean (10:00), Écrire à Sophie (14:00). 1 en retard.",
      url: "/a-faire",
      badgeCount: 3,
    });
  });

  it("n'affiche pas l'heure d'un créneau estimé", () => {
    const brief = buildMorningBrief([{ title: "Appeler le garage", dueAt: at("2026-10-22T07:00:00Z"), dueEstimated: true }], null, NOW);
    expect(brief?.title).toBe("Bonjour ☀️");
    expect(brief?.body).toBe("Aujourd'hui : Appeler le garage.");
  });

  it("au-delà de 3 éléments, résume le reste", () => {
    const ideas = [1, 2, 3, 4, 5].map((n) => ({ title: `Tâche ${n}`, dueAt: at(`2026-10-22T1${n}:00:00Z`), dueEstimated: false }));
    expect(buildMorningBrief(ideas, null, NOW)?.body).toContain("et 2 autres.");
  });

  it("rien de daté : propose un tri des idées en attente", () => {
    const brief = buildMorningBrief([{ title: "Idée", dueAt: null, dueEstimated: false }], "Marie", NOW);
    expect(brief?.body).toBe("Rien de prévu aujourd'hui. 1 action sans date : un petit tri ?");
    expect(brief?.badgeCount).toBe(0);
  });
});
