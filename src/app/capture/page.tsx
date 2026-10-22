import { AppHeader } from "@/components/app-header";
import { CaptureFlow } from "@/components/capture-flow";

export default function CapturePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pb-12 pt-4">
      <AppHeader />
      <h1 className="text-2xl font-semibold">Enregistrer une idée</h1>
      <CaptureFlow />
    </main>
  );
}
