"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IdeaRecorder } from "@/components/idea-recorder";
import { IdeaReviewForm } from "@/components/idea-review-form";
import { useToast } from "@/components/toast";
import type { IdeaExtraction } from "@/lib/classification";

type Step = { name: "record"; attempt: number } | { name: "review"; transcript: string; extraction: IdeaExtraction | null };

/**
 * Parcours d'une idée : micro (démarre seul) → relecture → fiche de l'idée,
 * où l'action principale (Appeler, Écrire…) est sous le doigt.
 */
export function CaptureFlow() {
  const [step, setStep] = useState<Step>({ name: "record", attempt: 0 });
  const router = useRouter();
  const toast = useToast();

  if (step.name === "review") {
    return (
      <IdeaReviewForm
        transcript={step.transcript}
        extraction={step.extraction}
        onSaved={(idea) => {
          toast("Idée enregistrée");
          router.push(`/ideas/${idea.id}`);
        }}
        // « Recommencer » : nouvelle dictée, sans relancer le micro tout seul.
        onCancel={() => setStep({ name: "record", attempt: 1 })}
      />
    );
  }

  return (
    <IdeaRecorder
      key={step.attempt}
      autoStart={step.attempt === 0}
      onExtracted={(transcript, extraction) => setStep({ name: "review", transcript, extraction })}
    />
  );
}
