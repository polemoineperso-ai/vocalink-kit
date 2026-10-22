"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { answerRediscovery, setIdeaStage } from "@/lib/actions/idea-actions";
import { formatAge } from "@/lib/idea-sections";
import { useToast } from "@/components/toast";
import type { IdeaStage } from "@prisma/client";

/** « À redécouvrir » : une idée oubliée remonte ; on la développe, on la remet à plus tard, ou on l'archive. */
export function RediscoverCard({
  idea,
}: {
  idea: { id: string; title: string; summary: string; createdAt: string; stage: IdeaStage };
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function answer(choice: "develop" | "later" | "archive") {
    startTransition(async () => {
      await answerRediscovery(idea.id, choice);
      if (choice === "develop") {
        router.push(`/ideas/${idea.id}`);
        return;
      }
      router.refresh();
      if (choice === "later") toast("Elle reviendra plus tard");
      else
        toast("Idée archivée", async () => {
          await setIdeaStage(idea.id, idea.stage);
          router.refresh();
        });
    });
  }

  return (
    <section className="mt-4 rounded-2xl bg-projet-soft p-4" aria-label="Idée à redécouvrir">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-projet">
        <Sparkles size={14} aria-hidden="true" />
        À redécouvrir · {formatAge(idea.createdAt).toLowerCase()}
      </p>
      <h2 className="mt-1.5 font-semibold leading-snug text-projet-ink">{idea.title}</h2>
      {idea.summary ? <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-projet-ink/80">{idea.summary}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => answer("develop")}
          className="rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-projet-ink transition active:scale-95"
        >
          La développer
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => answer("later")}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-projet-ink/80 transition active:scale-95"
        >
          Plus tard
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => answer("archive")}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-projet-ink/80 transition active:scale-95"
        >
          Archiver
        </button>
      </div>
    </section>
  );
}
