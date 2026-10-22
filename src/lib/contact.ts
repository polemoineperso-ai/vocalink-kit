/**
 * Bloc contact d'une idée (toutes catégories, tous champs facultatifs).
 * Fonctions pures : normalisation avant écriture en base, et mise en forme
 * texte réutilisée par Google Tasks et la recherche.
 */

export type ContactFields = {
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactCompany: string | null;
  contactRole: string | null;
};

export type ContactInput = { [K in keyof ContactFields]?: string | null };

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Champs vides ou blancs → null, pour ne jamais stocker de chaîne vide. */
export function normalizeContact(input: ContactInput): ContactFields {
  return {
    contactName: clean(input.contactName),
    contactPhone: clean(input.contactPhone),
    contactEmail: clean(input.contactEmail),
    contactCompany: clean(input.contactCompany),
    contactRole: clean(input.contactRole),
  };
}

/** Ne regarde que les champs contact — l'appelant passe souvent l'idée entière. */
export function hasContact(contact: ContactFields): boolean {
  return Boolean(
    contact.contactName || contact.contactPhone || contact.contactEmail || contact.contactCompany || contact.contactRole,
  );
}

/** "Jean Dupont — Directeur, ACME" — null si ni nom, ni fonction, ni société. */
export function formatContactIdentity(contact: ContactFields): string | null {
  const affiliation = [contact.contactRole, contact.contactCompany].filter(Boolean).join(", ");
  const parts = [contact.contactName, affiliation].filter(Boolean);
  return parts.length ? parts.join(" — ") : null;
}

/** Lignes texte du contact (notes Google Tasks) — tableau vide si aucun champ. */
export function formatContactLines(contact: ContactFields): string[] {
  const lines: string[] = [];
  const identity = formatContactIdentity(contact);
  if (identity) lines.push(`Contact : ${identity}`);
  if (contact.contactPhone) lines.push(`Tél : ${contact.contactPhone}`);
  if (contact.contactEmail) lines.push(`Email : ${contact.contactEmail}`);
  return lines;
}
