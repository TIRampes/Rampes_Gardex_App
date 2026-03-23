// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: lib/fournisseurs-config.ts                      ║
// ║  NOUVEAU — config de tous les fournisseurs et formulaires  ║
// ╚══════════════════════════════════════════════════════════╝

export interface Fournisseur {
  id: string;
  nom: string;
  adresse: string;
  email: string;
  telephone?: string;
}

export interface ChampFormulaire {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  width?: 'full' | 'half' | 'third';
}

export interface LigneFormulaire {
  key: string;
  colonnes: { key: string; label: string; type: 'text' | 'number'; width?: string }[];
}

export interface ConfigFormulaire {
  titre: string;
  champsEntete: ChampFormulaire[];
  lignes?: LigneFormulaire;
  maxLignes?: number;
}

export interface TypeAchatConfig {
  id: string;
  label: string;
  fournisseurs: Fournisseur[];
  formulaire: ConfigFormulaire;
}

// ═══════════════════════════════════════════
// FOURNISSEURS
// ═══════════════════════════════════════════
const LEPAGE: Fournisseur = {
  id: 'lepage', nom: 'Vitrerie Lepage Inc.',
  adresse: '930 rue Raoul-Jobin, Québec (Québec) G1N 1S9',
  email: 'pierre-luc.laflamme@vitrerielepage.com',
};

const EUROVERRE: Fournisseur = {
  id: 'euroverre', nom: 'EuroVerre',
  adresse: '1610 rue Nationale, Terrebonne (Québec) J6W 0E2',
  email: 'commande@euroverre.com',
};

const AMG: Fournisseur = {
  id: 'amg', nom: 'AMG Fibre de verre',
  adresse: '1002 Rue Industrielle, St-Agapit, QC G0S 1Z0',
  email: '', telephone: '418-401-1108',
};

const DESCHENES: Fournisseur = {
  id: 'deschenes', nom: 'Rampes Deschênes',
  adresse: '621 Boul. St-Laurent Est, Louiseville, QC J5V 1J1',
  email: 'info@rampesdeschenes.ca', telephone: '819-228-2795',
};

const EUROFORGINGS: Fournisseur = {
  id: 'euroforgings', nom: 'EuroForgings',
  adresse: '', email: '',
};

const MCMEL: Fournisseur = {
  id: 'mcmel', nom: 'MCMEL',
  adresse: '', email: 'commandes@mcmel.ca', telephone: '450-588-2415',
};

// ═══════════════════════════════════════════
// OPTIONS RÉUTILISABLES
// ═══════════════════════════════════════════
const COULEURS_OPTIONS = [
  { value: '', label: '— Sélectionner —' },
  { value: 'NOIR', label: 'Noir' },
  { value: 'BLANC', label: 'Blanc' },
  { value: 'BRUN_COM', label: 'Brun commerciale' },
  { value: 'GRIS_CHARBON', label: 'Gris charbon' },
  { value: 'ARGILE', label: 'Argile' },
  { value: 'IVOIRE', label: 'Ivoire' },
  { value: 'GRIS_MET', label: 'Gris métallique' },
  { value: 'AUTRE', label: 'Autre' },
];

const EPAISSEUR_VERRE = [
  { value: '', label: '— Sélectionner —' },
  { value: '5', label: '5 mm' },
  { value: '6', label: '6 mm' },
  { value: '10', label: '10 mm' },
  { value: '12', label: '12 mm' },
];

const TYPE_VERRE = [
  { value: '', label: '— Sélectionner —' },
  { value: 'clair', label: 'Clair' },
  { value: 'gris', label: 'Gris' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'acide', label: 'Acide Etch' },
];

const TYPE_LIMON = [
  { value: '', label: '— Sélectionner —' },
  { value: 'simple', label: 'Limon simple' },
  { value: 'double', label: 'Limon double' },
  { value: 'triple', label: 'Limon triple' },
  { value: 'quadruple', label: 'Limon quadruple' },
];

const TYPE_MARCHE = [
  { value: '', label: '— Sélectionner —' },
  { value: 'fibre', label: 'Fibre' },
  { value: 'aluminium', label: 'Aluminium' },
  { value: 'composite', label: 'Composite' },
];

const LIPE_OPTIONS = [
  { value: '', label: '— Sélectionner —' },
  { value: 'standard', label: 'Standard' },
  { value: 'flush', label: 'Flush' },
  { value: 'inversee', label: 'Inversée' },
];

