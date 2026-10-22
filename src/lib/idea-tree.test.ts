import { describe, it, expect } from "vitest";
import { resolveRootId, getSelfAndDescendantIds, groupIdeasByRoot } from "@/lib/idea-tree";
import type { Idea } from "@prisma/client";

let counter = 0;
function makeIdea(overrides: Partial<Idea> & { id: string }): Idea {
  counter++;
  return {
    createdAt: new Date(2026, 0, counter),
    status: "PENDING",
    category: "IDEE_PURE",
    priority: "MEDIUM",
    transcript: "",
    title: overrides.id,
    summary: "",
    tags: "",
    emailRecipient: null,
    contactName: null,
    contactPhone: null,
    contactEmail: null,
    contactCompany: null,
    contactRole: null,
    emailSubject: null,
    emailBody: null,
    dueAt: null,
    dueEstimated: false,
    parentId: null,
    notionPageId: null,
    notionPageUrl: null,
    ...overrides,
  } as Idea;
}

describe("resolveRootId", () => {
  it("renvoie l'idée elle-même si elle n'a pas de parent", () => {
    const a = makeIdea({ id: "a" });
    expect(resolveRootId(a, new Map([["a", a]]))).toBe("a");
  });

  it("remonte la chaîne jusqu'à la racine", () => {
    const a = makeIdea({ id: "a" });
    const b = makeIdea({ id: "b", parentId: "a" });
    const c = makeIdea({ id: "c", parentId: "b" });
    const byId = new Map([
      ["a", a],
      ["b", b],
      ["c", c],
    ]);
    expect(resolveRootId(c, byId)).toBe("a");
  });

  it("s'arrête sans boucler infiniment en cas de cycle", () => {
    const a = makeIdea({ id: "a", parentId: "b" });
    const b = makeIdea({ id: "b", parentId: "a" });
    const byId = new Map([
      ["a", a],
      ["b", b],
    ]);
    // Ne doit pas planter/boucler indéfiniment — le cap de sauts s'applique.
    expect(() => resolveRootId(a, byId)).not.toThrow();
  });
});

describe("getSelfAndDescendantIds", () => {
  it("inclut l'idée elle-même et tous ses descendants", () => {
    const ideas = [
      makeIdea({ id: "a" }),
      makeIdea({ id: "b", parentId: "a" }),
      makeIdea({ id: "c", parentId: "b" }),
      makeIdea({ id: "d" }), // indépendante
    ];
    const result = getSelfAndDescendantIds("a", ideas);
    expect(result).toEqual(new Set(["a", "b", "c"]));
  });
});

describe("groupIdeasByRoot", () => {
  it("regroupe les idées par ancêtre racine, triées par date de création", () => {
    const a = makeIdea({ id: "a" });
    const b = makeIdea({ id: "b", parentId: "a" });
    const c = makeIdea({ id: "c" }); // indépendante
    const groups = groupIdeasByRoot([a, b, c]);

    expect(groups).toHaveLength(2);
    const groupA = groups.find((g) => g.root.id === "a")!;
    expect(groupA.members.map((m) => m.id)).toEqual(["a", "b"]);
    const groupC = groups.find((g) => g.root.id === "c")!;
    expect(groupC.members.map((m) => m.id)).toEqual(["c"]);
  });
});
