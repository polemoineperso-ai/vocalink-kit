"use client";

import { useState } from "react";
import { IdeaCard } from "@/components/idea-card";
import { filterIdeas } from "@/lib/idea-filter";
import { groupIdeasByRoot } from "@/lib/idea-tree";
import type { Idea, IdeaCategory, IdeaStatus, IdeaPriority } from "@prisma/client";

const CATEGORY_OPTIONS: { value: IdeaCategory | ""; label: string }[] = [
  { value: "", label: "Toutes les catégories" },
  { value: "PROJET", label: "Projet" },
  { value: "EMAIL", label: "Email" },
  { value: "APPEL_RAPPEL", label: "Appel / Rappel" },
  { value: "IDEE_PURE", label: "Idée pure" },
];

const STATUS_OPTIONS: { value: IdeaStatus | ""; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "ACTIONED", label: "Traité" },
];

const PRIORITY_OPTIONS: { value: IdeaPriority | ""; label: string }[] = [
  { value: "", label: "Toutes les priorités" },
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
];

/** Recherche/filtres côté client — usage personnel, quelques dizaines/centaines d'idées, pas besoin d'aller-retour serveur. */
export function IdeasFilterList({ ideas }: { ideas: Idea[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<IdeaCategory | "">("");
  const [status, setStatus] = useState<IdeaStatus | "">("");
  const [priority, setPriority] = useState<IdeaPriority | "">("");

  const filtered = filterIdeas(ideas, { search, category, status, priority });
  const groups = groupIdeasByRoot(filtered);
  const hasActiveFilters = search.trim() !== "" || category !== "" || status !== "" || priority !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (titre, résumé, tags)…"
          className="rounded-md border px-2 py-1.5 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IdeaCategory | "")}
            className="rounded-md border px-2 py-1 text-xs"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IdeaStatus | "")}
            className="rounded-md border px-2 py-1 text-xs"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as IdeaPriority | "")}
            className="rounded-md border px-2 py-1 text-xs"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">
          {hasActiveFilters ? "Aucune idée ne correspond à ces critères." : "Aucune idée enregistrée pour l'instant."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.root.id} className="flex flex-col gap-3">
              <IdeaCard idea={group.root} />
              {group.members
                .filter((m) => m.id !== group.root.id)
                .map((child) => (
                  <IdeaCard key={child.id} idea={child} isChild parentTitle={group.root.title} />
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
