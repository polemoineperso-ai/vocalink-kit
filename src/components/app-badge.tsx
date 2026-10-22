"use client";

import { useEffect } from "react";

/**
 * Pastille rouge sur l'icône de l'app (Badging API) : nombre d'idées
 * prévues aujourd'hui ou en retard. Remise à jour à chaque affichage de
 * l'accueil ou de la liste (router.refresh après une action suffit).
 * Sans effet là où le navigateur ne la gère pas.
 */
export function AppBadge({ count }: { count: number }) {
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (!nav.setAppBadge || !nav.clearAppBadge) return;
    (count > 0 ? nav.setAppBadge(count) : nav.clearAppBadge()).catch(() => {});
  }, [count]);
  return null;
}
