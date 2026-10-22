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

/** Lien SMS, avec un message pré-rempli facultatif (« ?&body= » : accepté par iPhone et Android). */
export function buildSmsLink(phone: string | null, body?: string | null): string | null {
  const tel = buildTelLink(phone);
  if (!tel) return null;
  const number = tel.slice("tel:".length);
  return body ? `sms:${number}?&body=${encodeURIComponent(body)}` : `sms:${number}`;
}

/**
 * Lien WhatsApp (wa.me), qui exige le format international sans « + » :
 * un numéro français « 06… » devient « 336… ». null si le numéro n'est pas
 * exploitable (trop court, ou national non français).
 */
export function buildWhatsAppLink(phone: string | null, text?: string | null): string | null {
  const tel = buildTelLink(phone);
  if (!tel) return null;
  let number = tel.slice("tel:".length);
  if (number.startsWith("+")) number = number.slice(1);
  else if (number.startsWith("00")) number = number.slice(2);
  else if (/^0[1-9]\d{8}$/.test(number)) number = `33${number.slice(1)}`;
  else return null;
  if (!/^\d{8,15}$/.test(number)) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
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
