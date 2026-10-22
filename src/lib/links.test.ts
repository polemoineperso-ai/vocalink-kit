import { describe, it, expect } from "vitest";
import { buildMailtoLink, buildGoogleCalendarLink, buildTelLink } from "@/lib/links";

describe("buildMailtoLink", () => {
  it("inclut le destinataire quand c'est une adresse email valide", () => {
    const link = buildMailtoLink({ recipient: "test@example.com", subject: "Objet", body: "Corps" });
    expect(link).toBe("mailto:test%40example.com?subject=Objet&body=Corps");
  });

  it("omet le destinataire quand ce n'est pas une adresse email (ex: un nom)", () => {
    const link = buildMailtoLink({ recipient: "Jean Dupont", subject: "Objet", body: null });
    expect(link).toBe("mailto:?subject=Objet");
  });

  it("reste un mailto minimal quand tout est vide", () => {
    expect(buildMailtoLink({ recipient: null, subject: null, body: null })).toBe("mailto:");
  });
});

describe("buildTelLink", () => {
  it("retire espaces, points et tirets", () => {
    expect(buildTelLink("06 12 34 56 78")).toBe("tel:0612345678");
    expect(buildTelLink("06.12.34.56.78")).toBe("tel:0612345678");
    expect(buildTelLink("06-12-34-56-78")).toBe("tel:0612345678");
  });

  it("conserve le + international", () => {
    expect(buildTelLink("+33 6 12 34 56 78")).toBe("tel:+33612345678");
  });

  it("renvoie null pour un texte qui n'est pas un numéro", () => {
    expect(buildTelLink(null)).toBeNull();
    expect(buildTelLink("")).toBeNull();
    expect(buildTelLink("demander à Paul")).toBeNull();
  });
});

describe("buildGoogleCalendarLink", () => {
  it("produit une URL Google Calendar avec les bons paramètres", () => {
    const link = buildGoogleCalendarLink({
      title: "Rendez-vous",
      details: "Détails du rendez-vous",
      start: new Date("2026-10-05T09:00:00.000Z"),
      durationMinutes: 30,
    });
    expect(link).toContain("https://calendar.google.com/calendar/render?");
    expect(link).toContain("action=TEMPLATE");
    expect(link).toContain("text=Rendez-vous");
    expect(link).toContain("dates=20261005T090000Z%2F20261005T093000Z");
  });
});
