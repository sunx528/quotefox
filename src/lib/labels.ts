// French display labels for values that are stored/coded in English (see
// src/lib/enums.ts). Keeping the stored enum values in English avoids ever
// needing a data migration if the UI language changes again; only the label
// shown to a person goes through this map.

export const FUNNEL_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  won: "Gagné",
  lost: "Perdu",
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  business: "Business",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  trialing: "Essai",
  past_due: "Paiement en retard",
  canceled: "Annulé",
  unpaid: "Impayé",
  incomplete: "Incomplet",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: "Choix unique",
  multiple_choice: "Choix multiple",
  text: "Texte court",
  number: "Nombre",
  date: "Date",
  location: "Localisation (adresse/code postal)",
  email: "E-mail",
  phone: "Téléphone",
  file: "Envoi de photo",
};

export const LOGIC_ACTION_LABELS: Record<string, string> = {
  show: "Afficher",
  hide: "Masquer",
};

export const CONDITION_OPERATOR_LABELS: Record<string, string> = {
  equals: "est égal à",
  not_equals: "est différent de",
  contains: "contient",
  greater_than: "est supérieur à",
  less_than: "est inférieur à",
};

export const MODIFIER_TYPE_LABELS: Record<string, string> = {
  flat: "Montant fixe ($)",
  percent: "Pourcentage (%)",
  per_unit: "Par unité ($ par 1)",
};

export function label(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}
