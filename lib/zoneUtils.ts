// Configuration des villes par zone
const VILLES_RIVE_NORD = [
  'laval', 'blainville', 'boisbriand', 'bois-des-filion', 'chomedey', 'duvernay',
  'fabreville', 'lorraine', 'rosemère', 'sainte-dorothée', 'saint-françois',
  'saint-vincent-de-paul', 'sainte-rose', 'terrebonne', 'mascouche',
  'repentigny', 'charlemagne', 'lachenaie', 'le gardeur', 'l\'assomption',
  'saint-eustache', 'deux-montagnes', 'sainte-marthe-sur-le-lac', 'pointe-calumet',
  'oakville', 'mississauga', 'brampton', 'vaughan', 'richmond hill',
  'markham', 'pickering', 'ajax', 'whitby', 'oshawa'
];

const VILLES_RIVE_SUD = [
  'brossard', 'longueuil', 'greenfield park', 'saint-lambert', 'saint-hubert',
  'lemoyne', 'st-hubert', 'boucherville', 'sainte-julie', 'vareness',
  'saint-basile-le-grand', 'saint-bruno-de-montarville', 'montarville',
  'chambly', 'richelieu', 'saint-mathias-sur-richelieu', 'carignan',
  'beloeil', 'mont-saint-hilaire', 'saint-hilaire', 'otterburn park',
  'saint-jean-sur-richelieu', 'saint-jean', 'lachenaie', 'candiac',
  'la prairie', 'saint-constant', 'sainte-catherine', 'delson',
  'mercier', 'châteauguay', 'léry', 'beauharnois', 'salaberry-de-valleyfield'
];

// Codes postaux des régions
const CP_RIVE_NORD = ['H7', 'H8', 'J7', 'J0N', 'J5Z', 'J6W', 'J6Y', 'J6Z', 'J5V', 'J5W', 'J5X', 'J5Y'];
const CP_RIVE_SUD = ['J4', 'J3', 'J2', 'J1', 'J0L', 'J0J', 'J3Y', 'J3X', 'J3R', 'J3L', 'J3M'];

/**
 * Détermine la zone résidentielle en fonction de l'adresse
 * @param ville - Nom de la ville
 * @param codePostal - Code postal
 * @returns "RIVE_NORD", "RIVE_SUD" ou null si indéterminé
 */
export function determinerZoneResidentielle(ville?: string | null, codePostal?: string | null): "RIVE_NORD" | "RIVE_SUD" | null {
  if (!ville && !codePostal) return null;
  
  // Nettoyer les entrées
  const villeClean = ville?.toLowerCase().trim() || '';
  const codePostalClean = codePostal?.toUpperCase().trim() || '';
  const prefixCP = codePostalClean.substring(0, 3); // Ex: "H7J" -> "H7"

  // 1. Vérifier par la ville (priorité)
  if (villeClean) {
    // Vérifier Rive Nord
    if (VILLES_RIVE_NORD.some(v => villeClean.includes(v))) {
      return "RIVE_NORD";
    }
    // Vérifier Rive Sud
    if (VILLES_RIVE_SUD.some(v => villeClean.includes(v))) {
      return "RIVE_SUD";
    }
  }

  // 2. Vérifier par le code postal (si ville non concluante)
  if (codePostalClean) {
    if (CP_RIVE_NORD.some(prefix => codePostalClean.startsWith(prefix))) {
      return "RIVE_NORD";
    }
    if (CP_RIVE_SUD.some(prefix => codePostalClean.startsWith(prefix))) {
      return "RIVE_SUD";
    }
  }

  // 3. Par défaut, analyser les indices géographiques
  if (villeClean) {
    // Indices pour Rive Nord (fleuve, nord, etc.)
    if (villeClean.includes('nord') || villeClean.includes('north')) {
      return "RIVE_NORD";
    }
    // Indices pour Rive Sud (sud, south)
    if (villeClean.includes('sud') || villeClean.includes('south')) {
      return "RIVE_SUD";
    }
  }

  return null;
}