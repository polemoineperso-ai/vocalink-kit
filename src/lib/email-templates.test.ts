import { describe, it, expect } from "vitest";
import { digestEmail } from "@/lib/email-templates";

describe("digestEmail", () => {
  it("accorde le sujet au singulier/pluriel selon le nombre d'idées", () => {
    const one = digestEmail({
      items: [{ title: "Idée A", categoryLabel: "Projet", priorityLabel: "Haute", ageDays: 4, href: "https://x/1" }],
    });
    expect(one.subject).toBe("Vocalink — 1 idée en attente");

    const many = digestEmail({
      items: [
        { title: "Idée A", categoryLabel: "Projet", priorityLabel: "Haute", ageDays: 4, href: "https://x/1" },
        { title: "Idée B", categoryLabel: "Email", priorityLabel: "Basse", ageDays: 5, href: "https://x/2" },
      ],
    });
    expect(many.subject).toBe("Vocalink — 2 idées en attente");
  });

  it("inclut le titre, la catégorie, la priorité, l'ancienneté et le lien de chaque idée", () => {
    const { text } = digestEmail({
      items: [{ title: "Idée A", categoryLabel: "Projet", priorityLabel: "Haute", ageDays: 4, href: "https://x/1" }],
    });
    expect(text).toContain("Idée A");
    expect(text).toContain("Projet");
    expect(text).toContain("Haute");
    expect(text).toContain("4 jours");
    expect(text).toContain("https://x/1");
  });
});
