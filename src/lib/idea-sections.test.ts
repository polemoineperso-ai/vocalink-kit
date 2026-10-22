import { describe, it, expect } from "vitest";
import { formatDue, formatToday, greeting, groupBySection, sectionOf } from "@/lib/idea-sections";

// Jeudi 22/10/2026, 15 h à Paris (UTC+2).
const NOW = new Date("2026-10-22T13:00:00Z");
const idea = (dueAt: string | null, createdAt = "2026-10-01T10:00:00Z") => ({ dueAt: dueAt ? new Date(dueAt) : null, createdAt: new Date(createdAt) });

describe("sectionOf", () => {
  it("range chaque idée par moment (heure de Paris)", () => {
    expect(sectionOf(idea("2026-10-22T10:00:00Z"), NOW)).toBe("overdue"); // 12 h aujourd'hui, passé
    expect(sectionOf(idea("2026-10-22T20:00:00Z"), NOW)).toBe("today"); // 22 h ce soir
    expect(sectionOf(idea("2026-10-22T22:30:00Z"), NOW)).toBe("tomorrow"); // 0 h 30 vendredi à Paris
    expect(sectionOf(idea("2026-10-26T07:00:00Z"), NOW)).toBe("week"); // lundi
    expect(sectionOf(idea("2026-11-05T09:00:00Z"), NOW)).toBe("later");
    expect(sectionOf(idea(null), NOW)).toBe("undated");
  });
});

describe("groupBySection", () => {
  it("sections dans l'ordre, triées par échéance ; sans date : les plus récentes d'abord", () => {
    const groups = groupBySection(
      [
        idea(null, "2026-10-01T10:00:00Z"),
        idea("2026-10-23T09:00:00Z"),
        idea("2026-10-20T09:00:00Z"),
        idea(null, "2026-10-20T10:00:00Z"),
        idea("2026-10-23T07:00:00Z"),
      ],
      NOW,
    );
    expect(groups.map((g) => g.key)).toEqual(["overdue", "tomorrow", "undated"]);
    expect(groups[1].items.map((i) => i.dueAt!.toISOString())).toEqual(["2026-10-23T07:00:00.000Z", "2026-10-23T09:00:00.000Z"]);
    expect(groups[2].items.map((i) => i.createdAt.toISOString())).toEqual(["2026-10-20T10:00:00.000Z", "2026-10-01T10:00:00.000Z"]);
  });
});

describe("formatDue", () => {
  it("libellés courts en heure de Paris", () => {
    expect(formatDue("2026-10-22T18:00:00Z", NOW)).toBe("20:00");
    expect(formatDue("2026-10-23T07:00:00Z", NOW)).toBe("Demain 9:00");
    expect(formatDue("2026-10-21T10:00:00Z", NOW)).toBe("Hier 12:00");
    expect(formatDue("2026-10-26T08:00:00Z", NOW)).toBe("Lun. 9:00"); // heure d'hiver depuis le 25
    expect(formatDue("2026-11-05T09:00:00Z", NOW)).toBe("5 nov.");
  });

  it("n'affiche pas l'heure d'un créneau estimé", () => {
    expect(formatDue("2026-10-23T07:00:00Z", NOW, true)).toBe("Demain");
  });
});

describe("en-tête", () => {
  it("date du jour et salutation", () => {
    expect(formatToday(NOW)).toBe("Jeudi 22 octobre");
    expect(greeting(NOW)).toBe("Bonjour");
    expect(greeting(new Date("2026-10-22T19:00:00Z"))).toBe("Bonsoir");
  });
});
