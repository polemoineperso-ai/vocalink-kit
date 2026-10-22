import { NextRequest, NextResponse } from "next/server";
import { runDigest } from "@/lib/digest";
import { isAuthorizedCronCall } from "@/lib/cron-auth";

/**
 * Point d'entrée du digest périodique (voir lib/digest.ts) — déclenché par
 * un mécanisme externe (tâche planifiée), pas par une session utilisateur,
 * donc protégé par un secret partagé plutôt que par une auth applicative
 * (il n'y en a pas ici, app mono-utilisateur). Sans CRON_SECRET configuré,
 * la route refuse tout appel — jamais de digest "ouvert" par oubli.
 *
 * Voir le README pour la configuration d'une tâche planifiée qui appelle
 * cette route quotidiennement (ou vercel.json une fois déployé sur Vercel —
 * Vercel Cron envoie automatiquement `Authorization: Bearer <CRON_SECRET>` ;
 * pour un déclenchement manuel, le même en-tête ou `x-cron-secret`).
 */
export async function GET(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: "CRON_SECRET n'est pas configuré." }, { status: 501 });
  }

  if (!isAuthorizedCronCall(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await runDigest();
  return NextResponse.json(result);
}
