"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getPushPublicKey, sendTestPush, subscribePush, unsubscribePush } from "@/lib/actions/settings-actions";

/**
 * Activation des notifications (brief du matin). Sur iPhone, elles ne
 * fonctionnent qu'une fois Vocalink ajouté à l'écran d'accueil (iOS 16.4+) :
 * on l'explique au lieu d'afficher un bouton qui ne marcherait pas.
 */

type PushState = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on" | "working";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

async function registerWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

export function useNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        if (!cancelled) setState(isIos() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const registration = await registerWorker();
        const sub = await registration.pushManager.getSubscription();
        if (!cancelled) setState(sub ? "on" : "off");
      } catch {
        if (!cancelled) setState("unsupported");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable(): Promise<boolean> {
    setError(null);
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return false;
      }
      const registration = await registerWorker();
      await navigator.serviceWorker.ready;
      const publicKey = await getPushPublicKey();
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const result = await subscribePush(JSON.parse(JSON.stringify(sub)));
      if (!result.ok) throw new Error("abonnement refusé");
      setState("on");
      await sendTestPush();
      return true;
    } catch (e) {
      console.error("[notifications] activation impossible", e);
      setError("Activation impossible pour le moment. Réessayez plus tard.");
      setState("off");
      return false;
    }
  }

  async function disable(): Promise<void> {
    setState("working");
    const registration = await navigator.serviceWorker.getRegistration();
    const sub = await registration?.pushManager.getSubscription();
    if (sub) {
      await unsubscribePush(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
  }

  return { state, error, enable, disable };
}

/** Explication adaptée quand les notifications ne peuvent pas être activées ici. */
export function NotificationsHelp({ state }: { state: PushState }) {
  if (state === "ios-install") {
    return (
      <p className="text-sm text-muted">
        Sur iPhone, ajoutez d&apos;abord Vocalink à l&apos;écran d&apos;accueil (bouton <b>Partager</b> →{" "}
        <b>Sur l&apos;écran d&apos;accueil</b>), puis ouvrez-le depuis l&apos;icône.
      </p>
    );
  }
  if (state === "denied") {
    return (
      <p className="text-sm text-muted">
        Les notifications sont bloquées pour Vocalink. Autorisez-les dans les réglages du téléphone ou du navigateur.
      </p>
    );
  }
  if (state === "unsupported") {
    return <p className="text-sm text-muted">Ce navigateur ne permet pas les notifications.</p>;
  }
  return null;
}

/** Ligne compacte pour l'accueil : état + bouton. */
export function NotificationsToggle({ hideWhenOn = false }: { hideWhenOn?: boolean }) {
  const { state, error, enable, disable } = useNotifications();
  if (state === "loading" || (hideWhenOn && state === "on")) return null;

  return (
    <div className="group">
      <div className="row items-start">
        <span className="icon-btn bg-brand-soft text-brand-ink" aria-hidden="true">
          <Bell size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="row-title">Brief du matin</p>
          <p className="row-sub">{state === "on" ? "Activé sur cet appareil." : "Votre programme du jour, chaque matin."}</p>
          <div className="mt-1.5">
            <NotificationsHelp state={state} />
          </div>
          {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
        </div>
        {state === "on" ? (
          <button type="button" onClick={disable} className="btn btn-ghost">
            Désactiver
          </button>
        ) : state === "off" || state === "working" ? (
          <button type="button" onClick={enable} disabled={state === "working"} className="btn btn-primary px-4 py-2 text-sm">
            Activer
          </button>
        ) : null}
      </div>
    </div>
  );
}
