import type { Idea } from "@prisma/client";

const MAX_CHAIN_HOPS = 50;

/**
 * Remonte la chaîne parentId jusqu'à l'ancêtre racine. Cap de sauts en
 * garde-fou anti-cycle (le rattachement est manuel, rien n'empêche
 * structurellement un cycle côté utilisateur) — au-delà, on s'arrête là où
 * on est plutôt que de boucler indéfiniment.
 */
export function resolveRootId(idea: Idea, byId: Map<string, Idea>): string {
  let current = idea;
  let hops = 0;
  while (current.parentId && hops < MAX_CHAIN_HOPS) {
    const parent = byId.get(current.parentId);
    if (!parent) break;
    current = parent;
    hops++;
  }
  return current.id;
}

/** Ids de l'idée elle-même + tous ses descendants — pour exclure du sélecteur de parent. */
export function getSelfAndDescendantIds(ideaId: string, ideas: Idea[]): Set<string> {
  const childrenByParent = new Map<string, Idea[]>();
  for (const idea of ideas) {
    if (!idea.parentId) continue;
    const list = childrenByParent.get(idea.parentId) ?? [];
    list.push(idea);
    childrenByParent.set(idea.parentId, list);
  }

  const result = new Set<string>([ideaId]);
  const queue = [ideaId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const child of childrenByParent.get(id) ?? []) {
      if (result.has(child.id)) continue;
      result.add(child.id);
      queue.push(child.id);
    }
  }
  return result;
}

export type IdeaGroup = { root: Idea; members: Idea[] };

/** Regroupe les idées par ancêtre racine — affichage à deux niveaux (racine + enfants indentés). */
export function groupIdeasByRoot(ideas: Idea[]): IdeaGroup[] {
  const byId = new Map(ideas.map((i) => [i.id, i]));
  const groups = new Map<string, Idea[]>();

  for (const idea of ideas) {
    const rootId = resolveRootId(idea, byId);
    const list = groups.get(rootId) ?? [];
    list.push(idea);
    groups.set(rootId, list);
  }

  return [...groups.entries()]
    .map(([rootId, members]) => ({
      root: byId.get(rootId) ?? members[0],
      members: members.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    }))
    .sort((a, b) => b.root.createdAt.getTime() - a.root.createdAt.getTime());
}
