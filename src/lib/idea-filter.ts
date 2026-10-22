import type { Idea, IdeaCategory, IdeaStatus, IdeaPriority } from "@prisma/client";

export type IdeaFilters = {
  search?: string;
  category?: IdeaCategory | "";
  status?: IdeaStatus | "";
  priority?: IdeaPriority | "";
};

/** Filtre pur — recherche sur titre/résumé/tags/contact (insensible à la casse) + filtres exacts. */
export function filterIdeas(ideas: Idea[], filters: IdeaFilters): Idea[] {
  const search = filters.search?.trim().toLowerCase();

  return ideas.filter((idea) => {
    if (filters.category && idea.category !== filters.category) return false;
    if (filters.status && idea.status !== filters.status) return false;
    if (filters.priority && idea.priority !== filters.priority) return false;
    if (search) {
      const contact = [idea.contactName, idea.contactCompany, idea.contactRole, idea.contactEmail, idea.contactPhone];
      const haystack = [idea.title, idea.summary, idea.tags, ...contact].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}
