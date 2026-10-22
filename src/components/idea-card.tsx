"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { snoozeIdea, updateIdeaStatus } from "@/lib/actions/idea-actions";
import { buildMailtoLink, buildGoogleCalendarLink, buildTelLink, buildSmsLink, buildWhatsAppLink } from "@/lib/links";
import { SNOOZE_LABELS, todayInParis, type SnoozeOption } from "@/lib/due-date";
import { formatContactIdentity, hasContact } from "@/lib/contact";
import { CATEGORY_STYLE, PRIORITY_STYLE } from "@/lib/category-style";
import { splitTags } from "@/lib/idea-filter";
import type { Idea } from "@prisma/client";

export function IdeaCard({
  idea,
  isChild,
  parentTitle,
  onTagClick,
}: {
  idea: Idea;
  /** Rendu indenté, rattaché visuellement à un parent (voir /ideas et lib/idea-tree.ts). */
  isChild?: boolean;
  parentTitle?: string;
  /** Toucher un tag filtre la liste sur ce tag. */
  onTagClick?: (tag: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const style = CATEGORY_STYLE[idea.category];
  const done = idea.status === "ACTIONED";
  const now = new Date();
  const overdue = !done && idea.dueAt !== null && new Date(idea.dueAt) < now;
  const dueToday = !done && idea.dueAt !== null && todayInParis(new Date(idea.dueAt)) === todayInParis(now);

  function toggleStatus() {
    startTransition(async () => {
      await updateIdeaStatus(idea.id, done ? "PENDING" : "ACTIONED");
      router.refresh();
    });
  }

  function snooze(option: SnoozeOption) {
    startTransition(async () => {
      await snoozeIdea(idea.id, option);
      router.refresh();
    });
  }

  // Pour un Email, le message préparé part avec le lien email (contact ou non).
  const emailLink =
    idea.category === "EMAIL"
      ? buildMailtoLink({ recipient: idea.contactEmail, subject: idea.emailSubject, body: idea.emailBody })
      : idea.contactEmail
        ? buildMailtoLink({ recipient: idea.contactEmail, subject: null, body: null })
        : null;
  const calendarLink =
    idea.category === "APPEL_RAPPEL" && idea.dueAt
      ? buildGoogleCalendarLink({ title: idea.title, details: idea.summary, start: new Date(idea.dueAt) })
      : null;

  const contactIdentity = formatContactIdentity(idea);
  const telLink = buildTelLink(idea.contactPhone);
  const smsLink = buildSmsLink(idea.contactPhone);
  const whatsAppLink = buildWhatsAppLink(idea.contactPhone);
  const contactAction = "inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold shadow-sm transition active:scale-95";

  return (
    <article className={`card relative flex overflow-hidden ${isChild ? "ml-6" : ""} ${done ? "opacity-70" : ""}`}>
      <div className={`w-1.5 shrink-0 ${done ? "bg-line" : style.stripe}`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        {/* Pastilles au-dessus du titre : le titre garde toute la largeur sur téléphone. */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`chip ${style.chip}`}>
            <span aria-hidden="true">{style.icon}</span>
            {style.label}
          </span>
          {idea.priority === "HIGH" ? <span className={`chip ${PRIORITY_STYLE.HIGH.chip}`}>Haute</span> : null}
          {idea.priority === "LOW" ? <span className={`chip ${PRIORITY_STYLE.LOW.chip}`}>Basse</span> : null}
          {done ? <span className="chip bg-ok-soft text-ok">✓ Fait</span> : null}
        </div>
        {/* Toucher le titre ou le texte ouvre la modification. */}
        <Link href={`/ideas/${idea.id}/edit`} className="-m-1 min-w-0 rounded-xl p-1 transition hover:bg-subtle active:bg-subtle">
          {isChild && parentTitle ? <p className="mb-1 text-xs text-muted">↳ {parentTitle}</p> : null}
          <h2 className={`font-semibold leading-snug ${done ? "text-muted line-through" : ""}`}>{idea.title}</h2>
          {idea.summary ? <p className="mt-1 text-sm leading-relaxed text-muted">{idea.summary}</p> : null}
        </Link>

        {hasContact(idea) ? (
          <div className="flex flex-col gap-2 rounded-xl bg-subtle px-3 py-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {contactIdentity ? <span className="font-medium">👤 {contactIdentity}</span> : null}
              {idea.contactPhone ? <span className="text-muted">{idea.contactPhone}</span> : null}
              {idea.contactEmail ? <span className="break-all text-muted">{idea.contactEmail}</span> : null}
            </div>
            {/* Contacter en un toucher. */}
            {telLink || emailLink ? (
              <div className="flex flex-wrap gap-1.5">
                {telLink ? (
                  <a href={telLink} className={`${contactAction} text-appel-ink`}>
                    📞 Appeler
                  </a>
                ) : null}
                {smsLink ? (
                  <a href={smsLink} className={`${contactAction} text-ink`}>
                    💬 SMS
                  </a>
                ) : null}
                {whatsAppLink ? (
                  <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className={`${contactAction} text-email-ink`}>
                    WhatsApp
                  </a>
                ) : null}
                {emailLink ? (
                  <a href={emailLink} className={`${contactAction} text-projet-ink`}>
                    ✉ {idea.category === "EMAIL" ? "Écrire l'email" : "Email"}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {!done && idea.dueAt && (overdue || dueToday) ? (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-medium text-muted">⏰ Reporter :</span>
            {(Object.keys(SNOOZE_LABELS) as SnoozeOption[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => snooze(option)}
                disabled={isPending}
                className="rounded-full border border-line bg-surface px-3 py-1 font-medium transition hover:bg-subtle active:scale-95 disabled:opacity-50"
              >
                {SNOOZE_LABELS[option]}
              </button>
            ))}
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
          {splitTags(idea.tags).map((tag) =>
            onTagClick ? (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick(tag)}
                className="chip bg-subtle font-medium text-muted transition hover:bg-line hover:text-ink active:scale-95"
              >
                #{tag}
              </button>
            ) : (
              <span key={tag} className="chip bg-subtle font-medium text-muted">
                #{tag}
              </span>
            ),
          )}
          {idea.googleTaskId ? <span title="Synchronisé avec Google Tasks">✓ Google Tasks</span> : null}
        </div>

        <div className="flex flex-wrap items-center gap-1 border-t border-line pt-3">
          {done ? (
            <button type="button" onClick={toggleStatus} disabled={isPending} className="btn btn-ghost -ml-2">
              ↺ Remettre en attente
            </button>
          ) : (
            <button type="button" onClick={toggleStatus} disabled={isPending} className="btn btn-secondary px-3 py-1.5 text-sm">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-current" aria-hidden="true" />
              Marquer fait
            </button>
          )}
          {calendarLink ? (
            <a href={calendarLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Agenda
            </a>
          ) : null}
          {emailLink && !hasContact(idea) ? (
            <a href={emailLink} className="btn btn-ghost">
              Écrire l&apos;email
            </a>
          ) : null}
          {idea.category === "PROJET" && idea.notionPageUrl ? (
            <a href={idea.notionPageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Notion ↗
            </a>
          ) : null}
          <Link href={`/ideas/${idea.id}/edit`} aria-label="Modifier ou supprimer" className="btn btn-ghost ml-auto">
            ✎<span className="hidden min-[360px]:inline"> Modifier</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
