import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMorningBrief } from "@/lib/brief";
import { sendPushToAll } from "@/lib/push";
import { isAuthorizedCronCall } from "@/lib/cron-auth";
import { todayInParis } from "@/lib/due-date";
import { ACTION_CATEGORIES } from "@/lib/idea-kind";
import { getRediscovery } from "@/lib/actions/idea-actions";

/**
 * Brief du matin : une notification avec ce qui est prévu aujourd'hui et
 * les retards. Déclenché chaque jour par Vercel Cron (vercel.json). Sur
 * l'offre gratuite de Vercel, l'heure n'est garantie qu'à l'heure près
 * (6 h UTC = entre 8 h et 9 h à Paris en été, 7 h et 8 h en hiver).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronCall(request, { allowVercelCronWithoutSecret: true })) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const [ideas, settings, rediscovery] = await Promise.all([
    // Le brief parle des actions (appels, emails) ; les idées mûrissent sans rappel culpabilisant.
    prisma.idea.findMany({
      where: { status: "PENDING", category: { in: ACTION_CATEGORIES } },
      select: { title: true, dueAt: true, dueEstimated: true },
    }),
    prisma.settings.findUnique({ where: { id: 1 } }),
    getRediscovery(),
  ]);

  // Vercel Cron peut livrer deux fois le même appel : un seul brief par jour.
  if (settings?.lastBriefAt && todayInParis(settings.lastBriefAt) === todayInParis()) {
    return NextResponse.json({ sent: 0, reason: "brief déjà envoyé aujourd'hui" });
  }

  const brief = buildMorningBrief(ideas, settings?.firstName ?? null, new Date(), rediscovery);
  if (!brief) return NextResponse.json({ sent: 0, reason: "rien à signaler" });

  const result = await sendPushToAll(brief);
  if (result.sent > 0) {
    await prisma.settings.upsert({ where: { id: 1 }, create: { id: 1, lastBriefAt: new Date() }, update: { lastBriefAt: new Date() } });
  }
  return NextResponse.json(result);
}