// ═══════════════════════════════════════════
// FORMULAIRE VERRE (partagé Lepage & EuroVerre)
// ═══════════════════════════════════════════
const FORMULAIRE_VERRE: ConfigFormulaire = {
  titre: 'Bon de commande — Verre',
  champsEntete: [
    { key: 'dateCommande', label: 'Date de commande', type: 'date', required: true, width: 'half' },
    { key: 'noCommande', label: 'No de commande', type: 'text', required: true, width: 'half' },
    { key: 'commandePar', label: 'Commandé par', type: 'text', width: 'half' },
    { key: 'dateLivraison', label: 'Date de livraison prévue', type: 'date', width: 'half' },
    { key: 'epaisseur', label: 'Épaisseur', type: 'select', options: EPAISSEUR_VERRE, width: 'half' },
    { key: 'typeVerre', label: 'Type de verre', type: 'select', options: TYPE_VERRE, width: 'half' },
  ],
  lignes: {
    key: 'items',
    colonnes: [
      { key: 'quantite', label: 'Quantité', type: 'number', width: '80px' },
      { key: 'longueur', label: 'Longueur', type: 'text' },
      { key: 'hauteur', label: 'Hauteur', type: 'text' },
      { key: 'commentaire', label: 'Commentaire', type: 'text' },
    ],
  },
  maxLignes: 15,
};

// ═══════════════════════════════════════════
// CONFIG COMPLÈTE PAR TYPE D'ACHAT
// ═══════════════════════════════════════════
export const TYPES_ACHAT: TypeAchatConfig[] = [
  {
    id: 'FIBRE', label: 'Fibre',
    fournisseurs: [AMG],
    formulaire: {
      titre: 'Bon de commande — AMG Fibre de verre',
      champsEntete: [
        { key: 'soumission', label: 'Soumission #', type: 'text', width: 'half' },
        { key: 'po', label: 'PO', type: 'text', required: true, width: 'half' },
        { key: 'dateRequise', label: 'Date requise', type: 'date', width: 'third' },
        { key: 'dateRecu', label: 'Date reçu', type: 'date', width: 'third' },
        { key: 'dateLivraison', label: 'Date de livraison', type: 'date', width: 'third' },
        { key: 'couleur', label: 'Couleur', type: 'select', options: COULEURS_OPTIONS, width: 'half' },
        { key: 'option', label: 'Option', type: 'text', width: 'half' },
        { key: 'muretFibre', label: 'Muret en fibre', type: 'text', width: 'half' },
        { key: 'marches', label: 'Marches', type: 'text', width: 'half' },
      ],
      lignes: {
        key: 'mesures',
        colonnes: [
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'quantite', label: 'Qté', type: 'number', width: '60px' },
          { key: 'dimension', label: 'Dimension', type: 'text' },
        ],
      },
      maxLignes: 20,
    },
  },
  {
    id: 'LIMONS', label: 'Limons',
    fournisseurs: [DESCHENES],
    formulaire: {
      titre: 'Bon de commande — Rampes Deschênes (Limons)',
      champsEntete: [
        { key: 'po', label: 'P.O.', type: 'text', required: true, width: 'half' },
        { key: 'date', label: 'Date', type: 'date', required: true, width: 'half' },
        { key: 'hauteurTotale', label: 'Hauteur totale', type: 'text', width: 'half' },
        { key: 'courseTotale', label: 'Course totale', type: 'text', width: 'half' },
        { key: 'couleur', label: 'Couleur', type: 'select', options: COULEURS_OPTIONS, width: 'half' },
        { key: 'typeLimon', label: 'Type de limon', type: 'select', options: TYPE_LIMON, width: 'half' },
        { key: 'nbMarches', label: 'Nombre de marches', type: 'number', width: 'third' },
        { key: 'nbEnsembles', label: "Nombre d'ensembles", type: 'number', width: 'third' },
        { key: 'nbLimons', label: 'Nombre de limons', type: 'number', width: 'third' },
        { key: 'typeMarche', label: 'Type de marche', type: 'select', options: TYPE_MARCHE, width: 'half' },
        { key: 'lipe', label: 'Lipe', type: 'select', options: LIPE_OPTIONS, width: 'half' },
        { key: 'contreMarche', label: 'Contre-marche', type: 'text', width: 'half' },
        { key: 'giron', label: 'Giron', type: 'text', width: 'half' },
        { key: 'options', label: 'Options', type: 'textarea', width: 'full', placeholder: 'Double marche, Base plus court, Pied de limon de façade...' },
      ],
    },
  },
  {
    id: 'VERRES', label: 'Verres',
    fournisseurs: [LEPAGE, EUROVERRE],
    formulaire: FORMULAIRE_VERRE,
  },
  {
    id: 'COLONNES', label: 'Colonnes',
    fournisseurs: [MCMEL],
    formulaire: {
      titre: 'Commande de colonnes — MCMEL',
      champsEntete: [
        { key: 'date', label: 'Date', type: 'date', required: true, width: 'half' },
        { key: 'reference', label: 'Référence', type: 'text', required: true, width: 'half' },
      ],
      lignes: {
        key: 'colonnes',
        colonnes: [
          { key: 'type', label: 'Type de colonne', type: 'text' },
          { key: 'taille', label: 'Taille', type: 'text', width: '100px' },
          { key: 'argile', label: 'Argile', type: 'number', width: '60px' },
          { key: 'blanc', label: 'Blanc', type: 'number', width: '60px' },
          { key: 'brun', label: 'Brun', type: 'number', width: '60px' },
          { key: 'noir', label: 'Noir', type: 'number', width: '60px' },
          { key: 'noirFonte', label: 'Noir fonte', type: 'number', width: '60px' },
        ],
      },
      maxLignes: 10,
    },
  },
  {
    id: 'PEINTURE', label: 'Peinture',
    fournisseurs: [{ id: 'peinture_dj', nom: 'Peinture DJ', adresse: '', email: '' }],
    formulaire: {
      titre: 'Commande de peinture',
      champsEntete: [
        { key: 'po', label: 'P.O.', type: 'text', required: true, width: 'half' },
        { key: 'date', label: 'Date', type: 'date', required: true, width: 'half' },
        { key: 'couleur', label: 'Couleur', type: 'select', options: COULEURS_OPTIONS, width: 'half' },
        { key: 'quantite', label: 'Quantité', type: 'number', width: 'half' },
        { key: 'notes', label: 'Notes', type: 'textarea', width: 'full' },
      ],
    },
  },
  {
    id: 'ATTACHES', label: 'Attaches',
    fournisseurs: [EUROFORGINGS],
    formulaire: {
      titre: 'Bon de commande — EuroForgings (Attaches)',
      champsEntete: [
        { key: 'po', label: 'P.O.', type: 'text', required: true, width: 'half' },
        { key: 'date', label: 'Date', type: 'date', required: true, width: 'half' },
      ],
      lignes: {
        key: 'produits',
        colonnes: [
          { key: 'code', label: 'Code produit', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'quantite', label: 'Qté', type: 'number', width: '70px' },
          { key: 'prixUnit', label: 'Prix unit. ($)', type: 'number', width: '90px' },
        ],
      },
      maxLignes: 15,
    },
  },
  {
    id: 'PLANCHER_ALUMINIUM', label: 'Plancher aluminium',
    fournisseurs: [{ id: 'plancher_alu', nom: 'Fournisseur plancher', adresse: '', email: '' }],
    formulaire: {
      titre: 'Commande de plancher aluminium',
      champsEntete: [
        { key: 'po', label: 'P.O.', type: 'text', required: true, width: 'half' },
        { key: 'date', label: 'Date', type: 'date', required: true, width: 'half' },
        { key: 'couleur', label: 'Couleur', type: 'select', options: COULEURS_OPTIONS, width: 'half' },
        { key: 'quantite', label: 'Quantité', type: 'number', width: 'half' },
        { key: 'dimensions', label: 'Dimensions', type: 'text', width: 'full' },
        { key: 'notes', label: 'Notes', type: 'textarea', width: 'full' },
      ],
    },
  },
];

