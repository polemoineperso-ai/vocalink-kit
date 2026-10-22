/**
 * Logo de Vocalink : une ampoule (l'idée) dont le filament est une onde
 * sonore (la voix). Utilisé pour l'icône de l'app (icon.tsx, apple-icon.tsx,
 * via app-icon.tsx) et l'écran de connexion. Le micro seul reste réservé au
 * bouton « dicter ».
 */
export function BrandMark({ size, color = "currentColor", strokeWidth = 2 }: { size: number; color?: string; strokeWidth?: number }) {
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
      <path d="M10 22h4" />
      {/* Onde sonore en guise de filament */}
      <path d="M10 7.2v2.6" />
      <path d="M12 5.6v5.8" />
      <path d="M14 7.2v2.6" />
    </svg>
  );
}
