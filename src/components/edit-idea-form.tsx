"use client";

import { useRouter } from "next/navigation";
import { IdeaReviewForm } from "@/components/idea-review-form";
import type { IdeaExtraction } from "@/lib/classification";
import type { Idea } from "@prisma/client";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toExtraction(idea: Idea): IdeaExtraction {
  // Décompose en heure LOCALE (pas UTC) — dueAt a été construit depuis les
  // champs date/heure du sélecteur, en heure locale.
  const due = idea.dueAt ? new Date(idea.dueAt) : null;
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
    dueDate: due ? `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}` : null,
    dueTime: due ? `${pad(due.getHours())}:${pad(due.getMinutes())}` : null,
  };
}

export function EditIdeaForm({ idea }: { idea: Idea }) {
  const router = useRouter();

  return (
    <IdeaReviewForm
      ideaId={idea.id}
      transcript={idea.transcript}
      extraction={toExtraction(idea)}
      initialParentId={idea.parentId}
      initialPriority={idea.priority}
      onSaved={() => router.push("/ideas")}
    />
  );
}
