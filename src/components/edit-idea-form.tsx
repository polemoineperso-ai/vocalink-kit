"use client";

import { useRouter } from "next/navigation";
import { toZonedTime, format } from "date-fns-tz";
import { IdeaReviewForm } from "@/components/idea-review-form";
import { useToast } from "@/components/toast";
import { APP_TIMEZONE } from "@/lib/due-date";
import type { IdeaExtraction } from "@/lib/classification";
import type { Idea } from "@prisma/client";

function toExtraction(idea: Idea): IdeaExtraction {
  // Date et heure en heure de PARIS, pas celle de la machine : la page est
  // d'abord calculée sur le serveur (UTC), puis affichée sur le téléphone.
  const due = idea.dueAt ? toZonedTime(new Date(idea.dueAt), APP_TIMEZONE) : null;
  return {
    category: idea.category,
    title: idea.title,
    summary: idea.summary,
    tags: idea.tags ? idea.tags.split(",").map((t) => t.trim()) : [],
    contactName: idea.contactName,
    contactPhone: idea.contactPhone,
    contactEmail: idea.contactEmail,
    contactCompany: idea.contactCompany,
    contactRole: idea.contactRole,
    emailSubject: idea.emailSubject,
    emailBody: idea.emailBody,
    dueDate: due ? format(due, "yyyy-MM-dd", { timeZone: APP_TIMEZONE }) : null,
    dueTime: due ? format(due, "HH:mm", { timeZone: APP_TIMEZONE }) : null,
  };
}

export function EditIdeaForm({ idea }: { idea: Idea }) {
  const router = useRouter();
  const toast = useToast();

  return (
    <IdeaReviewForm
      ideaId={idea.id}
      transcript={idea.transcript}
      extraction={toExtraction(idea)}
      initialParentId={idea.parentId}
      initialPriority={idea.priority}
      onSaved={() => {
        toast("Modifications enregistrées");
        router.push(`/ideas/${idea.id}`);
      }}
      onCancel={() => router.push(`/ideas/${idea.id}`)}
    />
  );
}
