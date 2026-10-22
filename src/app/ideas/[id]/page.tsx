import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, ChevronLeft, Clock, ExternalLink, FolderOpen, Hash, Mail, MessageCircle, MessageSquareText, Phone, User } from "lucide-react";
import { getIdea } from "@/lib/actions/idea-actions";
import { prisma } from "@/lib/prisma";
import { buildGoogleCalendarLink, buildMailtoLink, buildSmsLink, buildTelLink, buildWhatsAppLink } from "@/lib/links";
import { formatContactIdentity } from "@/lib/contact";
import { CATEGORY_STYLE, PRIORITY_STYLE } from "@/lib/category-style";
import { formatDue, sectionOf } from "@/lib/idea-sections";
import { splitTags } from "@/lib/idea-filter";
import { DeleteIdeaButton, DoneToggle, SnoozeButtons, StageStepper } from "@/components/idea-detail-actions";
import { IdeaNotes } from "@/components/idea-notes";
import { IdeaRow } from "@/components/idea-row";
import { NextStepCard } from "@/components/next-step-card";
import { ACTION_CATEGORIES, isAction, isActiveStage } from "@/lib/idea-kind";
import type { NextStepKind } from "@/lib/next-step";

export const dynamic = "force-dynamic";

/** Fiche d'une idée : tout le détail, et une action principale mise en avant. */
export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) notFound();
  const [parent, notes, linkedActions] = await Promise.all([
    idea.parentId ? prisma.idea.findUnique({ where: { id: idea.parentId }, select: { id: true, title: true } }) : null,
    prisma.ideaNote.findMany({ where: { ideaId: idea.id }, orderBy: { createdAt: "desc" } }),
    // Actions nées de cette idée (suggestion acceptée ou rattachement manuel).
    prisma.idea.findMany({ where: { parentId: idea.id, category: { in: ACTION_CATEGORIES } }, orderBy: { createdAt: "desc" } }),
  ]);

  const now = new Date();
  const style = CATEGORY_STYLE[idea.category];
  // Une ACTION se coche et peut être en retard ; une IDÉE mûrit par étapes.
  const action = isAction(idea.category);
  const done = action && idea.status === "ACTIONED";
  const overdue = action && !done && sectionOf(idea, now) === "overdue";
  const tags = splitTags(idea.tags);

  const tel = buildTelLink(idea.contactPhone);
  const sms = buildSmsLink(idea.contactPhone);
  const whatsApp = buildWhatsAppLink(idea.contactPhone);
  const email =
    idea.category === "EMAIL"
      ? buildMailtoLink({ recipient: idea.contactEmail, subject: idea.emailSubject, body: idea.emailBody })
      : idea.contactEmail
        ? buildMailtoLink({ recipient: idea.contactEmail, subject: null, body: null })
        : null;
  const calendar = idea.dueAt
    ? buildGoogleCalendarLink({ title: idea.title, details: idea.summary, start: new Date(idea.dueAt) })
    : null;

  // Action principale : la plus probable pour cette idée.
  const primary =
    idea.category === "EMAIL" && email
      ? { href: email, label: "Écrire l'email", icon: <Mail size={18} aria-hidden="true" />, external: false }
      : tel
        ? { href: tel, label: "Appeler", icon: <Phone size={18} aria-hidden="true" />, external: false }
        : idea.notionPageUrl && idea.category === "PROJET"
          ? { href: idea.notionPageUrl, label: "Ouvrir dans Notion", icon: <ExternalLink size={18} aria-hidden="true" />, external: true }
          : calendar && idea.category === "APPEL_RAPPEL"
            ? { href: calendar, label: "Ajouter à l'agenda", icon: <CalendarPlus size={18} aria-hidden="true" />, external: true }
            : null;

  const secondary = [
    tel && primary?.href !== tel ? { href: tel, label: "Appeler", icon: <Phone size={17} aria-hidden="true" /> } : null,
    sms ? { href: sms, label: "SMS", icon: <MessageSquareText size={17} aria-hidden="true" /> } : null,
    whatsApp ? { href: whatsApp, label: "WhatsApp", icon: <MessageCircle size={17} aria-hidden="true" />, external: true } : null,
    email && primary?.href !== email ? { href: email, label: "Email", icon: <Mail size={17} aria-hidden="true" /> } : null,
    calendar && primary?.href !== calendar ? { href: calendar, label: "Agenda", icon: <CalendarPlus size={17} aria-hidden="true" />, external: true } : null,
  ].filter((a): a is NonNullable<typeof a> => Boolean(a));

  const contactIdentity = formatContactIdentity(idea);

  return (
    <main className="safe-top mx-auto w-full max-w-xl px-4 pb-16">
      <nav className="flex items-center justify-between py-2">
        <Link href={action ? "/a-faire" : "/"} className="-ml-1.5 flex items-center font-medium text-brand">
          <ChevronLeft size={22} aria-hidden="true" />
          {action ? "À faire" : "Mes idées"}
        </Link>
        <Link href={`/ideas/${idea.id}/edit`} className="font-medium text-brand">
          Modifier
        </Link>
      </nav>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={`chip ${style.chip}`}>{style.label}</span>
        {idea.priority !== "MEDIUM" ? <span className={`chip ${PRIORITY_STYLE[idea.priority].chip}`}>Priorité {PRIORITY_STYLE[idea.priority].label.toLowerCase()}</span> : null}
        {done ? <span className="chip bg-ok-soft text-ok">Fait</span> : null}
        {overdue ? <span className="chip bg-warn-soft text-warn">En retard</span> : null}
      </div>
      <h1 className={`mt-2 text-2xl font-bold leading-tight tracking-tight ${done ? "text-muted line-through" : ""}`}>{idea.title}</h1>
      {idea.summary ? <p className="mt-2 leading-relaxed text-muted">{idea.summary}</p> : null}

      {!action ? (
        <div className="mt-5">
          <StageStepper id={idea.id} stage={idea.stage} />
        </div>
      ) : null}

      {/* Les notes font vivre une idée : en haut de la fiche. Pour une action, après le détail. */}
      {!action ? (
        <div className="mt-3">
          <IdeaNotes
            ideaId={idea.id}
            notes={notes.map((n) => ({ id: n.id, text: n.text, source: n.source, createdAt: n.createdAt.toISOString() }))}
          />
        </div>
      ) : null}

      {!action && isActiveStage(idea.stage) ? (
        <NextStepCard
          ideaId={idea.id}
          initial={
            idea.nextStepTitle
              ? { title: idea.nextStepTitle, kind: (idea.nextStepKind ?? "think") as NextStepKind, why: idea.nextStepWhy ?? "" }
              : null
          }
        />
      ) : null}

      {!action && linkedActions.length ? (
        <>
          <h2 className="group-label">
            Actions liées <span className="font-normal text-faint">{linkedActions.length}</span>
          </h2>
          <div className="group">
            {linkedActions.map((a) => (
              <IdeaRow key={a.id} idea={a} />
            ))}
          </div>
        </>
      ) : null}

      {primary ? (
        <a
          href={primary.href}
          target={primary.external ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="btn btn-primary mt-5 w-full py-3.5 text-base"
        >
          {primary.icon}
          {primary.label}
        </a>
      ) : null}
      {secondary.length ? (
        // Actions secondaires en grille régulière (jusqu'à 3 par ligne).
        <div className={`mt-2 grid gap-2 ${secondary.length === 1 ? "grid-cols-1" : secondary.length === 2 || secondary.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
          {secondary.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target={"external" in action && action.external ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 rounded-2xl bg-surface px-2 py-2.5 text-xs font-semibold transition active:scale-95"
            >
              {action.icon ?? <MessageCircle size={17} aria-hidden="true" />}
              {action.label}
            </a>
          ))}
        </div>
      ) : null}

      <div className="group mt-6">
        {contactIdentity || idea.contactPhone || idea.contactEmail ? (
          <div className="row items-start">
            <User size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
            <div className="min-w-0">
              <p className="row-title">{idea.contactName ?? contactIdentity ?? "Contact"}</p>
              {[idea.contactRole, idea.contactCompany].filter(Boolean).length ? (
                <p className="row-sub">{[idea.contactRole, idea.contactCompany].filter(Boolean).join(" · ")}</p>
              ) : null}
              {idea.contactPhone ? <p className="row-sub num">{idea.contactPhone}</p> : null}
              {idea.contactEmail ? <p className="row-sub break-all">{idea.contactEmail}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="row items-start">
          <Clock size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className={`row-title ${overdue ? "text-warn" : ""}`}>
              {idea.dueAt ? `${action ? "" : "Rappel : "}${formatDue(idea.dueAt, now, idea.dueEstimated)}` : action ? "Pas d'échéance" : "Pas de rappel"}
              {idea.dueEstimated ? <span className="font-normal text-muted"> · créneau estimé</span> : null}
            </p>
            {action && !done && idea.dueAt ? (
              <div className="mt-2">
                <SnoozeButtons id={idea.id} dueAt={new Date(idea.dueAt).toISOString()} dueEstimated={idea.dueEstimated} />
              </div>
            ) : null}
          </div>
        </div>

        {tags.length ? (
          <div className="row items-start">
            <Hash size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Link key={tag} href={`/ideas?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-subtle px-2.5 py-0.5 text-sm font-medium text-muted">
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {parent ? (
          <Link href={`/ideas/${parent.id}`} className="row">
            <FolderOpen size={18} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="row-title min-w-0 truncate">{parent.title}</span>
          </Link>
        ) : null}
      </div>

      {action ? (
        <div className="group mt-4">
          <DoneToggle id={idea.id} title={idea.title} done={done} />
        </div>
      ) : null}

      {action ? (
        <div className="mt-2">
          <IdeaNotes
            ideaId={idea.id}
            notes={notes.map((n) => ({ id: n.id, text: n.text, source: n.source, createdAt: n.createdAt.toISOString() }))}
          />
        </div>
      ) : null}

      {idea.transcript ? (
        <details className="group mt-4">
          <summary className="row cursor-pointer list-none text-sm font-medium text-muted">Transcription d&apos;origine</summary>
          <p className="whitespace-pre-wrap px-4 pb-4 text-sm leading-relaxed text-muted">« {idea.transcript} »</p>
        </details>
      ) : null}

      <p className="mt-4 px-1 text-xs text-faint">
        Créée le {new Date(idea.createdAt).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" })}
        {idea.googleTaskId ? " · synchronisée avec Google Tasks" : ""}
      </p>

      <div className="group mt-6">
        <DeleteIdeaButton id={idea.id} title={idea.title} />
      </div>
    </main>
  );
}
