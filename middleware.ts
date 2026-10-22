import { NextResponse, type NextRequest } from "next/server";
import { computeSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Protection minimale de l'app une fois déployée sur un domaine permanent
 * — formulaire de connexion + cookie de session.
 *
 * Remplace le Basic Auth (popup natif du navigateur) : constaté en usage
 * réel que ce popup ne s'intègre pas avec l'autoremplissage/Face ID des
 * gestionnaires de mots de passe (Chrome iOS notamment) — un vrai
 * formulaire HTML avec `autoComplete="current-password"` s'y intègre
 * normalement, comme n'importe quel site.
 *
 * Si APP_PASSWORD est absente (cas du développement local), le middleware
 * laisse tout passer — ne jamais laisser cette variable absente une fois en
 * production, sinon l'app reste ouverte à tout le monde.
 */
export async function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const expected = await computeSessionToken(password);
  if (cookie === expected) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  // Chemin + paramètres (ex. /?dicter=1) : on revient au même endroit après connexion.
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // /api/cron exclu : protégé par son propre secret (CRON_SECRET), appelé
  // par Vercel Cron avec un header Authorization: Bearer. /login exclu pour
  // éviter une boucle de redirection. Manifest, icônes et service worker
  // (sw.js) exclus : le téléphone les récupère parfois sans cookie.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron|login|manifest.webmanifest|icon|apple-icon|sw.js).*)"],
};
