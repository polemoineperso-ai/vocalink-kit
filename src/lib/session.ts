/**
 * Session de connexion — remplace le Basic Auth (popup natif du navigateur,
 * qui ne s'intègre pas avec l'autoremplissage/Face ID des gestionnaires de
 * mots de passe, constaté en usage réel) par un vrai formulaire HTML + un
 * cookie de session, que les navigateurs savent proposer à l'autoremplissage
 * biométrique comme n'importe quel site.
 *
 * Pas de table de sessions en base : le jeton est un hachage dérivé du mot
 * de passe lui-même (Web Crypto, disponible en Edge comme en Node) — toujours
 * la même valeur tant qu'APP_PASSWORD ne change pas, donc rien à stocker
 * côté serveur, et un changement de mot de passe invalide automatiquement
 * les anciens cookies.
 */

const SESSION_SALT = "vocalink-session-v1";

export const SESSION_COOKIE_NAME = "vocalink_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeSessionToken(password: string): Promise<string> {
  return sha256Hex(`${password}:${SESSION_SALT}`);
}
