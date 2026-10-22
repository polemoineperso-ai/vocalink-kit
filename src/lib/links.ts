/**
 * Fonctions pures de préparation d'action — jamais d'exécution automatique
 * (pas d'envoi d'email, pas de création d'événement via API). Elles
 * produisent un lien que l'utilisateur ouvre lui-même pour finaliser.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function buildMailtoLink(params: { recipient: string | null; subject: string | null; body: string | null }): string {
  const { recipient, subject, body } = params;
  const to = recipient && EMAIL_RE.test(recipient) ? encodeURIComponent(recipient) : "";
  const query: string[] = [];
  if (subject) query.push(`subject=${encodeURIComponent(subject)}`);
  if (body) query.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${to}${query.length ? `?${query.join("&")}` : ""}`;
}

/**
 * Lien tel: à partir d'un numéro dicté ou saisi ("06 12 34 56 78",
 * "+33 6.12.34.56.78"...) — séparateurs retirés, "+" initial conservé.
 * null si le texte ne ressemble pas à un numéro (moins de 3 chiffres,
 * lettres...).
 */
export function buildTelLink(phone: string | null): string | null {
  if (!phone) return null;
  const compact = phone.trim().replace(/[\s.\-()]/g, "");
  if (!/^\+?\d{3,}$/.test(compact)) return null;
  return `tel:${compact}`;
}

function toGoogleCalendarDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildGoogleCalendarLink(params: {
  title: string;
  details: string;
  start: Date;
  durationMinutes?: number;
}): string {
  const { title, details, start, durationMinutes = 30 } = params;
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const search = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleCalendarDateTime(start)}/${toGoogleCalendarDateTime(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}
