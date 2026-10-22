export type DigestItem = {
  title: string;
  categoryLabel: string;
  priorityLabel: string;
  ageDays: number;
  href: string;
};

export function digestEmail(params: { items: DigestItem[] }): { subject: string; text: string } {
  const { items } = params;
  const subject = `Vocalink — ${items.length} idée${items.length > 1 ? "s" : ""} en attente`;

  const lines = items.map(
    (i) =>
      `- [${i.categoryLabel} · priorité ${i.priorityLabel}] ${i.title} — en attente depuis ${i.ageDays} jour${i.ageDays > 1 ? "s" : ""}\n  ${i.href}`,
  );

  const text = [
    `Ces idées sont toujours en attente et n'ont pas encore été traitées :`,
    "",
    ...lines,
    "",
    "— Vocalink",
  ].join("\n");

  return { subject, text };
}
