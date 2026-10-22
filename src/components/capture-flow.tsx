"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdeaRecorder } from "@/components/idea-recorder";
import { IdeaReviewForm } from "@/components/idea-review-form";
import { buildMailtoLink, buildGoogleCalendarLink } from "@/lib/links";
import { CATEGORY_STYLE } from "@/lib/category-style";
import type { IdeaExtraction } from "@/lib/classification";
import type { Idea } from "@prisma/client";

type Step =
  | { name: "record" }
  | { name: "review"; transcript: string; extraction: IdeaExtraction | null }
  | { name: "saved"; idea: Idea };

/** Parcours complet d'une idée : micro → relecture → confirmation. Utilisé par l'accueil et /capture. */
export function CaptureFlow({ autoStart = false }: { autoStart?: boolean }) {
  const [step, setStep] = useState<Step>({ name: "record" });
  // Le lancement automatique ne vaut que pour la première dictée.
  const [autoStartPending, setAutoStartPending] = useState(autoStart);
  const router = useRouter();

  return (
    <>
      {step.name === "record" ? (
        <IdeaRecorder
          autoStart={autoStartPending}
          onExtracted={(transcript, extraction) => {
            setAutoStartPending(false);
            setStep({ name: "review", transcript, extraction });
          }}
        />
      ) : null}

      {step.name === "review" ? (
        <IdeaReviewForm
          transcript={step.transcript}
          extraction={step.extraction}
          onSaved={(idea) => {
            setStep({ name: "saved", idea });
            // Rafraîchit les compteurs de l'accueil.
            router.refresh();
          }}
          onCancel={() => setStep({ name: "record" })}
        />
      ) : null}

      {step.name === "saved" ? <SavedConfirmation idea={step.idea} onRestart={() => setStep({ name: "record" })} /> : null}
    </>
  );
}

function SavedConfirmation({ idea, onRestart }: { idea: Idea; onRestart: () => void }) {
  const style = CATEGORY_STYLE[idea.category];

  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-ok-soft text-2xl text-ok" aria-hidden="true">
        ✓
      </div>
      <div>
        <p className="text-lg font-semibold">Idée enregistrée</p>
        <p className="mt-1 text-muted">{idea.title}</p>
        <span className={`chip mt-3 ${style.chip}`}>
          {style.icon} {style.label}
        </span>
      </div>

      {idea.category === "EMAIL" ? (
        <a
          href={buildMailtoLink({ recipient: idea.contactEmail, subject: idea.emailSubject, body: idea.emailBody })}
          className="btn btn-primary w-full"
        >
          Ouvrir dans Mail
        </a>
      ) : null}

      {idea.category === "APPEL_RAPPEL" && idea.dueAt ? (
        <div className="flex w-full flex-col gap-1">
          <a
            href={buildGoogleCalendarLink({ title: idea.title, details: idea.summary, start: new Date(idea.dueAt) })}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full"
          >
            Ajouter au calendrier
          </a>
          {idea.dueEstimated ? (
            <p className="text-xs text-warn">Créneau estimé — pas de date dite explicitement.</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex w-full gap-2">
        <button type="button" onClick={onRestart} className="btn btn-secondary flex-1">
          Enregistrer une autre idée
        </button>
        <Link href="/ideas" className="btn btn-secondary flex-1">
          Voir mes idées
        </Link>
      </div>
    </div>
  );
}
