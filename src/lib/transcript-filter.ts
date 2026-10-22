/**
 * Whisper « invente » parfois du texte sur un enregistrement silencieux ou
 * inaudible : des phrases apprises sur des vidéos sous-titrées (constaté :
 * « Sous-titres réalisés par la communauté d'Amara.org »). Ce filtre repère
 * une transcription faite uniquement de ces phrases, pour dire « rien
 * entendu » au lieu de proposer une fausse idée.
 */

// Formes normalisées (minuscules, sans accents ni ponctuation).
const KNOWN_HALLUCINATIONS = [
  "sous titres realises para la communaute d amara org",
  "sous titres realises par la communaute d amara org",
  "sous titres realises par l amara org communaute",
  "sous titrage st 501",
  "sous titrage st 2001",
  "sous titrage societe radio canada",
  "sous titrage fr",
  "sous titres fait par la communaute d amara org",
  "sous titres par",
  "amara org",
  "merci d avoir regarde cette video",
  "merci d avoir regarde",
  "merci de votre attention",
  "abonnez vous",
  "n oubliez pas de vous abonner",
  "merci",
  "thank you for watching",
  "thanks for watching",
  "subtitles by the amara org community",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Vrai si le texte ne contient rien d'autre que des phrases inventées connues (ou rien du tout). */
export function isLikelyHallucination(text: string): boolean {
  let rest = ` ${normalize(text)} `;
  // Les plus longues d'abord, pour ne pas laisser des morceaux de phrase.
  for (const phrase of [...KNOWN_HALLUCINATIONS].sort((a, b) => b.length - a.length)) {
    rest = rest.split(` ${phrase} `).join(" ");
  }
  return rest.replace(/\s+/g, "").length < 3;
}
