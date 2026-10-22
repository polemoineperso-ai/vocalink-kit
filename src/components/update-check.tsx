"use client";

import { useEffect, useState } from "react";
import { CircleArrowUp, CircleCheck, CircleUserRound, ExternalLink, LifeBuoy } from "lucide-react";
import {
  APP_VERSION,
  AUTHOR_CARD_URL,
  AUTHOR_NAME,
  isNewerVersion,
  parseUpdateFeed,
  REPORT_ISSUE_URL,
  UPDATE_FEED_URL,
  UPDATE_GUIDE_URL,
  type UpdateFeed,
} from "@/lib/version";

/**
 * Avis de nouvelle version. Le téléphone lit version.json sur le site du kit
 * au plus une fois par jour (mémorisé dans le navigateur) : aucune donnée de
 * l'utilisateur n'est envoyée. Hors ligne ou site indisponible : rien ne
 * s'affiche, l'app fonctionne normalement.
 */

const CACHE_KEY = "vocalink-update-feed";
const CHECK_EVERY_MS = 24 * 60 * 60 * 1000;

async function loadFeed(): Promise<UpdateFeed | null> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as { at: number; feed: unknown } | null;
    if (cached && Date.now() - cached.at < CHECK_EVERY_MS) return parseUpdateFeed(cached.feed);
  } catch {
    // Stockage indisponible (navigation privée) : on interroge le site.
  }
  try {
    const response = await fetch(UPDATE_FEED_URL, { cache: "no-store" });
    if (!response.ok) return null;
    const feed = parseUpdateFeed(await response.json());
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), feed }));
    } catch {}
    return feed;
  } catch {
    return null;
  }
}

/** Nouvelle version disponible, ou null (à jour, inconnu ou hors ligne). */
export function useAvailableUpdate(): UpdateFeed | null {
  const [update, setUpdate] = useState<UpdateFeed | null>(null);
  useEffect(() => {
    let alive = true;
    loadFeed().then((feed) => {
      if (alive && feed && isNewerVersion(feed.version, APP_VERSION)) setUpdate(feed);
    });
    return () => {
      alive = false;
    };
  }, []);
  return update;
}

/** Pastille sur l'avatar de l'accueil (qui mène aux Réglages). */
export function UpdateDot() {
  const update = useAvailableUpdate();
  if (!update) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-canvas bg-brand">
      <span className="sr-only">Nouvelle version disponible</span>
    </span>
  );
}

/** Groupe « À propos » des Réglages : version, mise à jour, signaler un problème, auteur. */
export function AboutPanel() {
  const update = useAvailableUpdate();

  return (
    <div className="group">
      {update ? (
        <a href={UPDATE_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="row">
          <CircleArrowUp size={20} className="shrink-0 text-brand" aria-hidden="true" />
          <span className="flex-1">
            <span className="row-title block">Version {update.version} disponible</span>
            <span className="row-sub block">
              {update.notes ? `${update.notes} ` : ""}Touchez pour voir comment mettre à jour (2 minutes).
            </span>
          </span>
          <ExternalLink size={17} className="shrink-0 text-faint" aria-hidden="true" />
        </a>
      ) : (
        <div className="row">
          <CircleCheck size={20} className="shrink-0 text-ok" aria-hidden="true" />
          <span className="row-title flex-1">Version {APP_VERSION}</span>
        </div>
      )}
      <a href={REPORT_ISSUE_URL} target="_blank" rel="noopener noreferrer" className="row">
        <LifeBuoy size={20} className="shrink-0 text-muted" aria-hidden="true" />
        <span className="flex-1">
          <span className="row-title block">Signaler un problème</span>
          <span className="row-sub block">Sur GitHub. Le message est public : n&apos;y mettez ni mot de passe, ni clé, ni idée.</span>
        </span>
        <ExternalLink size={17} className="shrink-0 text-faint" aria-hidden="true" />
      </a>
      <a href={AUTHOR_CARD_URL} target="_blank" rel="noopener noreferrer" className="row">
        <CircleUserRound size={20} className="shrink-0 text-muted" aria-hidden="true" />
        <span className="flex-1">
          <span className="row-title block">Créé par {AUTHOR_NAME}</span>
          <span className="row-sub block">Sa carte de visite</span>
        </span>
        <ExternalLink size={17} className="shrink-0 text-faint" aria-hidden="true" />
      </a>
    </div>
  );
}
