"use client";

import { useEffect, useState } from "react";
import { CircleArrowUp, CircleCheck, CircleUserRound, ExternalLink, LifeBuoy, Play, ShieldCheck } from "lucide-react";
import {
  activateUpdatesUrl,
  APP_VERSION,
  AUTHOR_CARD_URL,
  AUTHOR_NAME,
  isNewerVersion,
  parseUpdateFeed,
  REPORT_ISSUE_URL,
  runUpdateUrl,
  UPDATE_FEED_URL,
  UPDATE_GUIDE_URL,
  UPDATE_WORKFLOW_RAW_URL,
  type RepoInfo,
  type UpdateFeed,
} from "@/lib/version";

/**
 * Avis de nouvelle version. Le téléphone lit version.json sur le site du kit
 * au plus toutes les 3 heures (mémorisé dans le navigateur) : aucune donnée de
 * l'utilisateur n'est envoyée. Hors ligne ou site indisponible : rien ne
 * s'affiche, l'app fonctionne normalement.
 */

const CACHE_KEY = "vocalink-update-feed";
const CHECK_EVERY_MS = 3 * 60 * 60 * 1000;

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

/**
 * Lien « Activer les mises à jour » : le fichier du bouton est lu dans le kit
 * dès que la mise à jour est annoncée, pour que le lien soit prêt au toucher
 * (une ouverture après un chargement serait bloquée comme fenêtre surgissante).
 */
function useActivateLink(repo: RepoInfo | null, enabled: boolean): string | null {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    if (!repo || !enabled) return;
    let alive = true;
    fetch(UPDATE_WORKFLOW_RAW_URL, { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
      .then((workflow) => {
        if (alive) setHref(activateUpdatesUrl(repo, workflow));
      })
      .catch(() => {
        // Kit injoignable : le guide explique la marche à suivre.
        if (alive) setHref(UPDATE_GUIDE_URL);
      });
    return () => {
      alive = false;
    };
  }, [repo, enabled]);
  return href;
}

/**
 * Groupe « À propos » des Réglages : version, mise à jour, signaler un problème, auteur.
 * `repo` : dépôt GitHub de l'installation (fourni par Vercel) ; sans lui, la
 * mise à jour renvoie au guide.
 */
export function AboutPanel({ repo }: { repo: RepoInfo | null }) {
  const update = useAvailableUpdate();
  const activateHref = useActivateLink(repo, Boolean(update));

  return (
    <div className="group">
      {update && repo ? (
        <>
          <div className="row">
            <CircleArrowUp size={20} className="shrink-0 text-brand" aria-hidden="true" />
            <span className="flex-1">
              <span className="row-title block">Version {update.version} disponible</span>
              <span className="row-sub block">
                {update.notes ? `${update.notes} ` : ""}2 minutes, sans toucher à vos idées : faites 1 puis 2.
              </span>
            </span>
          </div>
          <a
            href={activateHref ?? undefined}
            aria-disabled={!activateHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`row ${activateHref ? "" : "pointer-events-none opacity-60"}`}
          >
            <ShieldCheck size={20} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="flex-1">
              <span className="row-title block">1. Activer les mises à jour</span>
              <span className="row-sub block">
                Une seule fois : sur GitHub, touchez « Commit changes ». Déjà fait lors d&apos;une mise à jour précédente ? Passez au 2.
              </span>
            </span>
            <ExternalLink size={17} className="shrink-0 text-faint" aria-hidden="true" />
          </a>
          <a href={runUpdateUrl(repo)} target="_blank" rel="noopener noreferrer" className="row">
            <Play size={20} className="shrink-0 text-brand" aria-hidden="true" />
            <span className="flex-1">
              <span className="row-title block">2. Mettre à jour maintenant</span>
              <span className="row-sub block">Sur GitHub : « Run workflow », puis le bouton vert. Rouvrez Vocalink 3 minutes après.</span>
            </span>
            <ExternalLink size={17} className="shrink-0 text-faint" aria-hidden="true" />
          </a>
        </>
      ) : update ? (
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
