/**
 * Logo de Vocalink : une ampoule (l'idée) dont le filament est une onde
 * sonore (la voix). Utilisé pour l'icône de l'app (icon.tsx, apple-icon.tsx,
 * via app-icon.tsx) et l'écran de connexion. Le micro seul reste réservé au
 * bouton « dicter ».
 *
 * Trait fin et onde à 5 barres espacées, de hauteurs variées : elle doit
 * rester lisible comme une onde même en petit (icône de l'écran d'accueil).
 */

// Barres de l'onde : position x et demi-hauteur, centrées sur y = 8.4.
const WAVE: [number, number][] = [
  [9, 0.9],
  [10.5, 1.9],
  [12, 3],
  [13.5, 1.9],
  [15, 0.9],
];
const WAVE_CENTER_Y = 8.4;

export function BrandMark({ size, color = "currentColor", strokeWidth = 1.5 }: { size: number; color?: string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Ampoule */}
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 21.5h4" />
      {/* Onde sonore en guise de filament (trait un peu plus fin que l'ampoule) */}
      {WAVE.map(([x, half]) => (
        <path key={x} d={`M${x} ${WAVE_CENTER_Y - half}v${half * 2}`} strokeWidth={strokeWidth * 0.85} />
      ))}
    </svg>
  );
}
