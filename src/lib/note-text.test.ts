import { describe, it, expect } from "vitest";
import { cleanNoteText, NOTE_MAX_LENGTH } from "@/lib/note-text";

describe("cleanNoteText", () => {
  it("retire les espaces superflus et met une majuscule", () => {
    expect(cleanNoteText("  en parler   à la mairie\n demain ")).toBe("En parler à la mairie demain");
  });

  it("vide si rien d'exploitable", () => {
    expect(cleanNoteText("   \n ")).toBe("");
  });

  it("borne la longueur", () => {
    expect(cleanNoteText("a".repeat(NOTE_MAX_LENGTH + 50))).toHaveLength(NOTE_MAX_LENGTH);
  });
});
