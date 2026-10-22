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
};

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
    if (search) {
      const contact = [idea.contactName, idea.contactCompany, idea.contactRole, idea.contactEmail, idea.contactPhone];
      const haystack = [idea.title, idea.summary, idea.tags, ...contact].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}
