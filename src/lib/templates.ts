import type { QuestionType } from "./enums";

export type TemplateOption = { id: string; label: string; value: string; priceModifier?: number };
export type TemplateQuestion = {
  type: QuestionType;
  label: string;
  helpText?: string;
  required: boolean;
  options?: TemplateOption[];
  /** Only for type "number": $ per unit added to the price (e.g. per sq ft). */
  perUnitRate?: number;
};
export type FunnelTemplate = {
  key: string;
  label: string;
  basePrice: number;
  headline: string;
  subheadline: string;
  questions: TemplateQuestion[];
};

export const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    key: "roofing",
    label: "Toiture",
    basePrice: 1500,
    headline: "Combien coûterait votre projet de toiture ?",
    subheadline: "Répondez à quelques questions pour une estimation instantanée.",
    questions: [
      {
        type: "single_choice",
        label: "Quel type de bien est-ce ?",
        required: true,
        options: [
          { id: "o1", label: "Maison individuelle", value: "house", priceModifier: 0 },
          { id: "o2", label: "Maison mitoyenne", value: "townhouse", priceModifier: -200 },
          { id: "o3", label: "Bâtiment commercial", value: "commercial", priceModifier: 1500 },
        ],
      },
      {
        type: "number",
        label: "Superficie approximative de la toiture (m²)",
        required: true,
        perUnitRate: 4.5,
      },
      {
        type: "single_choice",
        label: "Quel est l'état actuel de la toiture ?",
        required: true,
        options: [
          { id: "o1", label: "Réparation mineure nécessaire", value: "minor", priceModifier: 0 },
          { id: "o2", label: "Remplacement complet nécessaire", value: "full", priceModifier: 2000 },
          { id: "o3", label: "Dégâts (tempête/fuite)", value: "damage", priceModifier: 1000 },
        ],
      },
      {
        type: "single_choice",
        label: "Matériau préféré",
        required: true,
        options: [
          { id: "o1", label: "Bardeau d'asphalte", value: "asphalt", priceModifier: 0 },
          { id: "o2", label: "Métal", value: "metal", priceModifier: 1800 },
          { id: "o3", label: "Pas encore décidé", value: "unsure", priceModifier: 0 },
        ],
      },
      { type: "file", label: "Envoyez une photo de votre toit (optionnel)", required: false },
      { type: "text", label: "Nom complet", required: true },
      { type: "email", label: "Adresse e-mail", required: true },
      { type: "phone", label: "Numéro de téléphone", required: true },
    ],
  },
  {
    key: "plumbing",
    label: "Plomberie",
    basePrice: 120,
    headline: "Obtenez une estimation plomberie instantanée",
    subheadline: "Décrivez-nous la situation et nous vous donnerons une fourchette de prix.",
    questions: [
      {
        type: "single_choice",
        label: "De quoi avez-vous besoin ?",
        required: true,
        options: [
          { id: "o1", label: "Réparation de fuite", value: "leak", priceModifier: 0 },
          { id: "o2", label: "Canalisation bouchée", value: "clog", priceModifier: -20 },
          { id: "o3", label: "Installation d'un équipement", value: "install", priceModifier: 150 },
          { id: "o4", label: "Chauffe-eau", value: "heater", priceModifier: 600 },
        ],
      },
      {
        type: "single_choice",
        label: "Quel est le degré d'urgence ?",
        required: true,
        options: [
          { id: "o1", label: "Urgence (aujourd'hui)", value: "emergency", priceModifier: 150 },
          { id: "o2", label: "Cette semaine", value: "week", priceModifier: 0 },
          { id: "o3", label: "Je planifie à l'avance", value: "planning", priceModifier: -30 },
        ],
      },
      { type: "location", label: "Adresse du bien ou code postal", required: true },
      { type: "file", label: "Envoyez une photo du problème (optionnel)", required: false },
      { type: "text", label: "Nom complet", required: true },
      { type: "phone", label: "Numéro de téléphone", required: true },
      { type: "email", label: "Adresse e-mail", required: false },
    ],
  },
  {
    key: "painting",
    label: "Peinture",
    basePrice: 300,
    headline: "Combien coûterait votre projet de peinture ?",
    subheadline: "Quelques questions rapides pour une vraie fourchette de prix.",
    questions: [
      {
        type: "single_choice",
        label: "Intérieur ou extérieur ?",
        required: true,
        options: [
          { id: "o1", label: "Intérieur", value: "interior", priceModifier: 0 },
          { id: "o2", label: "Extérieur", value: "exterior", priceModifier: 400 },
        ],
      },
      { type: "number", label: "Surface approximative à peindre (m²)", required: true, perUnitRate: 2.25 },
      {
        type: "multiple_choice",
        label: "Une de ces situations s'applique-t-elle ?",
        required: false,
        options: [
          { id: "o1", label: "Plafonds hauts (3 m et plus)", value: "high_ceiling", priceModifier: 250 },
          { id: "o2", label: "Plinthes/moulures incluses", value: "trim", priceModifier: 150 },
          { id: "o3", label: "Couleur foncée actuelle, couches supplémentaires nécessaires", value: "dark_color", priceModifier: 200 },
        ],
      },
      { type: "text", label: "Nom complet", required: true },
      { type: "email", label: "Adresse e-mail", required: true },
      { type: "phone", label: "Numéro de téléphone", required: false },
    ],
  },
  {
    key: "landscaping",
    label: "Aménagement paysager",
    basePrice: 200,
    headline: "Obtenez un devis d'aménagement paysager instantané",
    subheadline: "Parlez-nous de votre jardin pour une estimation de prix.",
    questions: [
      {
        type: "single_choice",
        label: "De quel service avez-vous besoin ?",
        required: true,
        options: [
          { id: "o1", label: "Entretien de pelouse / tonte", value: "lawn", priceModifier: 0 },
          { id: "o2", label: "Conception paysagère", value: "design", priceModifier: 800 },
          { id: "o3", label: "Abattage d'arbre/arbuste", value: "removal", priceModifier: 400 },
          { id: "o4", label: "Installation d'irrigation", value: "irrigation", priceModifier: 1200 },
        ],
      },
      { type: "number", label: "Superficie approximative du jardin (m²)", required: true, perUnitRate: 0.15 },
      { type: "location", label: "Adresse du bien ou code postal", required: true },
      { type: "text", label: "Nom complet", required: true },
      { type: "email", label: "Adresse e-mail", required: true },
      { type: "phone", label: "Numéro de téléphone", required: false },
    ],
  },
  {
    key: "cleaning",
    label: "Nettoyage",
    basePrice: 90,
    headline: "Combien coûterait votre nettoyage ?",
    subheadline: "Un questionnaire rapide pour un prix instantané.",
    questions: [
      {
        type: "single_choice",
        label: "Quel type de nettoyage ?",
        required: true,
        options: [
          { id: "o1", label: "Nettoyage standard", value: "standard", priceModifier: 0 },
          { id: "o2", label: "Nettoyage en profondeur", value: "deep", priceModifier: 80 },
          { id: "o3", label: "Emménagement / déménagement", value: "moveout", priceModifier: 120 },
        ],
      },
      {
        type: "single_choice",
        label: "Combien de chambres ?",
        required: true,
        options: [
          { id: "o1", label: "Studio / 1", value: "1", priceModifier: 0 },
          { id: "o2", label: "2", value: "2", priceModifier: 30 },
          { id: "o3", label: "3", value: "3", priceModifier: 60 },
          { id: "o4", label: "4 et plus", value: "4plus", priceModifier: 100 },
        ],
      },
      {
        type: "single_choice",
        label: "À quelle fréquence ?",
        required: true,
        options: [
          { id: "o1", label: "Ponctuel", value: "one_time", priceModifier: 0 },
          { id: "o2", label: "Hebdomadaire", value: "weekly", priceModifier: -20 },
          { id: "o3", label: "Toutes les deux semaines", value: "biweekly", priceModifier: -10 },
        ],
      },
      { type: "location", label: "Adresse du bien ou code postal", required: true },
      { type: "text", label: "Nom complet", required: true },
      { type: "email", label: "Adresse e-mail", required: true },
      { type: "phone", label: "Numéro de téléphone", required: false },
    ],
  },
  {
    key: "blank",
    label: "Tunnel vierge",
    basePrice: 0,
    headline: "Obtenez une estimation instantanée",
    subheadline: "",
    questions: [
      { type: "text", label: "Nom complet", required: true },
      { type: "email", label: "Adresse e-mail", required: true },
      { type: "phone", label: "Numéro de téléphone", required: false },
    ],
  },
];

export function getTemplate(key: string): FunnelTemplate {
  return FUNNEL_TEMPLATES.find((t) => t.key === key) ?? FUNNEL_TEMPLATES[FUNNEL_TEMPLATES.length - 1];
}
