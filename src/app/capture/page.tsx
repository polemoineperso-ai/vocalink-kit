import Link from "next/link";
import { X } from "lucide-react";
import { CaptureFlow } from "@/components/capture-flow";

/** Dictée plein écran, ouverte par le micro de la barre du bas ou le raccourci « Dicter en un geste ». */
export default function CapturePage() {
  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-10">
      <nav className="flex items-center justify-between py-2">
        <Link href="/" aria-label="Fermer" className="icon-btn -ml-1 bg-surface text-muted">
          <X size={20} aria-hidden="true" />
        </Link>
        <span className="text-sm font-semibold text-muted">Nouvelle idée</span>
        <span className="w-9" aria-hidden="true" />
      </nav>
      <CaptureFlow />
    </main>
  );
}
