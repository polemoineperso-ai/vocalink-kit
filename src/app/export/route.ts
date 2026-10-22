import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportFilename, ideasToCsv, ideasToJson } from "@/lib/export";
import { APP_VERSION } from "@/lib/version";

/**
 * Téléchargement de toutes les idées (Réglages → Mes données) :
 * ?format=csv (tableau Excel, par défaut) ou ?format=json (sauvegarde
 * complète). Protégé comme toutes les pages par le mot de passe (proxy.ts).
 */
export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const ideas = await prisma.idea.findMany({
    orderBy: { createdAt: "desc" },
    include: { notes: { orderBy: { createdAt: "asc" } } },
  });

  const body = format === "json" ? ideasToJson(ideas, APP_VERSION) : ideasToCsv(ideas);
  return new Response(body, {
    headers: {
      "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(format)}"`,
      "Cache-Control": "no-store",
    },
  });
}
