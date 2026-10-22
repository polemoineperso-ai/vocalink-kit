"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, CircleCheck, Copy, Stethoscope } from "lucide-react";
import { saveFirstName } from "@/lib/actions/settings-actions";
import { checkHealth, type HealthItem } from "@/lib/actions/health-actions";
import { useToast } from "@/components/toast";

/** Parties interactives de la page Réglages. */

export function FirstNameField({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const changed = value.trim() !== initial;

  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await saveFirstName(value);
          router.refresh();
          toast("Prénom enregistré");
        });
      }}
    >
      <label className="row-title shrink-0" htmlFor="first-name">
        Prénom
      </label>
      <input
        id="first-name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="given-name"
        className="!border-transparent !bg-transparent !px-0 text-right !shadow-none"
        placeholder="Votre prénom"
      />
      {changed ? (
        <button type="submit" disabled={isPending} className="shrink-0 font-semibold text-brand">
          OK
        </button>
      ) : null}
    </form>
  );
}

export function CopyShortcutUrl() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/?dicter=1`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copiez cette adresse :", url);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} className="row w-full text-left">
      <span className="icon-btn bg-brand-soft text-brand-ink" aria-hidden="true">
        {copied ? <Check size={17} /> : <Copy size={17} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="row-title block">{copied ? "Adresse copiée" : "Copier l'adresse du raccourci"}</span>
        <span className="row-sub block">Ouvre Vocalink micro déjà lancé</span>
      </span>
    </button>
  );
}

/** « Tout fonctionne ? » : base de données, clé et crédit OpenAI. */
export function HealthCheck() {
  const [items, setItems] = useState<HealthItem[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      try {
        setItems(await checkHealth());
      } catch {
        setItems([{ label: "Vocalink", ok: false, detail: "Serveur injoignable — vérifiez la connexion." }]);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={run} disabled={isPending} className="row w-full text-left">
        <span className="icon-btn bg-ok-soft text-ok" aria-hidden="true">
          <Stethoscope size={17} className={isPending ? "animate-pulse" : ""} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="row-title block">{isPending ? "Vérification…" : "Tout fonctionne ?"}</span>
          <span className="row-sub block">Vérifie la base de données, la clé et le crédit OpenAI</span>
        </span>
      </button>
      {items && !isPending
        ? items.map((item) => (
            <div key={item.label} className="row items-start">
              {item.ok ? (
                <CircleCheck size={20} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />
              ) : (
                <CircleAlert size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className="row-title block">{item.label}</span>
                <span className={`row-sub block ${item.ok ? "" : "!text-danger"}`}>{item.detail}</span>
              </span>
            </div>
          ))
        : null}
    </>
  );
}
