import { describe, it, expect } from "vitest";
import { APP_VERSION, isNewerVersion, parseUpdateFeed, REPORT_ISSUE_URL } from "@/lib/version";

describe("isNewerVersion", () => {
  it("compare chaque nombre, pas le texte", () => {
    expect(isNewerVersion("1.10.0", "1.9.0")).toBe(true);
    expect(isNewerVersion("2.0.0", "1.99.99")).toBe(true);
    expect(isNewerVersion("1.0.1", "1.0.0")).toBe(true);
  });

  it("même version ou plus ancienne : pas de mise à jour", () => {
    expect(isNewerVersion("1.0.0", "1.0.0")).toBe(false);
    expect(isNewerVersion("1.0.0", "1.2.0")).toBe(false);
  });
});

describe("parseUpdateFeed", () => {
  it("lit la version et les nouveautés", () => {
    expect(parseUpdateFeed({ version: "1.2.0", notes: "Plus rapide" })).toEqual({ version: "1.2.0", notes: "Plus rapide" });
    expect(parseUpdateFeed({ version: "1.2.0" })).toEqual({ version: "1.2.0", notes: "" });
  });

  it("ignore un contenu inattendu", () => {
    expect(parseUpdateFeed(null)).toBeNull();
    expect(parseUpdateFeed("1.2.0")).toBeNull();
    expect(parseUpdateFeed({ version: "v2" })).toBeNull();
    expect(parseUpdateFeed({ version: 2 })).toBeNull();
  });
});

describe("REPORT_ISSUE_URL", () => {
  it("préremplit la version dans le formulaire de signalement", () => {
    expect(REPORT_ISSUE_URL).toContain(`version=${APP_VERSION}`);
    expect(REPORT_ISSUE_URL).toContain("template=probleme.yml");
  });
});
