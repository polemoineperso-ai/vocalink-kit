"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CloudUpload } from "lucide-react";
import { clearPendingAudio, loadPendingAudio } from "@/lib/pending-audio";

/**
 * Accueil : une dictée n'a pas pu être envoyée (réseau coupé, app fermée
 * trop tôt) et attend sur le téléphone. Un toucher pour l'envoyer.
 */
export function PendingDictation() {
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    loadPendingAudio().then((pending) => {
      if (alive && pending) setSavedAt(pending.savedAt);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (savedAt === null) return null;

  return (
    <div className="mt-4 rounded-2xl bg-warn-soft p-4 text-warn">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <CloudUpload size={18} aria-hidden="true" />
        Une dictée attend d&apos;être envoyée
      </p>
      <p className="mt-1 text-sm opacity-90">
        Enregistrée le {new Date(savedAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}, elle n&apos;a pas pu être transcrite. Elle est gardée sur ce téléphone.
      </p>
      <div className="mt-3 flex gap-2">
        <Link href="/capture?reprendre=1" className="btn btn-primary px-4 py-2 text-sm">
          Envoyer maintenant
        </Link>
        <button
          type="button"
          onClick={() => {
            void clearPendingAudio();
            setSavedAt(null);
          }}
          className="btn btn-ghost px-3 py-2 text-sm"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
