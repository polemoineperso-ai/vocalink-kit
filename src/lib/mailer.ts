import { Resend } from "resend";

/**
 * Point d'envoi unique pour les emails de Vocalink (digest). Même doctrine
 * que le reste du projet : ne lève jamais, dégrade proprement (log +
 * `false`) si RESEND_API_KEY est absente ou si l'envoi échoue.
 *
 * Expéditeur : DIGEST_FROM_EMAIL, une adresse d'un domaine vérifié sur
 * Resend (envoie vers n'importe quelle adresse). Absente, repli sur le
 * domaine de test onboarding@resend.dev, qui n'envoie qu'à l'adresse du
 * compte Resend — suffisant pour une installation personnelle.
 */

const FROM_ADDRESS = process.env.DIGEST_FROM_EMAIL || "Vocalink <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client ??= new Resend(apiKey);
  return client;
}

export function isEmailAvailable(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type EmailMessage = { to: string; subject: string; text: string };

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.log(`[mailer] email non envoyé (RESEND_API_KEY absente) → ${message.to} : ${message.subject}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    if (error) {
      console.error("[mailer] échec de l'envoi Resend", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[mailer] erreur inattendue lors de l'envoi", e);
    return false;
  }
}

/** Base des liens absolus dans l'email de digest — voir .env.example (APP_URL). */
export function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}
