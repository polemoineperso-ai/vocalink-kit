import type { MetadataRoute } from "next";

/**
 * Rend Vocalink installable sur l'écran d'accueil (Safari : Partager → Sur
 * l'écran d'accueil ; Chrome Android : Installer l'application) — ouverture
 * plein écran, sans barre d'adresse. Icônes générées par icon.tsx et
 * apple-icon.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vocalink",
    short_name: "Vocalink",
    description: "Dites une idée, elle se transforme en action.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
