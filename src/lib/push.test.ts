import { describe, it, expect, vi } from "vitest";

// push.ts importe Prisma : on le neutralise, seul vapidSubject est testé ici.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { vapidSubject } = await import("@/lib/push");

describe("vapidSubject", () => {
  it("utilise l'adresse publique fournie par Vercel", () => {
    expect(vapidSubject({ VERCEL_PROJECT_PRODUCTION_URL: "vocalink.northia.fr" })).toBe("https://vocalink.northia.fr");
  });

  it("sinon APP_URL en https", () => {
    expect(vapidSubject({ APP_URL: "https://mon-vocalink.vercel.app" })).toBe("https://mon-vocalink.vercel.app");
  });

  it("jamais une adresse locale ou fictive (refusée par Apple)", () => {
    const subject = vapidSubject({ APP_URL: "http://localhost:3000" });
    expect(subject).toMatch(/^https:\/\//);
    expect(subject).not.toContain("localhost");
  });
});
