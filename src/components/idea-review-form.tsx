"use client";

import { useEffect, useState, useTransition } from "react";
import { saveIdea, updateIdea, listIdeas } from "@/lib/actions/idea-actions";
import { getSelfAndDescendantIds } from "@/lib/idea-tree";
import { formatContactIdentity } from "@/lib/contact";
import { CATEGORY_ORDER, CATEGORY_STYLE, PRIORITY_ORDER, PRIORITY_STYLE, initials } from "@/lib/category-style";
import type { IdeaExtraction } from "@/lib/classification";
import type { Idea, IdeaPriority } from "@prisma/client";

/**
 * Formulaire éditable pré-rempli depuis l'extraction IA (ou vide si
 * l'extraction a échoué — repli sur la transcription brute, complétée à la
 * main). L'IA ne persiste jamais rien : c'est ce formulaire, soumis
 * explicitement, qui écrit en base via saveIdea.
 */
export function IdeaReviewForm({
  ideaId,
  transcript,
  extraction,
  initialParentId,
  initialPriority,
  onSaved,
  onCancel,
}: {
  /** Présent en mode édition (met à jour une idée existante) ; absent en mode création. */
  ideaId?: string;
  transcript: string;
  extraction: IdeaExtraction | null;
  initialParentId?: string | null;
  initialPriority?: IdeaPriority;
  onSaved: (idea: Idea) => void;
  /** Retour à l'enregistrement (création uniquement). */
  onCancel?: () => void;
}) {
  const [category, setCategory] = useState<IdeaExtraction["category"]>(extraction?.category ?? "IDEE_PURE");
  const [priority, setPriority] = useState<IdeaPriority>(initialPriority ?? "MEDIUM");
  const [title, setTitle] = useState(extraction?.title ?? "");
  const [summary, setSummary] = useState(extraction?.summary ?? transcript.slice(0, 300));
  const [tags, setTags] = useState((extraction?.tags ?? []).join(", "));
  const [contactName, setContactName] = useState(extraction?.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(extraction?.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(extraction?.contactEmail ?? "");
  const [contactCompany, setContactCompany] = useState(extraction?.contactCompany ?? "");
  const [contactRole, setContactRole] = useState(extraction?.contactRole ?? "");
  const [emailSubject, setEmailSubject] = useState(extraction?.emailSubject ?? "");
  const [emailBody, setEmailBody] = useState(extraction?.emailBody ?? "");
  const [dueDate, setDueDate] = useState(extraction?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(extraction?.dueTime ?? "");
  const [parentId, setParentId] = useState(initialParentId ?? "");
  const [parentOptions, setParentOptions] = useState<Idea[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    listIdeas().then(setParentOptions);
  }, []);

  const excludedParentIds = ideaId ? getSelfAndDescendantIds(ideaId, parentOptions) : new Set<string>();
  const availableParents = parentOptions.filter((i) => !excludedParentIds.has(i.id));

  function speakSummary() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const PRIORITY_SPOKEN: Record<IdeaPriority, string> = { LOW: "basse", MEDIUM: "moyenne", HIGH: "haute" };
    const parts = [title || "Sans titre", summary, `Priorité ${PRIORITY_SPOKEN[priority]}`];
    const contactIdentity = formatContactIdentity({ contactName, contactPhone, contactEmail, contactCompany, contactRole });
    if (contactIdentity) parts.push(`Contact : ${contactIdentity}`);
    if (contactPhone) parts.push(`Téléphone : ${contactPhone}`);
    if (contactEmail) parts.push(`Email : ${contactEmail}`);
    if (category === "EMAIL" && emailSubject) parts.push(`Objet : ${emailSubject}`);
    if (dueDate) parts.push(`Échéance le ${dueDate}${dueTime ? ` à ${dueTime}` : ""}`);
    else if (category === "APPEL_RAPPEL") parts.push("Créneau estimé, non précisé");

    const utterance = new SpeechSynthesisUtterance(parts.join(". "));
    utterance.lang = "fr-FR";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() && !summary.trim()) {
      setError("Renseignez au moins un titre ou un résumé.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const fields = {
        category,
        priority,
        title,
        summary,
        tags: tags.split(",").map((t) => t.trim()),
        contactName,
        contactPhone,
        contactEmail,
        contactCompany,
        contactRole,
        emailSubject,
        emailBody,
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        parentId: parentId || null,
      };
      const idea = ideaId ? await updateIdea(ideaId, fields) : await saveIdea({ ...fields, transcript });
      onSaved(idea);
    });
  }

  const contactIdentity = formatContactIdentity({ contactName, contactPhone, contactEmail, contactCompany, contactRole });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!extraction && !ideaId ? (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          Extraction indisponible — la transcription brute a été placée dans le résumé, complétez le reste à la main.
        </p>
      ) : null}

      {transcript ? (
        <div className="card flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="section-title">Vous avez dit</p>
            <button type="button" onClick={speakSummary} className="btn btn-ghost">
              {isSpeaking ? "🔊 Lecture…" : "🔊 Écouter le résumé"}
            </button>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-muted">« {transcript} »</p>
        </div>
      ) : null}

      <div className="card flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <p className="section-title">Catégorie</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Catégorie">
            {CATEGORY_ORDER.map((value) => {
              const style = CATEGORY_STYLE[value];
              const selected = category === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategory(value)}
                  className={`pill ${selected ? style.selected : ""}`}
                >
                  <span aria-hidden="true">{style.icon}</span>
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="field-label">
          Titre
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
        </label>

        <label className="field-label">
          Résumé
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
        </label>

        <div className="flex flex-col gap-2">
          <p className="section-title">Priorité</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Priorité">
            {PRIORITY_ORDER.map((value) => {
              const style = PRIORITY_STYLE[value];
              const selected = priority === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPriority(value)}
                  className={`pill ${selected ? style.selected : ""}`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink"
            aria-hidden="true"
          >
            {contactName ? initials(contactName) : "👤"}
          </div>
          <div className="min-w-0">
            <p className="section-title">Contact</p>
            <p className="truncate text-sm text-muted">{contactIdentity ?? "Optionnel — personne à contacter"}</p>
          </div>
        </div>
        <label className="field-label">
          Nom et prénom
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="off" />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="field-label">
            Téléphone
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} autoComplete="off" />
          </label>
          <label className="field-label">
            Email
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} autoComplete="off" />
          </label>
          <label className="field-label">
            Société
            <input value={contactCompany} onChange={(e) => setContactCompany(e.target.value)} autoComplete="off" />
          </label>
          <label className="field-label">
            Fonction
            <input value={contactRole} onChange={(e) => setContactRole(e.target.value)} autoComplete="off" />
          </label>
        </div>
      </div>

      {category === "EMAIL" ? (
        <div className="card flex flex-col gap-4 p-5">
          <div>
            <p className="section-title">Email à envoyer</p>
            <p className="mt-1 text-sm text-muted">Le message sera adressé à l&apos;email du contact ci-dessus.</p>
          </div>
          <label className="field-label">
            Objet
            <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          </label>
          <label className="field-label">
            Message
            <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={4} />
          </label>
        </div>
      ) : null}

      <div className="card flex flex-col gap-4 p-5">
        <div>
          <p className="section-title">Échéance</p>
          <p className="mt-1 text-sm text-muted">
            {category === "APPEL_RAPPEL"
              ? "Laissez vide pour un créneau par défaut (demain 9h), signalé comme estimé."
              : "Optionnelle — laissez vide si aucune date ne s'applique."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">
            Date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="field-label">
            Heure
            <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </label>
        </div>
      </div>

      <details className="card group p-5">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted">
          <span className="group-open:hidden">＋</span>
          <span className="hidden group-open:inline">−</span> Tags et projet parent
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <label className="field-label">
            Tags (séparés par des virgules)
            <input value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          <label className="field-label">
            Projet parent
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">— Aucun (idée indépendante) —</option>
              {availableParents.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      {error ? <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p> : null}

      <div className="sticky bottom-3 flex gap-2">
        <button type="submit" disabled={isPending} className="btn btn-primary flex-1 py-4 text-base shadow-lg">
          {isPending ? "Enregistrement…" : ideaId ? "Mettre à jour" : "Enregistrer"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} disabled={isPending} className="btn btn-secondary py-4">
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}
