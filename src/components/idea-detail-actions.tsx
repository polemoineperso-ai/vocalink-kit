"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { deleteIdea, restoreDue, snoozeIdea, updateIdeaStatus } from "@/lib/actions/idea-actions";
import { SNOOZE_LABELS, type SnoozeOption } from "@/lib/due-date";
import { useToast } from "@/components/toast";

/** Actions interactives de la fiche (le reste de la fiche est rendu côté serveur). */

export function DoneToggle({ id, title, done }: { id: string; title: string; done: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await updateIdeaStatus(id, done ? "PENDING" : "ACTIONED");
      router.refresh();
      if (!done) {
        toast(`Fait : ${title}`, async () => {
          await updateIdeaStatus(id, "PENDING");
          router.refresh();
        });
      }
    });
  }

  return (
    <button type="button" onClick={toggle} disabled={isPending} className="row w-full text-left">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${done ? "border-ok bg-ok text-white" : "border-faint"}`}
        aria-hidden="true"
      >
        {done ? <Check size={14} strokeWidth={3} /> : null}
      </span>
      <span className="row-title">{done ? "Fait — remettre en attente" : "Marquer comme fait"}</span>
    </button>
  );
}

export function SnoozeButtons({
  id,
  dueAt,
  dueEstimated,
}: {
  id: string;
  dueAt: string | null;
  dueEstimated: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function snooze(option: SnoozeOption) {
    startTransition(async () => {
      await snoozeIdea(id, option);
      router.refresh();
      toast(`Reportée : ${SNOOZE_LABELS[option].toLowerCase()}`, async () => {
        await restoreDue(id, dueAt, dueEstimated);
        router.refresh();
      });
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(SNOOZE_LABELS) as SnoozeOption[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => snooze(option)}
          disabled={isPending}
          className="rounded-full bg-subtle px-3 py-1 text-sm font-medium transition active:scale-95 disabled:opacity-50"
        >
          {SNOOZE_LABELS[option]}
        </button>
      ))}
    </div>
  );
}

export function DeleteIdeaButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Supprimer « ${title} » ? Cette action est définitive.`)) return;
    startTransition(async () => {
      await deleteIdea(id);
      router.push("/ideas");
    });
  }

  return (
    <button type="button" onClick={remove} disabled={isPending} className="row w-full text-danger">
      <Trash2 size={18} aria-hidden="true" />
      <span className="row-title">Supprimer l&apos;idée</span>
    </button>
  );
}
