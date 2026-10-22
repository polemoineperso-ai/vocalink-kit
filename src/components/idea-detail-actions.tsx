"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Check, Trash2 } from "lucide-react";
import { deleteIdea, restoreDue, setIdeaStage, snoozeIdea, updateIdeaStatus } from "@/lib/actions/idea-actions";
import { STAGE_ORDER, STAGE_STYLE } from "@/lib/idea-kind";
import type { IdeaStage } from "@prisma/client";
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
      router.push("/");
    });
  }

  return (
    <button type="button" onClick={remove} disabled={isPending} className="row w-full text-danger">
      <Trash2 size={18} aria-hidden="true" />
      <span className="row-title">Supprimer l&apos;idée</span>
    </button>
  );
}

/** Étapes d'une idée : toucher une étape pour y passer ; « Archiver » la met de côté sans culpabilité. */
export function StageStepper({ id, stage }: { id: string; stage: IdeaStage }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const current = STAGE_ORDER.indexOf(stage);

  function moveTo(next: IdeaStage, message: string) {
    const previous = stage;
    startTransition(async () => {
      await setIdeaStage(id, next);
      router.refresh();
      toast(message, async () => {
        await setIdeaStage(id, previous);
        router.refresh();
      });
    });
  }

  if (stage === "ARCHIVED") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
        <p className="text-sm text-muted">Idée archivée — mise de côté, pas perdue.</p>
        <button type="button" disabled={isPending} onClick={() => moveTo("THINKING", "Idée réactivée")} className="shrink-0 text-sm font-semibold text-brand">
          Réactiver
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1.5" role="group" aria-label="Étape de l'idée">
        {STAGE_ORDER.map((s, i) => (
          <button
            key={s}
            type="button"
            disabled={isPending || s === stage}
            aria-pressed={s === stage}
            onClick={() => moveTo(s, `Étape : ${STAGE_STYLE[s].label}`)}
            className="flex-1 text-center"
          >
            <span className={`block h-1.5 rounded-full transition ${i <= current ? STAGE_STYLE[stage].bar : "bg-line"}`} />
            <span className={`mt-1.5 block text-xs ${s === stage ? "font-semibold text-ink" : "text-muted"}`}>{STAGE_STYLE[s].label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => moveTo("ARCHIVED", "Idée archivée")}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-muted"
      >
        <Archive size={15} aria-hidden="true" />
        Archiver cette idée
      </button>
    </div>
  );
}
