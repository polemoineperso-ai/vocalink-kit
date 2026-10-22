/**
 * Freine les essais de mot de passe : l'adresse d'un Vocalink est publique,
 * seul le mot de passe le protège. Après 5 échecs d'affilée, la connexion est
 * bloquée 15 minutes, puis le blocage double à chaque nouvelle série
 * d'échecs (jusqu'à 24 h). Une connexion réussie remet tout à zéro.
 *
 * Le blocage vaut pour tout le monde (app à un seul utilisateur) : un
 * inconnu qui s'acharne peut empêcher une nouvelle connexion pendant ce
 * temps, mais les appareils déjà connectés le restent (cookie de 180 jours).
 */

export const FAILURES_BEFORE_LOCK = 5;
const FIRST_LOCK_MS = 15 * 60 * 1000;
const MAX_LOCK_MS = 24 * 60 * 60 * 1000;

/** Fin du blocage après `failures` échecs d'affilée, ou null si pas de blocage. */
export function lockUntil(failures: number, now: Date): Date | null {
  if (failures < FAILURES_BEFORE_LOCK || failures % FAILURES_BEFORE_LOCK !== 0) return null;
  const series = failures / FAILURES_BEFORE_LOCK;
  const duration = Math.min(FIRST_LOCK_MS * 2 ** (series - 1), MAX_LOCK_MS);
  return new Date(now.getTime() + duration);
}

/** Minutes restantes (arrondies au-dessus), 0 si le blocage est terminé. */
export function minutesLeft(blockedUntil: Date | null, now: Date): number {
  if (!blockedUntil) return 0;
  return Math.max(0, Math.ceil((blockedUntil.getTime() - now.getTime()) / 60_000));
}

export function formatWait(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
