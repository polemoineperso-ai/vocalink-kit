"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { IdeaTile } from "@/components/idea-tile";
import { filterIdeas } from "@/lib/idea-filter";
import { STAGE_STYLE, isActiveStage } from "@/lib/idea-kind";
import type { Idea, IdeaStage } from "@prisma/client";

type Scope = "active" | "DONE" | "ARCHIVED";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "active", label: "Actives" },
  { value: "DONE", label: "Réalisées" },
  { value: "ARCHIVED", label: "Archivées" },
];

const ACTIVE_STAGES: IdeaStage[] = ["NEW", "THINKING", "IN_PROGRESS"];

/** Les idées (pas les actions), rangées par étape. Filtres côté client : usage personnel. */
export function IdeasBoard({
  ideas,
  initialTag = "",
  notesByIdea = {},
}: {
  ideas: Idea[];
  initialTag?: string;
  /** Nombre et texte des notes par idée (carte et recherche). */
  notesByIdea?: Record<string, { count: number; text: string }>;
}) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<Scope>("active");
  const [tag, setTag] = useState(initialTag);

  // La recherche porte aussi sur les notes ajoutées après coup.
  const needle = search.trim().toLowerCase();
  const byFields = new Set(filterIdeas(ideas, { search, tag }).map((i) => i.id));
  const matching = filterIdeas(ideas, { tag })
    .filter((i) => !needle || byFields.has(i.id) || notesByIdea[i.id]?.text.toLowerCase().includes(needle))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const inScope = matching.filter((i) => (scope === "active" ? isActiveStage(i.stage) : i.stage === scope));
  const groups =
    scope === "active"
      ? ACTIVE_STAGES.map((stage) => ({ stage, items: inScope.filter((i) => i.stage === stage) })).filter((g) => g.items.length)
      : [{ stage: scope as IdeaStage, items: inScope }];

  return (
    <div className="flex flex-col">
      <div className="relative mt-4">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Retrouver une idée…"
          className="!rounded-xl !border-transparent !bg-surface pl-10"
          aria-label="Rechercher une idée"
        />
      </div>

      <div className="segmented mt-3" role="group" aria-label="Étape">
        {SCOPES.map((s) => (
          <button key={s.value} type="button" aria-pressed={scope === s.value} onClick={() => setScope(s.value)}>
            {s.label}
          </button>
        ))}
      </div>

      {tag ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-2.5">
          <p className="text-sm font-semibold">#{tag}</p>
          <button type="button" onClick={() => setTag("")} className="flex items-center gap-1 text-sm font-medium text-brand">
            Tout voir <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {inScope.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-1 px-6 text-center">
          <p className="font-semibold">
            {search || tag
              ? "Aucune idée ne correspond"
              : scope === "active"
                ? "Votre première idée vous attend"
                : scope === "DONE"
                  ? "Aucune idée réalisée pour l'instant"
                  : "Aucune idée archivée"}
          </p>
          <p className="text-sm text-muted">
            {search || tag ? "Essayez d'autres mots." : "Touchez le micro et dites-la comme elle vient."}
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.stage}>
            <h2 className="group-label">
              {STAGE_STYLE[group.stage].plural} <span className="font-normal text-faint">{group.items.length}</span>
            </h2>
            <div className="flex flex-col gap-2.5">
              {group.items.map((idea) => (
                <IdeaTile key={idea.id} idea={idea} noteCount={notesByIdea[idea.id]?.count ?? 0} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
