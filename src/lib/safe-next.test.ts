import { describe, it, expect } from "vitest";
import { safeNextPath } from "@/lib/safe-next";

describe("safeNextPath", () => {
  it("garde un chemin de l'app, paramètres compris", () => {
    expect(safeNextPath("/ideas")).toBe("/ideas");
    expect(safeNextPath("/?dicter=1")).toBe("/?dicter=1");
  });

  it("refuse toute adresse qui sort de l'app", () => {
    expect(safeNextPath("https://exemple.com")).toBe("/");
    expect(safeNextPath("//exemple.com")).toBe("/");
    expect(safeNextPath("/\\exemple.com")).toBe("/");
  });

  it("par défaut, l'accueil", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });
});
