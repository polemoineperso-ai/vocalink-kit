"use client";

import { useState } from "react";
import Link from "next/link";
import { IdeaRecorder } from "@/components/idea-recorder";
import { IdeaReviewForm } from "@/components/idea-review-form";
import { buildMailtoLink, buildGoogleCalendarLink } from "@/lib/links";
import type { IdeaExtraction } from "@/lib/classification";
import type { Idea } from "@prisma/client";

type Step =
  | { name: "record" }
  | { name: "review"; transcript: string; extraction: IdeaExtraction | null }
  | { name: "saved"; idea: Idea };

export default function CapturePage() {
  const [step, setStep] = useState<Step>({ name: "record" });

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Enregistrer une idée</h1>
        <Link href="/ideas" className="text-sm text-gray-500 underline">
          Voir mes idées
        </Link>
      </div>

      {step.name === "record" ? (
        <IdeaRecorder onExtracted={(transcript, extraction) => setStep({ name: "review", transcript, extraction })} />
      ) : null}

      {step.name === "review" ? (
        <IdeaReviewForm
          transcript={step.transcript}
          extraction={step.extraction}
          onSaved={(idea) => setStep({ name: "saved", idea })}
        />
      ) : null}

      {step.name === "saved" ? <SavedConfirmation idea={step.idea} onRestart={() => setStep({ name: "record" })} /> : null}
    </main>
  );
}

function SavedConfirmation({ idea, onRestart }: { idea: Idea; onRestart: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <p className="text-sm text-gray-700">
        Idée enregistrée : <span className="font-medium">{idea.title}</span>
      </p>

      {idea.category === "EMAIL" ? (
        <a
          href={buildMailtoLink({ recipient: idea.contactEmail, subject: idea.emailSubject, body: idea.emailBody })}
          className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          Ouvrir dans Mail
        </a>
      ) : null}

      {idea.category === "APPEL_RAPPEL" && idea.dueAt ? (
        <div className="flex flex-col gap-1">
          {idea.dueEstimated ? (
            <p className="text-xs text-amber-600">Créneau estimé — pas de date dite explicitement.</p>
          ) : null}
          <a
            href={buildGoogleCalendarLink({ title: idea.title, details: idea.summary, start: new Date(idea.dueAt) })}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white"
          >
            Ajouter au calendrier
          </a>
        </div>
      ) : null}

      <div className="flex gap-3 text-sm">
        <button type="button" onClick={onRestart} className="text-gray-500 underline">
          Enregistrer une autre idée
        </button>
        <Link href="/ideas" className="text-gray-500 underline">
          Voir la liste
        </Link>
      </div>
    </div>
  );
}
