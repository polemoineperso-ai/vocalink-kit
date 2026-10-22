"use client";

import { useState } from "react";
import { IdeaCard } from "@/components/idea-card";
import { filterIdeas, type DueView } from "@/lib/idea-filter";
import { groupIdeasByRoot } from "@/lib/idea-tree";
import { CATEGORY_ORDER, CATEGORY_STYLE, PRIORITY_ORDER, PRIORITY_STYLE } from "@/lib/category-style";
import type { Idea, IdeaCategory, IdeaStatus, IdeaPriority } from "@prisma/client";

const STATUS_OPTIONS: { value: IdeaStatus | ""; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "ACTIONED", label: "Faites" },
];

/** Recherche/filtres côté client — usage personnel, quelques dizaines/centaines d'idées, pas besoin d'aller-retour serveur. */
const DUE_LABELS: Record<DueView, string> = { today: "📅 Prévues aujourd'hui", overdue: "⏰ En retard" };

export function IdeasFilterList({
  ideas,
  initialDue = "",
  initialStatus = "",
}: {
  ideas: Idea[];
  /** Vue ouverte depuis un compteur de l'accueil. */
  initialDue?: DueView | "";
  initialStatus?: IdeaStatus | "";
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<IdeaCategory | "">("");
  const [status, setStatus] = useState<IdeaStatus | "">(initialStatus);
  const [priority, setPriority] = useState<IdeaPriority | "">("");
  const [due, setDue] = useState<DueView | "">(initialDue);

  const filtered = filterIdeas(ideas, { search, category, status, priority, due });
  const groups = groupIdeasByRoot(filtered);
  const hasActiveFilters = search.trim() !== "" || category !== "" || status !== "" || priority !== "" || due !== "";

  function resetFilters() {
    setSearch("");
    setCategory("");
    setStatus("");
    setPriority("");
    setDue("");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {due ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-warn-soft px-4 py-3">
            <p className="font-semibold text-warn">{DUE_LABELS[due]}</p>
            <button type="button" onClick={() => setDue("")} className="btn btn-ghost">
              Tout voir ✕
            </button>
          </div>
        ) : null}
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une idée, un contact, une société…"
            className="pl-10"
            aria-label="Rechercher"
          />
        </div>

        <div className="scroll-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Catégorie">
          <button type="button" aria-pressed={category === ""} onClick={() => setCategory("")} className={`pill shrink-0 ${category === "" ? "bg-brand text-white" : ""}`}>
            Toutes
          </button>
          {CATEGORY_ORDER.map((value) => {
            const style = CATEGORY_STYLE[value];
            const selected = category === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(selected ? "" : value)}
                className={`pill shrink-0 ${selected ? style.selected : ""}`}
              >
                <span aria-hidden="true">{style.icon}</span>
                {style.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex rounded-full border border-line bg-surface p-0.5" role="group" aria-label="Statut">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={status === opt.value}
                onClick={() => setStatus(opt.value)}
                className={`rounded-full px-3 py-1 font-medium transition ${status === opt.value ? "bg-subtle text-ink" : "text-muted"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-line bg-surface p-0.5" role="group" aria-label="Priorité">
            {PRIORITY_ORDER.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={priority === value}
                onClick={() => setPriority(priority === value ? "" : value)}
                className={`rounded-full px-3 py-1 font-medium transition ${priority === value ? PRIORITY_STYLE[value].selected : "text-muted"}`}
              >
                {PRIORITY_STYLE[value].label}
              </button>
            ))}
          </div>
          {hasActiveFilters ? (
            <button type="button" onClick={resetFilters} className="btn btn-ghost">
              Effacer
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center">
          <p className="text-3xl" aria-hidden="true">
            {hasActiveFilters ? "🔍" : "💡"}
          </p>
          <p className="font-medium">{hasActiveFilters ? "Aucune idée ne correspond" : "Votre première idée vous attend"}</p>
          <p className="text-sm text-muted">
            {hasActiveFilters ? "Essayez d'autres filtres." : "Touchez le micro sur l'accueil et dites-la à voix haute."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {filtered.length} idée{filtered.length > 1 ? "s" : ""}
          </p>
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
