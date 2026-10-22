"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateIdeaStatus, deleteIdea } from "@/lib/actions/idea-actions";
import { buildMailtoLink, buildGoogleCalendarLink, buildTelLink } from "@/lib/links";
import { formatContactIdentity, hasContact } from "@/lib/contact";
import { CATEGORY_STYLE, PRIORITY_STYLE } from "@/lib/category-style";
import type { Idea } from "@prisma/client";

export function IdeaCard({
  idea,
  isChild,
  parentTitle,
}: {
  idea: Idea;
  /** Rendu indenté, rattaché visuellement à un parent (voir /ideas et lib/idea-tree.ts). */
  isChild?: boolean;
  parentTitle?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const style = CATEGORY_STYLE[idea.category];
  const done = idea.status === "ACTIONED";
  const overdue = !done && idea.dueAt !== null && new Date(idea.dueAt) < new Date();

  function toggleStatus() {
    startTransition(async () => {
      await updateIdeaStatus(idea.id, done ? "PENDING" : "ACTIONED");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(`Supprimer « ${idea.title} » ? Cette action est définitive.`)) return;
    startTransition(async () => {
      await deleteIdea(idea.id);
      router.refresh();
    });
  }

  const actionLink =
    idea.category === "EMAIL"
      ? buildMailtoLink({ recipient: idea.contactEmail, subject: idea.emailSubject, body: idea.emailBody })
      : idea.category === "APPEL_RAPPEL" && idea.dueAt
        ? buildGoogleCalendarLink({ title: idea.title, details: idea.summary, start: new Date(idea.dueAt) })
        : null;
  const actionLabel = idea.category === "EMAIL" ? "Écrire l'email" : "Agenda";

  const contactIdentity = formatContactIdentity(idea);
  const telLink = buildTelLink(idea.contactPhone);

  return (
    <article className={`card relative flex overflow-hidden ${isChild ? "ml-6" : ""} ${done ? "opacity-70" : ""}`}>
      <div className={`w-1.5 shrink-0 ${done ? "bg-line" : style.stripe}`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {isChild && parentTitle ? <p className="mb-1 text-xs text-muted">↳ {parentTitle}</p> : null}
            <h2 className={`font-semibold leading-snug ${done ? "text-muted line-through" : ""}`}>{idea.title}</h2>
            {idea.summary ? <p className="mt-1 text-sm leading-relaxed text-muted">{idea.summary}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={`chip ${style.chip}`}>
              <span aria-hidden="true">{style.icon}</span>
              {style.label}
            </span>
            {idea.priority === "HIGH" ? <span className={`chip ${PRIORITY_STYLE.HIGH.chip}`}>Haute</span> : null}
            {idea.priority === "LOW" ? <span className={`chip ${PRIORITY_STYLE.LOW.chip}`}>Basse</span> : null}
          </div>
        </div>

        {hasContact(idea) ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-subtle px-3 py-2 text-sm">
            {contactIdentity ? <span className="font-medium">👤 {contactIdentity}</span> : null}
            {idea.contactPhone ? (
              telLink ? (
                <a href={telLink} className="font-medium text-appel-ink underline-offset-2 hover:underline">
                  📞 {idea.contactPhone}
                </a>
              ) : (
                <span>📞 {idea.contactPhone}</span>
              )
            ) : null}
            {idea.contactEmail ? (
              <a
                href={buildMailtoLink({ recipient: idea.contactEmail, subject: null, body: null })}
                className="font-medium text-email-ink underline-offset-2 hover:underline"
              >
                ✉ {idea.contactEmail}
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {idea.dueAt ? (
            <span className={`chip ${overdue ? "bg-warn-soft text-warn" : "bg-subtle text-muted"}`}>
              🕑 {new Date(idea.dueAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              {idea.dueEstimated ? " (estimée)" : ""}
              {overdue ? " · en retard" : ""}
            </span>
          ) : null}
          {idea.tags
            ? idea.tags.split(",").map((t) => (
                <span key={t} className="chip bg-subtle font-medium text-muted">
                  #{t.trim()}
                </span>
              ))
            : null}
          {idea.googleTaskId ? <span title="Synchronisé avec Google Tasks">✓ Google Tasks</span> : null}
        </div>

        <div className="-mx-2 flex flex-wrap items-center gap-1 border-t border-line pt-2">
          <button type="button" onClick={toggleStatus} disabled={isPending} className="btn btn-ghost font-semibold text-ok">
            {done ? "↺ Remettre en attente" : "✓ Traité"}
          </button>
          {actionLink ? (
            <a
              href={actionLink}
              target={idea.category === "APPEL_RAPPEL" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              {actionLabel}
            </a>
          ) : null}
          {idea.category === "PROJET" && idea.notionPageUrl ? (
            <a href={idea.notionPageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Notion ↗
            </a>
          ) : null}
          <Link href={`/ideas/${idea.id}/edit`} className="btn btn-ghost">
            Modifier
          </Link>
          <button type="button" onClick={handleDelete} disabled={isPending} className="btn btn-ghost ml-auto text-danger">
            Supprimer
          </button>
        </div>
      </div>
    </article>
  );
}
