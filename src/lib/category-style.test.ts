import { describe, it, expect } from "vitest";
import { CATEGORY_ORDER, CATEGORY_STYLE, initials } from "@/lib/category-style";

describe("initials", () => {
  it("prend la première lettre du prénom et du nom", () => {
    expect(initials("Jean Dupont")).toBe("JD");
    expect(initials("Marie Anne de la Tour")).toBe("MT");
  });

  it("deux premières lettres pour un seul mot", () => {
    expect(initials("acme")).toBe("AC");
  });

  it("? quand il n'y a pas de nom", () => {
    expect(initials(null)).toBe("?");
    expect(initials("   ")).toBe("?");
  });
});

describe("CATEGORY_STYLE", () => {
  it("couvre chaque catégorie avec un libellé et des classes", () => {
    for (const category of CATEGORY_ORDER) {
      expect(CATEGORY_STYLE[category].label).toBeTruthy();
      expect(CATEGORY_STYLE[category].chip).toMatch(/^bg-/);
    }
  });
});
