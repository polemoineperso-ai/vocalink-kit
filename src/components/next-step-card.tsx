"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { acceptNextStep, dismissNextStep, requestNextStep } from "@/lib/actions/next-step-actions";
import { NEXT_STEP_LABELS, type NextStep } from "@/lib/next-step";
import { useToast } from "@/components/toast";

/**
 * Suggestion de prochaine étape (à la demande). Rien n'est créé sans un
 * toucher explicite : « Créer l'action » / « Ajouter en note ».
 */
export function NextStepCard({ ideaId, initial }: { ideaId: string; initial: NextStep | null }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<NextStep | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [thinking, startThinking] = useTransition();
  const [acting, startActing] = useTransition();

  function suggest() {
    setError(null);
    startThinking(async () => {
      const result = await requestNextStep(ideaId);
      if (result.ok) setStep(result.step);
      else setError(result.error);
    });
  }

  function accept() {
    startActing(async () => {
      const result = await acceptNextStep(ideaId);
      setStep(null);
      router.refresh();
      if (result?.created === "action") toast("Action créée dans « À faire » · l'idée passe « En cours »");
      else if (result?.created === "note") toast("Ajoutée aux notes de l'idée");
    });
  }

  function dismiss() {
    startActing(async () => {
      await dismissNextStep(ideaId);
      setStep(null);
    });
  }

  if (!step) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={suggest}
          disabled={thinking}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-appel-soft py-3.5 font-semibold text-appel-ink transition active:scale-[0.99] disabled:opacity-70"
        >
          <Sparkles size={17} className={thinking ? "animate-pulse" : ""} aria-hidden="true" />
          {thinking ? "Vocalink réfléchit…" : "Suggérer une prochaine étape"}
        </button>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <section className="mt-4 rounded-2xl bg-appel-soft p-4" aria-label="Prochaine étape suggérée">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-appel">
        <Sparkles size={14} aria-hidden="true" />
        Prochaine étape possible · {NEXT_STEP_LABELS[step.kind]}
      </p>
      <p className="mt-1.5 font-semibold leading-snug text-appel-ink">{step.title}</p>
      {step.why ? <p className="mt-1 text-sm leading-relaxed text-appel-ink/80">{step.why}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={accept}
          disabled={acting || thinking}
          className="rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-appel-ink transition active:scale-95"
        >
          {step.kind === "think" ? "Ajouter en note" : "Créer l'action"}
        </button>
        <button
          type="button"
          onClick={suggest}
          disabled={acting || thinking}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-appel-ink/80 transition active:scale-95"
        >
          <RefreshCw size={13} className={thinking ? "animate-spin" : ""} aria-hidden="true" />
          Autre idée
        </button>
        <button
          type="button"
          onClick={dismiss}
          disabled={acting || thinking}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-appel-ink/80 transition active:scale-95"
        >
          Ignorer
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
