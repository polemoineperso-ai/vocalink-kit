import { describe, it, expect } from "vitest";
import { isAction, isActiveStage, STAGE_ORDER, STAGE_STYLE, statusForStage } from "@/lib/idea-kind";

describe("idée ou action", () => {
  it("Email et Appel / Rappel sont des actions ; Projet et Idée sont des idées", () => {
    expect(isAction("EMAIL")).toBe(true);
    expect(isAction("APPEL_RAPPEL")).toBe(true);
    expect(isAction("PROJET")).toBe(false);
    expect(isAction("IDEE_PURE")).toBe(false);
  });
});

describe("étapes d'une idée", () => {
  it("ordre et libellés validés", () => {
    expect(STAGE_ORDER.map((s) => STAGE_STYLE[s].label)).toEqual(["Nouvelle", "En réflexion", "En cours", "Réalisée"]);
    expect(STAGE_STYLE.ARCHIVED.label).toBe("Archivée");
  });

  it("une idée réalisée ou archivée est traitée, les autres restent en attente", () => {
    expect(statusForStage("NEW")).toBe("PENDING");
    expect(statusForStage("IN_PROGRESS")).toBe("PENDING");
    expect(statusForStage("DONE")).toBe("ACTIONED");
    expect(statusForStage("ARCHIVED")).toBe("ACTIONED");
    expect(isActiveStage("THINKING")).toBe(true);
    expect(isActiveStage("ARCHIVED")).toBe(false);
  });
});
