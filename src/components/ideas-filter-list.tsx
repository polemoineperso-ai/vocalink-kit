"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { IdeaRow } from "@/components/idea-row";
import { filterIdeas, type DueView } from "@/lib/idea-filter";
import { groupBySection } from "@/lib/idea-sections";
import { CATEGORY_ORDER, CATEGORY_STYLE } from "@/lib/category-style";
import type { Idea, IdeaCategory, IdeaPriority } from "@prisma/client";

type Scope = "todo" | "done" | "all";

const SCOPES: { value: Scope; label: string }[] = [
  { value: "todo", label: "À faire" },
  { value: "done", label: "Faites" },
  { value: "all", label: "Toutes" },
];

const DUE_LABELS: Record<DueView, string> = { today: "Prévues aujourd'hui", overdue: "En retard" };

/** Recherche/filtres côté client — usage personnel, quelques dizaines/centaines d'idées, pas besoin d'aller-retour serveur. */
export function IdeasFilterList({
  ideas,
  initialDue = "",
  initialTag = "",
}: {
  ideas: Idea[];
  /** Vue ouverte depuis un compteur de l'écran Aujourd'hui. */
  initialDue?: DueView | "";
  /** Tag ouvert depuis une fiche. */
  initialTag?: string;
}) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<Scope>("todo");
  const [category, setCategory] = useState<IdeaCategory | "">("");
  const [priority, setPriority] = useState<IdeaPriority | "">("");
  const [due, setDue] = useState<DueView | "">(initialDue);
  const [tag, setTag] = useState(initialTag);

  const status = scope === "todo" ? "PENDING" : scope === "done" ? "ACTIONED" : "";
  const filtered = filterIdeas(ideas, { search, category, status, priority, due, tag });
  const pending = filtered.filter((i) => i.status === "PENDING");
  const done = filtered
    .filter((i) => i.status === "ACTIONED")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sections = [
    ...groupBySection(pending),
    ...(done.length ? [{ key: "done", label: "Faites", items: done }] : []),
  ];

  const activeBanner = due ? DUE_LABELS[due] : tag ? `#${tag}` : null;
  const hasFilters = Boolean(search.trim() || category || priority || due || tag);

  return (
    <div className="flex flex-col">
      <div className="relative mt-3">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une idée, un contact…"
          className="!rounded-xl !border-transparent !bg-surface pl-10"
          aria-label="Rechercher"
        />
      </div>

      <div className="segmented mt-3" role="group" aria-label="Statut">
        {SCOPES.map((s) => (
          <button key={s.value} type="button" aria-pressed={scope === s.value} onClick={() => setScope(s.value)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="scroll-row -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filtres">
        {CATEGORY_ORDER.map((value) => {
          const style = CATEGORY_STYLE[value];
          const selected = category === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(selected ? "" : value)}
              className={`pill shrink-0 !py-1.5 ${selected ? style.selected : ""}`}
            >
              <span className={`h-2 w-2 rounded-full ${style.stripe}`} aria-hidden="true" />
              {style.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={priority === "HIGH"}
          onClick={() => setPriority(priority === "HIGH" ? "" : "HIGH")}
          className={`pill shrink-0 !py-1.5 ${priority === "HIGH" ? "bg-danger-soft text-danger" : ""}`}
        >
          Priorité haute
        </button>
      </div>

      {activeBanner ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-2.5">
          <p className="text-sm font-semibold">{activeBanner}</p>
          <button
            type="button"
            onClick={() => {
              setDue("");
              setTag("");
            }}
            className="flex items-center gap-1 text-sm font-medium text-brand"
          >
            Tout voir <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-1 px-6 text-center">
          <p className="font-semibold">
            {hasFilters ? "Aucune idée ne correspond" : scope === "done" ? "Rien de fait pour l'instant" : "Tout est fait"}
          </p>
          <p className="text-sm text-muted">
            {hasFilters ? "Essayez d'autres filtres." : "Une nouvelle idée ? Touchez le micro en bas de l'écran."}
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.key}>
            <h2 className={`group-label ${section.key === "overdue" ? "text-warn" : ""}`}>
              {section.label} <span className="font-normal text-faint">{section.items.length}</span>
            </h2>
            <div className="group">
              {section.items.map((idea) => (
                <IdeaRow key={idea.id} idea={idea} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
