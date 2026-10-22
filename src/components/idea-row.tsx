"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Mail, Phone } from "lucide-react";
import { restoreDue, snoozeIdea, updateIdeaStatus } from "@/lib/actions/idea-actions";
import { buildMailtoLink, buildTelLink } from "@/lib/links";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { formatDue, sectionOf } from "@/lib/idea-sections";
import { SNOOZE_LABELS, type SnoozeOption } from "@/lib/due-date";
import { splitTags } from "@/lib/idea-filter";
import { useToast } from "@/components/toast";
import type { Idea } from "@prisma/client";

/**
 * Ligne d'idée façon Rappels (écrans Aujourd'hui et Idées) :
 * - rond à gauche : marquer fait (avec « Annuler ») ;
 * - toucher le texte : ouvrir la fiche ;
 * - bouton à droite : appeler / écrire en un toucher quand c'est possible ;
 * - glisser vers la gauche : reporter (Demain, Lundi).
 */

const SWIPE_OPEN = -148;
const SWIPE_ACTIONS: SnoozeOption[] = ["tomorrow", "monday"];

export function IdeaRow({
  idea,
  showTime = false,
  origin,
}: {
  idea: Idea;
  /** Colonne d'heure (liste du jour). */
  showTime?: boolean;
  /** Titre de l'idée dont l'action est née (onglet À faire). */
  origin?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startX: number; startY: number; base: number; horizontal: boolean | null } | null>(null);
  // Position réelle pendant le geste (l'état React peut avoir un rendu de retard au relâcher).
  const liveOffset = useRef(0);
  // Un glissement ne doit pas ouvrir la fiche au relâcher.
  const suppressClick = useRef(false);

  function moveTo(value: number) {
    liveOffset.current = value;
    setOffset(value);
  }

  const style = CATEGORY_STYLE[idea.category];
  const done = idea.status === "ACTIONED";
  const now = new Date();
  const overdue = !done && idea.dueAt !== null && sectionOf(idea, now) === "overdue";

  const tel = buildTelLink(idea.contactPhone);
  const mail =
    idea.category === "EMAIL"
      ? buildMailtoLink({ recipient: idea.contactEmail, subject: idea.emailSubject, body: idea.emailBody })
      : null;

  const subtitle = [
    !showTime && idea.dueAt ? formatDue(idea.dueAt, now, idea.dueEstimated) : null,
    style.label,
    origin ? `↳ ${origin}` : (idea.contactName ?? idea.contactCompany),
    !origin && splitTags(idea.tags)[0] ? `#${splitTags(idea.tags)[0]}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function toggleDone() {
    startTransition(async () => {
      await updateIdeaStatus(idea.id, done ? "PENDING" : "ACTIONED");
      router.refresh();
      if (!done) {
        toast(`Fait : ${idea.title}`, async () => {
          await updateIdeaStatus(idea.id, "PENDING");
          router.refresh();
        });
      }
    });
  }

  function snooze(option: SnoozeOption) {
    moveTo(0);
    const previous = { dueAt: idea.dueAt ? new Date(idea.dueAt).toISOString() : null, estimated: idea.dueEstimated };
    startTransition(async () => {
      await snoozeIdea(idea.id, option);
      router.refresh();
      toast(`Reportée : ${SNOOZE_LABELS[option].toLowerCase()}`, async () => {
        await restoreDue(idea.id, previous.dueAt, previous.estimated);
        router.refresh();
      });
    });
  }

  // Glisser vers la gauche (doigt ou souris) ; un défilement vertical n'ouvre rien.
  function onPointerDown(e: React.PointerEvent) {
    if (done) return;
    suppressClick.current = false;
    drag.current = { startX: e.clientX, startY: e.clientY, base: liveOffset.current, horizontal: null };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.horizontal === null && Math.hypot(dx, dy) > 8) {
      d.horizontal = Math.abs(dx) > Math.abs(dy);
      if (d.horizontal) (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    if (d.horizontal) {
      suppressClick.current = true;
      setDragging(true);
      moveTo(Math.max(SWIPE_OPEN - 24, Math.min(0, d.base + dx)));
    }
  }
  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d?.horizontal) moveTo(liveOffset.current < SWIPE_OPEN / 2 ? SWIPE_OPEN : 0);
  }

  return (
    <div className="relative overflow-hidden bg-surface">
      {!done ? (
        <div className="absolute inset-y-0 right-0 flex" aria-hidden={offset === 0}>
          {SWIPE_ACTIONS.map((option, i) => (
            <button
              key={option}
              type="button"
              tabIndex={offset === 0 ? -1 : 0}
              onClick={() => snooze(option)}
              className={`w-[74px] text-sm font-semibold ${i === 0 ? "bg-warn text-white" : "bg-appel text-white"}`}
            >
              {SNOOZE_LABELS[option]}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="row relative touch-pan-y select-none transition-transform duration-200"
        style={{ transform: `translateX(${offset}px)`, transitionDuration: dragging ? "0ms" : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          onClick={toggleDone}
          disabled={isPending}
          aria-label={done ? "Remettre en attente" : "Marquer fait"}
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${
            done ? "border-ok bg-ok text-white" : "border-faint hover:border-ok"
          }`}
        >
          {done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : null}
        </button>

        {showTime ? (
          <span className={`num w-11 shrink-0 text-sm font-semibold ${overdue ? "text-warn" : "text-ink"}`}>
            {idea.dueAt ? (idea.dueEstimated ? "—" : formatDue(idea.dueAt, now)) : ""}
          </span>
        ) : null}

        <span className={`h-8 w-1 shrink-0 rounded-full ${done ? "bg-line" : style.stripe}`} aria-hidden="true" />

        <Link
          href={`/ideas/${idea.id}`}
          className="min-w-0 flex-1"
          onClick={(e) => {
            if (suppressClick.current || liveOffset.current !== 0) {
              e.preventDefault();
              suppressClick.current = false;
              moveTo(0);
            }
          }}
        >
          <p className={`row-title truncate ${done ? "text-muted line-through" : ""}`}>{idea.title}</p>
          {subtitle ? <p className={`row-sub truncate ${overdue ? "text-warn" : ""}`}>{subtitle}</p> : null}
        </Link>

        {/* Action rapide : écrire pour une idée Email, sinon appeler si un numéro est connu. */}
        {!done && mail ? (
          <a href={mail} aria-label="Écrire l'email" className="icon-btn bg-email-soft text-email-ink">
            <Mail size={17} aria-hidden="true" />
          </a>
        ) : !done && tel ? (
          <a href={tel} aria-label={`Appeler ${idea.contactName ?? ""}`} className="icon-btn bg-appel-soft text-appel-ink">
            <Phone size={17} aria-hidden="true" />
          </a>
        ) : (
          <ChevronRight size={18} className="shrink-0 text-faint" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
