/** Longueur maximale d'une note (une dictée de 5 minutes tient largement). */
export const NOTE_MAX_LENGTH = 4000;

/**
 * Nettoie le texte d'une note avant enregistrement : espaces superflus,
 * majuscule initiale, longueur bornée. Renvoie "" si rien d'exploitable.
 */
export function cleanNoteText(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim().slice(0, NOTE_MAX_LENGTH);
  return compact ? compact[0].toUpperCase() + compact.slice(1) : "";
}
