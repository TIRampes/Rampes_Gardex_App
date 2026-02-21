import 'dotenv/config'
import { PrismaClient, TypeCommande, ServiceCommande, StatutCommande, CodeProduction, StatutAchat, Couleur, StatutLivraison } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

// Nettoyage des téléphones (optionnel)
const cleanPhone = (phone: string): string | null => {
  if (!phone) return null
  return phone.replace(/\s/g, '')
}

// Convertit une chaîne en Date, ignore les valeurs invalides
const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null
  try {
    const cleanDate = dateStr.split(' ')[0] // enlève l'heure si présente
    const date = new Date(cleanDate)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

// Convertit une chaîne en nombre décimal
const parseDecimal = (value: string | null | undefined): number => {
  if (!value || value.trim() === '') return 0
  return parseFloat(value.replace(/,/g, '').trim()) || 0
}

// Convertit une chaîne en entier
const parseInteger = (value: string | null | undefined): number => {
  if (!value || value.trim() === '') return 0
  return Number(value) || 0
}

// Mapping des représentants (sigle → email)
const representantMapping: Record<string, string> = {
  'D.D': 'd.dore@rampesgardex.com',
  'M.B': 'martin.boiteau@rampesgardex.com',
  'G.D': 'guy.drolet@rampesgardex.com',
  'Y.G': 'yves.gosselin@rampesgardex.com',
}

// Mapping des statuts d'achat (symbole → enum)
const mapStatutAchat = (value: string | null | undefined): StatutAchat | null => {
  if (!value || value.trim() === '') return null
  const mapping: Record<string, StatutAchat> = {
    '①': StatutAchat.A_FAIRE,
    '√': StatutAchat.FAIT,
    'R': StatutAchat.RECEPTIONNE,
    'P': StatutAchat.PRET_A_RAMASSER,
    'B/O': StatutAchat.BACK_ORDER,
  }
  return mapping[value] || null
}

// Mapping des codes de production
const mapCodeProduction = (value: string | null | undefined): CodeProduction | null => {
  if (!value || value.trim() === '') return null
  const mapping: Record<string, CodeProduction> = {
    '√': CodeProduction.COMPLETE,
    'At.C': CodeProduction.ATTENTE_CLIENT,
    'N/A': CodeProduction.NON_APPLICABLE,
    'P': CodeProduction.PARTIEL,
    'D': CodeProduction.DOSSIER_MESUREUR,
    'M': CodeProduction.MODIFICATION,
    'C-C': CodeProduction.ATTENTE_CAROL_CONFIRM,
    'C-RM': CodeProduction.ATTENTE_CAROL_MESURE,
    'B/O': CodeProduction.BACK_ORDER,
    'At. Rep': CodeProduction.ATTENTE_REPRESENTANT,
  }
  return mapping[value] || null
}

// Mapping des couleurs (retourne l'enum et la valeur personnalisée si AUTRE)
const mapCouleur = (value: string | null | undefined, speciale: string | null | undefined): { couleur: Couleur | null; personnalisee: string | null } => {
  const raw = value?.trim() || speciale?.trim()
  if (!raw) return { couleur: null, personnalisee: null }
  const mapping: Record<string, Couleur> = {
    'Noir': Couleur.NOIR,
    'Blanc': Couleur.BLANC,
    'Brun commerciale': Couleur.BRUN_COMMERCIALE,
    'Gris charbon': Couleur.GRIS_CHARBON,
    'Argile': Couleur.ARGILE,
    'Spéciale': Couleur.SPECIALE,
    'Gris métallique': Couleur.GRIS_METALLIQUE,
    'Autre': Couleur.AUTRE,
  }
  const found = mapping[raw]
  if (found) {
    return { couleur: found, personnalisee: null }
  }
  // Si non reconnu, on le traite comme "AUTRE" et on garde la valeur originale
  return { couleur: Couleur.AUTRE, personnalisee: raw }
}

// Détermine le type de commande
const mapTypeCommande = (row: any): TypeCommande => {
  if (row.Projet || row.ProjetNumerique) return TypeCommande.MULTI_PHASE
  return TypeCommande.STANDARD
}

// Détermine le service
const mapService = (service: string | null | undefined): ServiceCommande => {
  if (!service) return ServiceCommande.INSTALLATION
  const mapping: Record<string, ServiceCommande> = {
    'Installation': ServiceCommande.INSTALLATION,
    'Livraison': ServiceCommande.LIVRAISON,
    'Cueillette': ServiceCommande.CUEILLETTE,
    'Transport': ServiceCommande.TRANSPORT,
  }
  return mapping[service] || ServiceCommande.INSTALLATION
}

async function migrateCommandes() {
  console.log('🚀 Début de la migration des commandes...')
  
  const results: any[] = []
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let updatedCount = 0
  let createdCount = 0

  const csvPath = path.join(__dirname, '../data/LOGISITIQUE_COMMANDE.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fichier non trouvé: ${csvPath}`)
    return
  }

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve())
      .on('error', reject)
  })

  console.log(`📊 ${results.length} commandes trouvées dans le CSV`)

  // Précharger les clients et représentants
  console.log('📦 Préchargement des références...')
  
  const allClients = await prisma.client.findMany({
    select: { id: true, nom: true }
  })
  
  const allRepresentants = await prisma.representant.findMany({
    select: { id: true, nom: true, email: true }
  })

  console.log(`✅ ${allClients.length} clients trouvés en DB`)
  console.log(`✅ ${allRepresentants.length} représentants trouvés en DB`)

  for (const [index, row] of results.entries()) {
    try {
      // 1. Numéro de commande (première colonne)
      const firstKey = Object.keys(row)[0]
      const numero = row[firstKey]?.trim()
      
      if (!numero) {
        console.log(`⚠️ [${index + 1}] Ligne sans numéro, ignorée`)
        skippedCount++
        continue
      }

      // 2. Client
      const nomClient = row["NomClient"]?.trim()
      if (!nomClient) {
        console.log(`⚠️ [${index + 1}] Commande ${numero}: pas de nom client`)
        skippedCount++
        continue
      }

      let client = allClients.find(c => 
        c.nom.toLowerCase().includes(nomClient.toLowerCase()) ||
        nomClient.toLowerCase().includes(c.nom.toLowerCase())
      )

      if (!client) {
        console.log(`⚠️ [${index + 1}] Commande ${numero}: client non trouvé "${nomClient}"`)
        skippedCount++
        continue
      }

      // 3. Représentant
      let representantId = null
      const repSigle = row["Representant"]?.trim()
      if (repSigle) {
        const repEmail = representantMapping[repSigle]
        if (repEmail) {
          const representant = allRepresentants.find(r => r.email === repEmail)
          if (representant) {
            representantId = representant.id
          }
        }
      }

      // 4. Dates
      const dateEntree = parseDate(row["DateEntreeCommande"]) || new Date()
      const datePrevue = parseDate(row["DatePrevueClient"])
      const dateLivraison = parseDate(row["DateLivraison"])
      const datePriseMesure = parseDate(row["MesureDate"])

      // 5. Prix
      const prixVenteInstallation = parseDecimal(row["PrixVenteInstallation"])
      const prixVenteMateriaux = parseDecimal(row["PrixVenteMateriaux"])
      const prixTotal = prixVenteInstallation + prixVenteMateriaux

      // 6. Mesures (nouveaux champs)
      const piedsLineairesBarrotin = parseInteger(row["Equiv_Barrotin"])
      const piedsLineairesVerre = parseInteger(row["Equiv_Verre"])
      const piedsLineairesMur = parseInteger(row["Equiv_Mur"])
      const piedsLineairesMainDouble = parseInteger(row["Equiv_MainDouble"])
      const piedsLineairesGardexVision = parseInteger(row["Equiv_GardexVision"])
      const piedsLineairesGardexUrbaine = parseInteger(row["Equiv_GardexVisionUrbaine"])
      const piedsLineairesGardexOptimum = parseInteger(row["Equiv_GardexVisionOptimum"])
      const piedsLineairesRampes = parseInteger(row["PiLinRampes"])
      const piedsCarresFibre = parseInteger(row["PiCarreFibre"])
      const piedsLineairesReels = parseInteger(row["PiLinComplete"]) || null

      // 7. Production et achats
      const structure = row["Structure"]?.toLowerCase() === 'vrai'
      const enProduction = row["TermineProd"] === '√'

      // Gestion de la couleur
      const couleurRaw = row["Couleur"]?.trim()
      const couleurSpeciale = row["CouleurSpeciale"]?.trim()
      const { couleur, personnalisee: couleurPersonnalisee } = mapCouleur(couleurRaw, couleurSpeciale)

      // Codes de production
      const mesure = mapCodeProduction(row["Mesure2"])
      const plan = mapCodeProduction(row["Plan"])
      const envoyeProduction = mapCodeProduction(row["DonneProd"])
      const productionTerminee = mapCodeProduction(row["TermineProd"])
      const termine = mapCodeProduction(row["Termine"])

      // Achats avec dates d'envoi et réception
      const achatFibre = mapStatutAchat(row["Fibre"])
      const dateEnvoieFibre = parseDate(row["Fibre_Date"])
      const dateReceptionFibre = parseDate(row["Fibre_Date_Reception"])
      const quantiteNonRecueFibre = null

      const achatLimons = mapStatutAchat(row["Limon"])
      const dateEnvoieLimons = parseDate(row["Limon_Date"])
      const dateReceptionLimons = parseDate(row["Limon_Date_Reception"])
      const quantiteNonRecueLimons = null

      const achatVerres = mapStatutAchat(row["Verre"])
      const dateEnvoieVerres = parseDate(row["Verre_Date"])
      const dateReceptionVerre = parseDate(row["Verre_Date_Reception"])
      const quantiteNonRecueVerres = null

      const achatColonnes = mapStatutAchat(row["Colonne"])
      const dateEnvoieColonnes = parseDate(row["Colonne_Date"])
      const dateReceptionColonnes = parseDate(row["Colonne_Date_Reception"])
      const quantiteNonRecueColonnes = null

      const achatPeinture = mapStatutAchat(row["Peinture"])
      const dateEnvoiePeinture = parseDate(row["Peinture_Date"])
      const dateReceptionPeinture = parseDate(row["Peinture_Date_Reception"])
      const quantiteNonRecuePeinture = null

      const achatAttaches = mapStatutAchat(row["Attaches"])
      const dateEnvoieAttaches = parseDate(row["Attaches_Date"])
      const dateReceptionAttaches = parseDate(row["Attaches_Date_Reception"])
      const quantiteNonRecueAttaches = null

      // Plancher aluminium non présent dans CSV
      const achatPlancherAluminium = null
      const dateEnvoiePlancherAluminium = null
      const dateReceptionPlancherAluminium = null
      const quantiteNonRecuePlancherAluminium = null

      // 8. Autres champs
      const reference = row["Reference"] || null
      const adresse = row["Adresse"]?.trim() || 'Adresse non spécifiée'
      const commentaire = row["Commentaire"] || null
      const commentaireComplet = [commentaire, row["CommentaireMailPret"]].filter(Boolean).join(' | ') || null

      const service = mapService(row["Service"])
      const typeCommande = mapTypeCommande(row)

      // Reprise
      const reprise = row["Reprise"]?.toLowerCase() === 'vrai'
      const ancienneCommandeNumero = reprise ? (row["RepriseNumerique"] || null) : null

      // Statut livraison par défaut
      const statutLivraison = StatutLivraison.N_A

      // Commentaire adresse (pas dans CSV)
      const commentaireAdresse = null

      // Semaine prévue (pas dans CSV)
      const semainePrevue = null

      // Temps installation auto (pas dans CSV)
      const utiliserCalculAuto = false
      const tempsInstallationAuto = 0

      // Anciens champs de mesures (mis à 0)
      const tempsEstimeInstallation = 0
      const piedsRampesBarrotin = 0
      const piedsRampesVerre = 0
      const piedsRampesMurIntimite = 0
      const piedsRampesMainDouble = 0
      const piedsRampesGardexVision = 0
      const piedsRampesGardexVisionUrbaine = 0
      const piedsRampesGardexVisionOptimum = 0
      const nombrePoteaux = 0
      const nombreBalcons = null
      const nombrePhases = null
      const piedsLineairesEstime = null

      // Date production (pas dans CSV)
      const dateProduction = null

      // Préparer les données pour la création/mise à jour
      const commandeData = {
        numero,
        client: { connect: { id: client.id } },
        representant: representantId ? { connect: { id: representantId } } : undefined,
        reference,
        typeCommande,
        service,
        statut: StatutCommande.ACTIVE,
        adresse,
        commentaireAdresse,
        couleur,
        couleurPersonnalisee,
        reprise,
        ancienneCommandeNumero,
        dateEntree,
        datePrevue,
        dateProduction,
        datePriseMesure,
        dateLivraison,
        dateCompletion: null,
        dateAnnulation: null,
        semainePrevue,
        prixVenteMateriaux,
        prixVenteInstallation,
        prixTotal,
        tempsInstallationAuto,
        utiliserCalculAuto,
        // Nouveaux champs de pieds linéaires
        piedsLineairesBarrotin,
        piedsLineairesVerre,
        piedsLineairesMur,
        piedsLineairesMainDouble,
        piedsLineairesGardexVision,
        piedsLineairesGardexUrbaine,
        piedsLineairesGardexOptimum,
        piedsLineairesRampes,
        nombrePoteaux,
        // Anciens champs (mis à 0)
        tempsEstimeInstallation,
        piedsCarresFibre: piedsCarresFibre || null,
        piedsRampesBarrotin,
        piedsRampesVerre,
        piedsRampesMurIntimite,
        piedsRampesMainDouble,
        piedsRampesGardexVision,
        piedsRampesGardexVisionUrbaine,
        piedsRampesGardexVisionOptimum,
        nombreBalcons,
        nombrePhases,
        piedsLineairesEstime,
        piedsLineairesReels,
        structure,
        mesure,
        mesureDonneeLe: null,
        plan,
        envoyeProduction,
        productionTerminee,
        termine,
        statutLivraison,
        installation: null,
        // Achats
        achatFibre,
        dateEnvoieFibre,
        dateReceptionFibre,
        quantiteNonRecueFibre,
        achatLimons,
        dateEnvoieLimons,
        dateReceptionLimons,
        quantiteNonRecueLimons,
        achatVerres,
        dateEnvoieVerres,
        dateReceptionVerre,
        quantiteNonRecueVerres,
        achatColonnes,
        dateEnvoieColonnes,
        dateReceptionColonnes,
        quantiteNonRecueColonnes,
        achatPeinture,
        dateEnvoiePeinture,
        dateReceptionPeinture,
        quantiteNonRecuePeinture,
        achatAttaches,
        dateEnvoieAttaches,
        dateReceptionAttaches,
        quantiteNonRecueAttaches,
        achatPlancherAluminium,
        dateEnvoiePlancherAluminium,
        dateReceptionPlancherAluminium,
        quantiteNonRecuePlancherAluminium,
        // Avertissements
        avertissementClient: null,
        dateAvertissement: null,
        avertissementPriseMesure: null,
        dateAvertissementPriseMesure: null,
        // Flags
        enProduction,
        clientPresent: false,
        formulaireComplete: false,
        commentaire: commentaireComplet,
      }

      // Vérifier si la commande existe déjà
      let existingCommande = await prisma.commande.findUnique({
        where: { numero }
      })

      if (existingCommande) {
        await prisma.commande.update({
          where: { id: existingCommande.id },
          data: commandeData
        })
        updatedCount++
        if (updatedCount % 10 === 0) {
          console.log(`🔄 [${index + 1}/${results.length}] ${updatedCount} commandes mises à jour`)
        }
      } else {
        await prisma.commande.create({
          data: commandeData
        })
        createdCount++
        if (createdCount % 10 === 0) {
          console.log(`✅ [${index + 1}/${results.length}] ${createdCount} commandes créées`)
        }
      }

      successCount++

    } catch (error: any) {
      errorCount++
      console.error(`❌ [${index + 1}] Erreur:`, error.message)
      if (error.meta) console.error(error.meta)
    }
  }

  console.log('\n📊 RÉSUMÉ DE LA MIGRATION:')
  console.log(`✅ Commandes créées: ${createdCount}`)
  console.log(`🔄 Commandes mises à jour: ${updatedCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`⏭️  Ignorées: ${skippedCount}`)
  console.log(`📋 Total traitées: ${successCount}/${results.length}`)
}

migrateCommandes()
  .catch(console.error)
  .finally(() => prisma.$disconnect())