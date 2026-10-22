import { describe, it, expect } from "vitest";
import { pickRediscovery, type RediscoverCandidate } from "@/lib/rediscover";

const NOW = new Date("2026-10-22T13:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const idea = (id: string, over: Partial<RediscoverCandidate> = {}): RediscoverCandidate => ({
  id,
  category: "PROJET",
  stage: "NEW",
  createdAt: daysAgo(30),
  resurfacedAt: null,
  lastNoteAt: null,
  ...over,
});

describe("pickRediscovery", () => {
  it("choisit l'idée la plus longtemps oubliée", () => {
    const pick = pickRediscovery([idea("a", { createdAt: daysAgo(10) }), idea("b", { createdAt: daysAgo(40) }), idea("c", { createdAt: daysAgo(20) })], NOW);
    expect(pick?.id).toBe("b");
  });

  it("une note récente compte comme une activité", () => {
    const pick = pickRediscovery([idea("a", { createdAt: daysAgo(40), lastNoteAt: daysAgo(2) }), idea("b", { createdAt: daysAgo(20) })], NOW);
    expect(pick?.id).toBe("b");
  });

  it("ignore les idées trop récentes, les actions, les idées réalisées ou archivées", () => {
    expect(
      pickRediscovery(
        [
          idea("recente", { createdAt: daysAgo(3) }),
          idea("action", { category: "APPEL_RAPPEL" }),
          idea("faite", { stage: "DONE" }),
          idea("archivee", { stage: "ARCHIVED" }),
        ],
        NOW,
      ),
    ).toBeNull();
  });

  it("ne repropose pas une idée traitée il y a moins de 14 jours", () => {
    expect(pickRediscovery([idea("a", { resurfacedAt: daysAgo(5) })], NOW)).toBeNull();
    expect(pickRediscovery([idea("a", { resurfacedAt: daysAgo(15) })], NOW)?.id).toBe("a");
  });
});
