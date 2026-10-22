"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, saveFirstName } from "@/lib/actions/settings-actions";
import { NotificationsHelp, useNotifications } from "@/components/notifications-toggle";

/**
 * Premier lancement : prénom, puis notifications (brief du matin). Tout
 * reste facultatif — « Plus tard » ne bloque jamais l'accès à l'app.
 */
export function Onboarding() {
  const [step, setStep] = useState<"name" | "notifications" | "ready">("name");
  const [firstName, setFirstName] = useState("");
  const [isPending, startTransition] = useTransition();
  const notifications = useNotifications();
  const router = useRouter();

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await saveFirstName(firstName);
      setStep("notifications");
    });
  }

  async function enableNotifications() {
    await notifications.enable();
    setStep("ready");
  }

  function finish() {
    startTransition(async () => {
      await completeOnboarding();
      router.refresh();
    });
  }

  const dots = (
    <div className="flex justify-center gap-2" aria-hidden="true">
      {(["name", "notifications", "ready"] as const).map((s) => (
        <span key={s} className={`h-2 rounded-full transition-all ${s === step ? "w-6 bg-brand" : "w-2 bg-line"}`} />
      ))}
    </div>
  );

  return (
    <section className="card flex flex-col gap-6 p-6">
      {dots}

      {step === "name" ? (
        <form onSubmit={submitName} className="flex flex-col gap-5 text-center">
          <div>
            <p className="text-4xl" aria-hidden="true">👋</p>
            <h1 className="mt-3 text-2xl font-semibold">Bienvenue dans Vocalink</h1>
            <p className="mt-2 text-muted">Comment voulez-vous que votre assistant vous appelle ?</p>
          </div>
          <label className="field-label text-left">
            Votre prénom
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus autoComplete="given-name" placeholder="Marie" />
          </label>
          <button type="submit" disabled={isPending} className="btn btn-primary w-full py-3.5">
            Continuer →
          </button>
        </form>
      ) : null}

      {step === "notifications" ? (
        <div className="flex flex-col gap-5 text-center">
          <div>
            <p className="text-4xl" aria-hidden="true">🌅</p>
            <h1 className="mt-3 text-2xl font-semibold">{firstName.trim() ? `Enchanté, ${firstName.trim()} !` : "Le brief du matin"}</h1>
            <p className="mt-2 text-muted">
              Chaque matin, une notification avec ce qui est prévu aujourd&apos;hui et ce qui a pris du retard. Plus
              aucune idée oubliée.
            </p>
          </div>
          <NotificationsHelp state={notifications.state} />
          {notifications.error ? <p className="text-sm text-danger">{notifications.error}</p> : null}
          {notifications.state === "off" || notifications.state === "working" ? (
            <button
              type="button"
              onClick={enableNotifications}
              disabled={notifications.state === "working"}
              className="btn btn-primary w-full py-3.5"
            >
              🔔 Activer les notifications
            </button>
          ) : null}
          <button type="button" onClick={() => setStep("ready")} className="btn btn-ghost">
            {notifications.state === "on" ? "Continuer →" : "Plus tard"}
          </button>
        </div>
      ) : null}

      {step === "ready" ? (
        <div className="flex flex-col gap-5 text-center">
          <div>
            <p className="text-4xl" aria-hidden="true">🎙️</p>
            <h1 className="mt-3 text-2xl font-semibold">Tout est prêt</h1>
            <p className="mt-2 text-muted">
              Touchez le micro, dites votre idée comme elle vient. Vocalink la range, retrouve les contacts et les dates,
              et vous la rappelle au bon moment.
            </p>
          </div>
          <button type="button" onClick={finish} disabled={isPending} className="btn btn-primary w-full py-3.5">
            Dicter ma première idée
          </button>
        </div>
      ) : null}
    </section>
  );
}
