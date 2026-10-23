import { describe, it, expect } from "vitest";
import { activateUpdatesUrl, APP_VERSION, isNewerVersion, parseUpdateFeed, repoFromEnv, REPORT_ISSUE_URL, runUpdateUrl } from "@/lib/version";

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

describe("liens de mise à jour vers le dépôt de l'installation", () => {
  const env = { VERCEL_GIT_PROVIDER: "github", VERCEL_GIT_REPO_OWNER: "NorthIA2026", VERCEL_GIT_REPO_SLUG: "mon-vocalink", VERCEL_GIT_COMMIT_REF: "main" };

  it("lit le dépôt fourni par Vercel", () => {
    expect(repoFromEnv(env)).toEqual({ owner: "NorthIA2026", slug: "mon-vocalink", branch: "main" });
    expect(repoFromEnv({ ...env, VERCEL_GIT_COMMIT_REF: undefined })?.branch).toBe("main");
  });

  it("rien hors de Vercel ou hors GitHub", () => {
    expect(repoFromEnv({})).toBeNull();
    expect(repoFromEnv({ ...env, VERCEL_GIT_PROVIDER: "gitlab" })).toBeNull();
  });

  it("construit le lien « Activer » prérempli et le lien « Mettre à jour »", () => {
    const repo = repoFromEnv(env)!;
    const url = new URL(activateUpdatesUrl(repo, "name: Mettre à jour Vocalink" + String.fromCharCode(10) + "on: x"));
    expect(url.pathname).toBe("/NorthIA2026/mon-vocalink/new/main");
    expect(url.searchParams.get("filename")).toBe(".github/workflows/mettre-a-jour.yml");
    expect(url.searchParams.get("value")).toBe("name: Mettre à jour Vocalink" + String.fromCharCode(10) + "on: x");
    expect(runUpdateUrl(repo)).toBe("https://github.com/NorthIA2026/mon-vocalink/actions/workflows/mettre-a-jour.yml");
  });
});
