/**
 * Version de Vocalink et liens vers le kit public.
 *
 * Chaque installation du kit est une copie indépendante : elle apprend
 * qu'une nouvelle version existe en lisant version.json, publié avec le
 * guide (GitHub Pages). À chaque nouvelle version : augmenter APP_VERSION
 * ici ET dans docs/version.json du kit, dans le même commit.
 */

export const APP_VERSION = "1.0.6";

const KIT_SITE = "https://polemoineperso-ai.github.io/vocalink-kit";
const KIT_REPO = "https://github.com/polemoineperso-ai/vocalink-kit";

export const UPDATE_FEED_URL = `${KIT_SITE}/version.json`;
export const UPDATE_GUIDE_URL = `${KIT_SITE}/#mise-a-jour`;
// Qui a créé Vocalink (présentation, pas le canal d'aide : « Signaler un problème »).
export const AUTHOR_NAME = "Pierre-Olivier Lemoine";
export const AUTHOR_CARD_URL = "https://polemoineperso-ai.github.io/portfolio/carte-visite.html";
export const REPORT_ISSUE_URL = `${KIT_REPO}/issues/new?template=probleme.yml&version=${APP_VERSION}`;

// Fichier du bouton « Mettre à jour Vocalink » (GitHub Actions), lu dans le kit.
// L'installation par Vercel ne le copie pas (son application GitHub n'a pas le
// droit de créer ces fichiers) : la personne l'ajoute une fois, via un lien
// GitHub prérempli construit ci-dessous.
export const UPDATE_WORKFLOW_PATH = ".github/workflows/mettre-a-jour.yml";
export const UPDATE_WORKFLOW_RAW_URL = `https://raw.githubusercontent.com/polemoineperso-ai/vocalink-kit/main/${UPDATE_WORKFLOW_PATH}`;

/** Dépôt GitHub de cette installation, tel que Vercel le fournit (variables système). */
export type RepoInfo = { owner: string; slug: string; branch: string };

export function repoFromEnv(env: Record<string, string | undefined>): RepoInfo | null {
  const owner = env.VERCEL_GIT_REPO_OWNER;
  const slug = env.VERCEL_GIT_REPO_SLUG;
  if (!owner || !slug || (env.VERCEL_GIT_PROVIDER && env.VERCEL_GIT_PROVIDER !== "github")) return null;
  return { owner, slug, branch: env.VERCEL_GIT_COMMIT_REF || "main" };
}

/** Page GitHub « nouveau fichier » déjà remplie avec le bouton de mise à jour : il reste « Commit changes ». */
export function activateUpdatesUrl(repo: RepoInfo, workflow: string): string {
  const base = `https://github.com/${repo.owner}/${repo.slug}/new/${encodeURIComponent(repo.branch)}`;
  return `${base}?filename=${encodeURIComponent(UPDATE_WORKFLOW_PATH)}&value=${encodeURIComponent(workflow)}`;
}

/** Page du bouton dans GitHub Actions, avec « Run workflow ». */
export function runUpdateUrl(repo: RepoInfo): string {
  return `https://github.com/${repo.owner}/${repo.slug}/actions/workflows/mettre-a-jour.yml`;
}

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
