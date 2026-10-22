/**
 * Retour après connexion : uniquement un chemin de l'app. Refuse toute
 * adresse qui ferait sortir de Vocalink (« https://… », « //exemple.com »,
 * « /\exemple.com ») — sinon un lien piégé pourrait rediriger ailleurs
 * juste après la saisie du mot de passe.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
