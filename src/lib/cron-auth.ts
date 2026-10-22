import type { NextRequest } from "next/server";

/**
 * Autorise un appel de tâche planifiée. Avec CRON_SECRET : secret exigé,
 * en en-tête uniquement (Bearer envoyé par Vercel Cron, ou x-cron-secret
 * pour un appel manuel) — jamais dans l'adresse, qui finit dans les
 * journaux. Sans CRON_SECRET et seulement si `vercelCronWindowUtc` est
 * fourni : on accepte l'appel de Vercel Cron, reconnu à l'en-tête
 * x-vercel-cron-schedule qu'il joint à chaque appel (documenté par Vercel),
 * et seulement dans le créneau horaire où Vercel le déclenche. Ce repli sert
 * aux installations du kit, qui n'ont pas de CRON_SECRET ; il est réservé au
 * brief du matin, qui ne fait qu'envoyer une notification à l'utilisateur
 * lui-même, une fois par jour au plus : un appel imité dans le créneau ne
 * fait qu'envoyer le brief qui était de toute façon prévu.
 */
export function isAuthorizedCronCall(
  request: NextRequest,
  options: { vercelCronWindowUtc?: [startHour: number, endHour: number]; now?: Date } = {},
): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    const window = options.vercelCronWindowUtc;
    if (!window || !request.headers.has("x-vercel-cron-schedule")) return false;
    const hour = (options.now ?? new Date()).getUTCHours();
    return hour >= window[0] && hour < window[1];
  }
  const bearerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const providedSecret = request.headers.get("x-cron-secret") ?? bearerSecret;
  return providedSecret === configuredSecret;
}
