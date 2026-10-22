"use client";

import { useEffect, useState, useTransition } from "react";
import { saveIdea, updateIdea, listIdeas } from "@/lib/actions/idea-actions";
import { getSelfAndDescendantIds } from "@/lib/idea-tree";
import { formatContactIdentity } from "@/lib/contact";
import type { IdeaExtraction } from "@/lib/classification";
import type { Idea, IdeaPriority } from "@prisma/client";

const CATEGORY_OPTIONS: { value: IdeaExtraction["category"]; label: string }[] = [
  { value: "PROJET", label: "Projet" },
  { value: "EMAIL", label: "Email" },
  { value: "APPEL_RAPPEL", label: "Appel / Rappel" },
  { value: "IDEE_PURE", label: "Idée pure" },
];

const PRIORITY_OPTIONS: { value: IdeaPriority; label: string }[] = [
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
];

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
}: {
  /** Présent en mode édition (met à jour une idée existante) ; absent en mode création. */
  ideaId?: string;
  transcript: string;
  extraction: IdeaExtraction | null;
  initialParentId?: string | null;
  initialPriority?: IdeaPriority;
  onSaved: (idea: Idea) => void;
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border p-4">
      {!extraction && !ideaId ? (
        <p className="text-sm text-amber-600">
          Extraction indisponible — la transcription brute a été placée dans le résumé, complétez le reste à la main.
        </p>
      ) : null}

      <button
        type="button"
        onClick={speakSummary}
        className="w-fit rounded-md border border-black px-4 py-2 text-sm font-medium"
      >
        {isSpeaking ? "🔊 Lecture…" : "🔊 Écouter le résumé"}
      </button>

      {transcript ? (
        <div className="flex flex-col gap-1 rounded-md bg-gray-50 p-3 text-sm">
          <p className="font-medium text-gray-700">Transcription — relisez plutôt que de réécouter l&apos;audio</p>
          <p className="whitespace-pre-wrap text-gray-600">{transcript}</p>
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Catégorie
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as IdeaExtraction["category"])}
          className="rounded-md border px-2 py-1.5"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Priorité
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as IdeaPriority)}
          className="rounded-md border px-2 py-1.5"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Titre
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-md border px-2 py-1.5" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Résumé
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="rounded-md border px-2 py-1.5"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Tags (séparés par des virgules)
        <input value={tags} onChange={(e) => setTags(e.target.value)} className="rounded-md border px-2 py-1.5" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Projet parent (optionnel)
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="rounded-md border px-2 py-1.5"
        >
          <option value="">— Aucun (idée indépendante) —</option>
          {availableParents.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-3 rounded-md bg-gray-50 p-3">
        <p className="text-sm font-medium">
          Contact <span className="font-normal text-gray-500">(optionnel)</span>
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Nom et prénom
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            autoComplete="off"
            className="rounded-md border px-2 py-1.5"
          />
        </label>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Téléphone
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              autoComplete="off"
              className="rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              autoComplete="off"
              className="rounded-md border px-2 py-1.5"
            />
          </label>
        </div>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Société
            <input
              value={contactCompany}
              onChange={(e) => setContactCompany(e.target.value)}
              autoComplete="off"
              className="rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Fonction
            <input
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              autoComplete="off"
              className="rounded-md border px-2 py-1.5"
            />
          </label>
        </div>
      </div>

      {category === "EMAIL" ? (
        <div className="flex flex-col gap-3 rounded-md bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Le message sera adressé à l&apos;email du contact ci-dessus.</p>
          <label className="flex flex-col gap-1 text-sm">
            Objet
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Message
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={4}
              className="rounded-md border px-2 py-1.5"
            />
          </label>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-md bg-gray-50 p-3">
        <p className="text-xs text-gray-500">
          {category === "APPEL_RAPPEL"
            ? "Laissez vide pour un créneau par défaut (demain 9h) — clairement signalé comme estimé."
            : "Échéance optionnelle — laissez vide si aucune date ne s'applique."}
        </p>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Heure
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="rounded-md border px-2 py-1.5"
            />
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {isPending ? "Enregistrement…" : ideaId ? "Mettre à jour" : "Enregistrer"}
      </button>
    </form>
  );
}
