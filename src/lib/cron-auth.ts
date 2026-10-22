import type { NextRequest } from "next/server";

/**
 * Autorise un appel de tâche planifiée. Avec CRON_SECRET : secret exigé
 * (Bearer envoyé par Vercel Cron, ?secret= ou x-cron-secret pour un appel
 * manuel). Sans CRON_SECRET et seulement si `allowVercelCronWithoutSecret`
 * est vrai : on accepte l'appel de Vercel Cron, reconnu à l'en-tête
 * x-vercel-cron-schedule qu'il joint à chaque appel (documenté par Vercel).
 * Ce repli sert aux installations du kit, qui n'ont pas de CRON_SECRET ;
 * il est réservé au brief du matin, qui ne fait qu'envoyer une notification
 * à l'utilisateur lui-même : un appel imité ne lui fait au pire recevoir
 * qu'un brief de plus.
 */
export function isAuthorizedCronCall(request: NextRequest, options: { allowVercelCronWithoutSecret?: boolean } = {}): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return Boolean(options.allowVercelCronWithoutSecret) && request.headers.has("x-vercel-cron-schedule");
  }
  const bearerSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const providedSecret = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-cron-secret") ?? bearerSecret;
  return providedSecret === configuredSecret;
}
