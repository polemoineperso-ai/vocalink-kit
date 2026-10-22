import type { Idea, IdeaCategory, IdeaStatus, IdeaPriority } from "@prisma/client";
import { todayInParis } from "@/lib/due-date";

/** Vues reliées aux compteurs de l'accueil (mêmes définitions que getHomeStats). */
export type DueView = "today" | "overdue";

export function isDueView(value: unknown): value is DueView {
  return value === "today" || value === "overdue";
}

export type IdeaFilters = {
  search?: string;
  category?: IdeaCategory | "";
  status?: IdeaStatus | "";
  priority?: IdeaPriority | "";
  /** today : en attente, prévue plus tard aujourd'hui (Paris) ; overdue : en attente, échéance passée. */
  due?: DueView | "";
  /** Tag exact (sans tenir compte des majuscules), choisi en touchant une pastille. */
  tag?: string;
};

/** Tags d'une idée (champ texte « a, b, c ») sous forme de liste propre. */
export function splitTags(tags: string | null | undefined): string[] {
  return (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Filtre pur — recherche sur titre/résumé/tags/contact (insensible à la casse) + filtres exacts. */
export function filterIdeas(ideas: Idea[], filters: IdeaFilters, now: Date = new Date()): Idea[] {
  const search = filters.search?.trim().toLowerCase();
  const today = todayInParis(now);

  return ideas.filter((idea) => {
    if (filters.category && idea.category !== filters.category) return false;
    if (filters.status && idea.status !== filters.status) return false;
    if (filters.priority && idea.priority !== filters.priority) return false;
    if (filters.due) {
      if (idea.status !== "PENDING" || !idea.dueAt) return false;
      const dueAt = new Date(idea.dueAt);
      if (filters.due === "overdue" && !(dueAt < now)) return false;
      if (filters.due === "today" && !(dueAt >= now && todayInParis(dueAt) === today)) return false;
    }
    if (filters.tag) {
      const wanted = filters.tag.trim().toLowerCase();
      if (!splitTags(idea.tags).some((t) => t.toLowerCase() === wanted)) return false;
    }
    if (search) {
      const contact = [idea.contactName, idea.contactCompany, idea.contactRole, idea.contactEmail, idea.contactPhone];
      const haystack = [idea.title, idea.summary, idea.tags, ...contact].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/**
 * Thèmes : les tags les plus fréquents (sans tenir compte des majuscules),
 * pour regrouper ses idées par sujet. Au moins 2 idées par thème : un tag
 * isolé n'est pas un thème.
 */
export function topThemes(ideas: Pick<Idea, "tags">[], limit = 8): { tag: string; count: number }[] {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const idea of ideas) {
    for (const tag of new Set(splitTags(idea.tags).map((t) => t.toLowerCase()))) {
      const original = splitTags(idea.tags).find((t) => t.toLowerCase() === tag)!;
      const entry = counts.get(tag) ?? { tag: original, count: 0 };
      entry.count += 1;
      counts.set(tag, entry);
    }
  }
  return [...counts.values()]
    .filter((t) => t.count >= 2)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "fr"))
    .slice(0, limit);
}