// Helper pour trouver un type d'achat par ID
export function getTypeAchat(id: string): TypeAchatConfig | undefined {
  return TYPES_ACHAT.find(t => t.id === id);
}

// Helper pour obtenir les options de type d'achat
export function getTypeAchatOptions() {
  return TYPES_ACHAT.map(t => ({ value: t.id, label: t.label }));
}

// Produits EuroForgings prédéfinis
export const EUROFORGINGS_PRODUITS = [
  { code: 'SSGC411XX16S', description: 'Attache vision bas', prix: 18.28 },
  { code: 'SSGC431XX16S', description: 'Attache vision haut', prix: 14.01 },
  { code: 'SSSPIGOTS6S', description: 'Attache en surface satin (SPIGOT)', prix: 48.20 },
  { code: 'SSSPIGOTS6B', description: 'Attache en surface noir (SPIGOT NOIR)', prix: 51.85 },
  { code: 'SSGCH40116S', description: 'Attache vision à angle (Swivell)', prix: 25.07 },
  { code: 'SSPFEB180S', description: 'Connecteur 180 degrés', prix: 12.56 },
  { code: 'SSPFEB90S', description: 'Connecteur 90 degrés (deux verres)', prix: 12.56 },
  { code: 'SSPFEBWALLS', description: 'Connecteur 90 degrés (au mur)', prix: 12.56 },
  { code: 'SSPFEBADJS', description: 'Connecteur ajustable verre-verre', prix: 25.00 },
  { code: 'SSSPIGOTE SATIN', description: 'Attache en façade (SPIGOT EDGE)', prix: 128.74 },
  { code: 'SSSPIGOTE BLACK', description: 'Attache en façade noir (SPIGOT EDGE NOIR)', prix: 138.03 },
  { code: 'ZZSSGC411XX16B', description: 'Attache vision noir (bas)', prix: 23.10 },
  { code: 'ZZSSGC431XX16B', description: 'Attaches vision noir (haut)', prix: 18.85 },
];