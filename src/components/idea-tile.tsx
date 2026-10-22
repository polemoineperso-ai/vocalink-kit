import Link from "next/link";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { STAGE_STYLE } from "@/lib/idea-kind";
import { formatAge } from "@/lib/idea-sections";
import { splitTags } from "@/lib/idea-filter";
import type { Idea } from "@prisma/client";

/** Carte d'une IDÉE (pas de case à cocher : une idée mûrit, elle ne se coche pas). */
export function IdeaTile({ idea, now, noteCount = 0 }: { idea: Idea; now?: Date; noteCount?: number }) {
  const stage = STAGE_STYLE[idea.stage];
  const category = CATEGORY_STYLE[idea.category];
  const tags = splitTags(idea.tags).slice(0, 2);

  return (
    <Link href={`/ideas/${idea.id}`} className="block rounded-2xl bg-surface p-4 transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{idea.title}</h3>
        <span className={`chip shrink-0 ${stage.chip}`}>{stage.label}</span>
      </div>
      {idea.summary ? <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{idea.summary}</p> : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
        <span className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${category.stripe}`} aria-hidden="true" />
          {category.label}
        </span>
        <span aria-hidden="true">·</span>
        <span>{formatAge(idea.createdAt, now)}</span>
        {noteCount ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-muted">
              {noteCount} note{noteCount > 1 ? "s" : ""}
            </span>
          </>
        ) : null}
        {tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </Link>
  );
}
