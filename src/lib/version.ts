/**
 * Version de Vocalink et liens vers le kit public.
 *
 * Chaque installation du kit est une copie indépendante : elle apprend
 * qu'une nouvelle version existe en lisant version.json, publié avec le
 * guide (GitHub Pages). À chaque nouvelle version : augmenter APP_VERSION
 * ici ET dans docs/version.json du kit, dans le même commit.
 */

export const APP_VERSION = "1.0.5";

const KIT_SITE = "https://polemoineperso-ai.github.io/vocalink-kit";
const KIT_REPO = "https://github.com/polemoineperso-ai/vocalink-kit";

export const UPDATE_FEED_URL = `${KIT_SITE}/version.json`;
export const UPDATE_GUIDE_URL = `${KIT_SITE}/#mise-a-jour`;
// Qui a créé Vocalink (présentation, pas le canal d'aide : « Signaler un problème »).
export const AUTHOR_NAME = "Pierre-Olivier Lemoine";
export const AUTHOR_CARD_URL = "https://polemoineperso-ai.github.io/portfolio/carte-visite.html";
export const REPORT_ISSUE_URL = `${KIT_REPO}/issues/new?template=probleme.yml&version=${APP_VERSION}`;

export type UpdateFeed = { version: string; notes: string };

/** Lit version.json ; null si le contenu n'a pas la forme attendue. */
export function parseUpdateFeed(data: unknown): UpdateFeed | null {
  if (!data || typeof data !== "object") return null;
  const { version, notes } = data as Record<string, unknown>;
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) return null;
  return { version, notes: typeof notes === "string" ? notes : "" };
}

/** Vrai si `candidate` (x.y.z) est plus récente que `current`. */
export function isNewerVersion(candidate: string, current: string): boolean {
  const a = candidate.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}
