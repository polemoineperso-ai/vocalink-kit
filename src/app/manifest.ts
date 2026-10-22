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
    background_color: "#f4f3f0",
    theme_color: "#e4572e",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }],
    // Appui long sur l'icône (Android) : dicter directement.
    shortcuts: [{ name: "Dicter une idée", short_name: "Dicter", url: "/?dicter=1", icons: [{ src: "/icon", sizes: "512x512" }] }],
  };
}
