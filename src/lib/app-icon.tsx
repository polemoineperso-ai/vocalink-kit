import { BrandMark } from "@/lib/brand-mark";

/**
 * Visuel commun des icônes générées (app/icon.tsx, app/apple-icon.tsx) :
 * le logo (ampoule + onde sonore) en blanc sur fond corail, dessiné en SVG
 * pour rester net à toutes les tailles — pas de fichier image à maintenir.
 */
export function AppIconImage({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e4572e",
      }}
    >
      <BrandMark size={size * 0.6} color="#ffffff" strokeWidth={1.8} />
    </div>
  );
}
