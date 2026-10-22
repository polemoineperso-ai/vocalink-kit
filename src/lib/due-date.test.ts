import { describe, it, expect } from "vitest";
import { resolveDueAt, snoozeDueAt, todayInParis } from "@/lib/due-date";
import { IdeaCategory } from "@prisma/client";

describe("resolveDueAt", () => {
  it("convertit une heure de Paris en UTC (hiver, CET = UTC+1)", () => {
    const { dueAt, dueEstimated } = resolveDueAt({
      category: IdeaCategory.APPEL_RAPPEL,
      dueDate: "2026-01-15",
      dueTime: "11:00",
    });
    expect(dueAt?.toISOString()).toBe("2026-01-15T10:00:00.000Z");
    expect(dueEstimated).toBe(false);
  });

  it("convertit une heure de Paris en UTC (été, CEST = UTC+2) — le bug constaté en production", () => {
    const { dueAt } = resolveDueAt({
      category: IdeaCategory.APPEL_RAPPEL,
      dueDate: "2026-10-05",
      dueTime: "11:00",
    });
    // 11h Paris en octobre (heure d'été jusqu'à fin octobre) = 09h UTC, pas 11h UTC.
    expect(dueAt?.toISOString()).toBe("2026-10-05T09:00:00.000Z");
  });

  it("applique un créneau par défaut (demain 9h Paris) pour Appel/Rappel sans heure précisée", () => {
    const now = new Date("2026-06-15T20:00:00.000Z"); // 22h Paris (CEST)
    const { dueAt, dueEstimated } = resolveDueAt({ category: IdeaCategory.APPEL_RAPPEL }, now);
    expect(dueEstimated).toBe(true);
    // Demain (16 juin) à 9h Paris (CEST, UTC+2) = 07h UTC.
    expect(dueAt?.toISOString()).toBe("2026-06-16T07:00:00.000Z");
  });

  it("ne pose pas de créneau par défaut pour les autres catégories sans date", () => {
    const { dueAt, dueEstimated } = resolveDueAt({ category: IdeaCategory.PROJET });
    expect(dueAt).toBeNull();
    expect(dueEstimated).toBe(false);
  });

  it("accepte une date sans heure explicite pour n'importe quelle catégorie (heure par défaut 09:00)", () => {
    const { dueAt, dueEstimated } = resolveDueAt({
      category: IdeaCategory.PROJET,
      dueDate: "2026-12-01",
    });
    expect(dueAt?.toISOString()).toBe("2026-12-01T08:00:00.000Z"); // 9h Paris en décembre (CET, UTC+1)
    expect(dueEstimated).toBe(false);
  });
});

describe("todayInParis", () => {
  it("reste sur le jour précédent juste avant minuit heure de Paris (23h50 Paris = 22h50 UTC en CEST)", () => {
    expect(todayInParis(new Date("2026-06-15T21:50:00.000Z"))).toBe("2026-06-15");
  });

  it("passe au jour suivant à minuit heure de Paris, pas minuit UTC", () => {
    // 00h05 Paris le 16 juin (CEST, UTC+2) = 15 juin 22h05 UTC — encore le 15 en UTC, déjà le 16 à Paris.
    expect(todayInParis(new Date("2026-06-15T22:05:00.000Z"))).toBe("2026-06-16");
  });
});

describe("snoozeDueAt", () => {
  // Jeudi 22/10/2026, 15 h à Paris (UTC+2).
  const NOW = new Date("2026-10-22T13:00:00Z");
  const paris = (d: Date) => d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  it("demain, en gardant l'heure prévue (heure de Paris)", () => {
    const due = new Date("2026-10-21T10:00:00Z"); // mercredi 12:00 à Paris
    expect(paris(snoozeDueAt(due, "tomorrow", NOW))).toBe("vendredi 23/10 12:00");
  });

  it("lundi prochain, 9 h sans heure prévue", () => {
    expect(paris(snoozeDueAt(null, "monday", NOW))).toBe("lundi 26/10 09:00");
  });

  it("dans une semaine, en passant l'heure d'hiver (25/10) sans décaler l'heure", () => {
    const due = new Date("2026-10-22T08:00:00Z"); // 10:00 à Paris
    expect(paris(snoozeDueAt(due, "week", NOW))).toBe("jeudi 29/10 10:00");
  });

  it("un lundi, « Lundi » veut dire le lundi suivant", () => {
    const monday = new Date("2026-10-26T08:00:00Z");
    expect(paris(snoozeDueAt(null, "monday", monday))).toBe("lundi 02/11 09:00");
  });
});
