"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateIdeaStatus, deleteIdea } from "@/lib/actions/idea-actions";
import { buildMailtoLink, buildGoogleCalendarLink, buildTelLink } from "@/lib/links";
import { formatContactIdentity, hasContact } from "@/lib/contact";
import type { Idea } from "@prisma/client";

const CATEGORY_LABELS: Record<Idea["category"], string> = {
  PROJET: "Projet",
  EMAIL: "Email",
  APPEL_RAPPEL: "Appel / Rappel",
  IDEE_PURE: "Idée pure",
};

const PRIORITY_LABELS: Record<Idea["priority"], string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};

const PRIORITY_STYLES: Record<Idea["priority"], string> = {
  LOW: "border-gray-200 text-gray-500",
  MEDIUM: "border-gray-300 text-gray-600",
  HIGH: "border-red-300 text-red-600",
};

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

  function toggleStatus() {
    startTransition(async () => {
      await updateIdeaStatus(idea.id, idea.status === "PENDING" ? "ACTIONED" : "PENDING");
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

  const contactIdentity = formatContactIdentity(idea);
  const telLink = buildTelLink(idea.contactPhone);

  return (
    <div className={`flex flex-col gap-2 rounded-lg border p-4 ${isChild ? "ml-6 border-dashed" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {isChild && parentTitle ? <p className="text-xs text-gray-400">↳ rattaché à : {parentTitle}</p> : null}
          <p className="font-medium">{idea.title}</p>
          <p className="text-sm text-gray-500">{idea.summary}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {idea.priority !== "MEDIUM" ? (
            <span className={`rounded-full border px-2 py-0.5 text-xs ${PRIORITY_STYLES[idea.priority]}`}>
              {PRIORITY_LABELS[idea.priority]}
            </span>
          ) : null}
          <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">
            {CATEGORY_LABELS[idea.category]}
          </span>
        </div>
      </div>

      {idea.tags ? (
        <div className="flex flex-wrap gap-1">
          {idea.tags.split(",").map((t) => (
            <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {t.trim()}
            </span>
          ))}
        </div>
      ) : null}

      {hasContact(idea) ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
          {contactIdentity ? <span>👤 {contactIdentity}</span> : null}
          {idea.contactPhone ? (
            telLink ? (
              <a href={telLink} className="underline">
                📞 {idea.contactPhone}
              </a>
            ) : (
              <span>📞 {idea.contactPhone}</span>
            )
          ) : null}
          {idea.contactEmail ? (
            <a href={buildMailtoLink({ recipient: idea.contactEmail, subject: null, body: null })} className="underline">
              ✉️ {idea.contactEmail}
            </a>
          ) : null}
        </div>
      ) : null}

      {idea.dueAt ? (
        <p className="text-xs text-gray-500">
          Échéance : {new Date(idea.dueAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
          {idea.dueEstimated ? <span className="text-amber-600"> (estimée)</span> : null}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{new Date(idea.createdAt).toLocaleString("fr-FR")}</span>
        <div className="flex items-center gap-3">
          {idea.googleTaskId ? (
            <span className="text-gray-400" title="Synchronisé avec Google Tasks">
              ✓ Dans Google Tasks
            </span>
          ) : null}
          {idea.category === "PROJET" && idea.notionPageUrl ? (
            <a
              href={idea.notionPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 underline"
            >
              Ouvrir dans Notion ↗
            </a>
          ) : null}
          {actionLink ? (
            <a
              href={actionLink}
              target={idea.category === "APPEL_RAPPEL" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="text-gray-600 underline"
            >
              Ouvrir
            </a>
          ) : null}
          <Link href={`/ideas/${idea.id}/edit`} className="text-gray-600 underline">
            Modifier
          </Link>
          <button type="button" onClick={toggleStatus} disabled={isPending} className="text-gray-600 underline">
            {idea.status === "PENDING" ? "Marquer traité" : "Marquer en attente"}
          </button>
          <button type="button" onClick={handleDelete} disabled={isPending} className="text-red-600 underline">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
