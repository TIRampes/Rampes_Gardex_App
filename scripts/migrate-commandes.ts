import { PrismaClient, TypeCommande, ServiceCommande, StatutCommande, TypeActivite, CodeProduction, StatutAchat } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

//  Nettoie les numéros de téléphone (garde les tirets)
const cleanPhone = (phone: string): string | null => {
  if (!phone) return null
  return phone.replace(/\s/g, '')
}

//  Convertit les dates du format CSV en Date
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null
  try {
    const cleanDate = dateStr.split(' ')[0]
    return new Date(cleanDate)
  } catch {
    return null
  }
}

//  Convertit les nombres avec virgule en Decimal
const parseDecimal = (value: string): number => {
  if (!value || value.trim() === '') return 0
  return parseFloat(value.replace(/,/g, '')) || 0
}

//  Convertit les entiers
const parseInteger = (value: string): number => {
  if (!value || value.trim() === '') return 0
  return Number(value) || 0
}

//  Mapping des représentants (sigle → email)
const representantMapping: Record<string, string> = {
  'D.D': 'd.dore@rampesgardex.com',
  'M.B': 'martin.boiteau@rampesgardex.com',
  'G.D': 'guy.drolet@rampesgardex.com',
  'Y.G': 'yves.gosselin@rampesgardex.com',
}

// Mapping des statuts d'achat
const mapStatutAchat = (value: string): StatutAchat | null => {
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

//  Mapping des codes de production
const mapCodeProduction = (value: string): CodeProduction | null => {
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

// Détermine le type de commande
const mapTypeCommande = (row: any): TypeCommande => {
  if (row.Projet || row.ProjetNumerique) return TypeCommande.MULTI_PHASE
  return TypeCommande.STANDARD
}

//  Détermine le service
const mapService = (service: string): ServiceCommande => {
  const mapping: Record<string, ServiceCommande> = {
    'Installation': ServiceCommande.INSTALLATION,
    'Livraison': ServiceCommande.LIVRAISON,
    'Cueillette': ServiceCommande.CUEILLETTE,
    'Transport': ServiceCommande.TRANSPORT,
    'Mesure': ServiceCommande.MESURE,
  }
  return mapping[service] || ServiceCommande.INSTALLATION
}

async function migrateCommandes() {
  console.log(' Début de la migration des commandes...')
  
  const results: any[] = []
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let updatedCount = 0
  let createdCount = 0

  const csvPath = path.join(__dirname, '../data/LOGISITIQUE_COMMANDE.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error(` Fichier non trouvé: ${csvPath}`)
    return
  }

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(` ${results.length} commandes trouvées dans le CSV`)

  //  DEBUG CRITIQUE - Afficher les vraies clés
  console.log('\n🔍 DEBUG - 3 premières lignes:')
  for (let i = 0; i < 3 && i < results.length; i++) {
    console.log(`\n--- Ligne ${i + 1} ---`)
    console.log('Clés disponibles:', Object.keys(results[i]))
    console.log('Première clé:', Object.keys(results[i])[0])
    console.log('Première valeur:', Object.values(results[i])[0])
    console.log('NomClient:', results[i]["NomClient"])
  }

  //  PRECHARGER LES CLIENTS ET REPRÉSENTANTS
  console.log('\n📦 Préchargement des références...')
  
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
      // -------------------------------------------------
      // 1. NUMÉRO DE COMMANDE - PRENDRE LA PREMIÈRE COLONNE
      // -------------------------------------------------
      const firstKey = Object.keys(row)[0]
      const numero = row[firstKey]?.trim()
      
      if (!numero) {
        skippedCount++
        continue
      }

      // -------------------------------------------------
      // 2. CLIENT
      // -------------------------------------------------
      const nomClient = row["NomClient"]?.trim()
      if (!nomClient) {
        console.log(` [${index + 1}] Commande ${numero}: pas de nom client`)
        skippedCount++
        continue
      }

      let client = allClients.find(c => 
        c.nom.toLowerCase().includes(nomClient.toLowerCase()) ||
        nomClient.toLowerCase().includes(c.nom.toLowerCase())
      )

      if (!client) {
        console.log(`[${index + 1}] Commande ${numero}: client non trouvé "${nomClient}"`)
        skippedCount++
        continue
      }

      // -------------------------------------------------
      // 3. REPRÉSENTANT
      // -------------------------------------------------
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

      // -------------------------------------------------
      // 4. DATES
      // -------------------------------------------------
      const dateEntree = parseDate(row["DateEntreeCommande"]) || new Date()
      const datePrevue = parseDate(row["DatePrevueClient"])
      const dateLivraison = parseDate(row["DateLivraison"])
      const datePriseMesure = parseDate(row["MesureDate"])

      // -------------------------------------------------
      // 5. PRIX
      // -------------------------------------------------
      const prixVenteInstallation = parseDecimal(row["PrixVenteInstallation"])
      const prixVenteMateriaux = parseDecimal(row["PrixVenteMateriaux"])
      const prixTotal = prixVenteInstallation + prixVenteMateriaux

      // -------------------------------------------------
      // 6. MESURES
      // -------------------------------------------------
      const piedsLineairesRampes = parseInteger(row["PiLinRampes"])
      const piedsCarresFibre = parseInteger(row["PiCarreFibre"])
      const piedsRampesBarrotin = parseInteger(row["Equiv_Barrotin"])
      const piedsRampesVerre = parseInteger(row["Equiv_Verre"])
      const piedsRampesMurIntimite = parseInteger(row["Equiv_Mur"])
      const piedsRampesMainDouble = parseInteger(row["Equiv_MainDouble"])
      const piedsRampesGardexVision = parseInteger(row["Equiv_GardexVision"])
      const piedsRampesGardexVisionUrbaine = parseInteger(row["Equiv_GardexVisionUrbaine"])
      const piedsRampesGardexVisionOptimum = parseInteger(row["Equiv_GardexVisionOptimum"])

      // -------------------------------------------------
      // 7. PRODUCTION ET ACHATS
      // -------------------------------------------------
      const structure = row["Structure"]?.toLowerCase() === 'vrai'
      const couleur = row["Couleur"] || null
      const enProduction = row["TermineProd"] === '√'
      
      const mesure = mapCodeProduction(row["Mesure2"])
      const plan = mapCodeProduction(row["Plan"])
      const envoyeProduction = mapCodeProduction(row["DonneProd"])
      const productionTerminee = mapCodeProduction(row["TermineProd"])
      const termine = mapCodeProduction(row["Termine"])

      // Achats
      const achatFibre = mapStatutAchat(row["Fibre"])
      const dateReceptionFibre = parseDate(row["Fibre_Date_Reception"])
      const achatLimons = mapStatutAchat(row["Limon"])
      const dateReceptionLimons = parseDate(row["Limon_Date_Reception"])
      const achatVerres = mapStatutAchat(row["Verre"])
      const dateReceptionVerre = parseDate(row["Verre_Date_Reception"])
      const achatColonnes = mapStatutAchat(row["Colonne"])
      const dateReceptionColonnes = parseDate(row["Colonne_Date_Reception"])
      const achatPeinture = mapStatutAchat(row["Peinture"])
      const dateReceptionPeinture = parseDate(row["Peinture_Date_Reception"])
      const achatAttaches = mapStatutAchat(row["Attaches"])
      const dateReceptionAttaches = parseDate(row["Attaches_Date_Reception"])

      // -------------------------------------------------
      // 8. AUTRES CHAMPS
      // -------------------------------------------------
      const reference = row["Reference"] || null
      const adresse = row["Adresse"]?.trim() || 'Adresse non spécifiée'
      const commentaire = row["Commentaire"] || null
      const service = mapService(row["Service"])
      const typeCommande = mapTypeCommande(row)
      const piedsLineairesReels = parseInteger(row["PiLinComplete"]) || null

      // -------------------------------------------------
      // 9. CRÉATION/MISE À JOUR
      // -------------------------------------------------
      let existingCommande = await prisma.commande.findUnique({
        where: { numero }
      })

      const commandeData = {
        numero,
        clientId: client.id,
        representantId,
        reference,
        typeCommande,
        service,
        statut: StatutCommande.ACTIVE,
        activite: TypeActivite.INSTALLATION,
        adresse,
        dateEntree,
        datePrevue,
        dateLivraison,
        datePriseMesure,
        dateProduction: null,
        dateCompletion: null,
        dateAnnulation: null,
        prixVenteMateriaux,
        prixVenteInstallation,
        prixTotal,
        tempsEstimeInstallation: 0,
        piedsCarresFibre: piedsCarresFibre || null,
        piedsRampesBarrotin,
        piedsRampesVerre,
        piedsRampesMurIntimite,
        piedsRampesMainDouble,
        piedsRampesGardexVision,
        piedsRampesGardexVisionUrbaine,
        piedsRampesGardexVisionOptimum,
        piedsLineairesRampes,
        nombrePoteaux: 0,
        nombreBalcons: null,
        nombrePhases: null,
        piedsLineairesEstime: null,
        piedsLineairesReels,
        structure,
        couleur,
        mesure,
        mesureDonneeLe: null,
        plan,
        envoyeProduction,
        productionTerminee,
        termine,
        achatFibre,
        dateReceptionFibre,
        achatLimons,
        dateReceptionLimons,
        achatVerres,
        dateReceptionVerre,
        achatColonnes,
        dateReceptionColonnes,
        achatPeinture,
        dateReceptionPeinture,
        achatAttaches,
        dateReceptionAttaches,
        achatPlancherAluminium: null,
        dateReceptionPlancherAluminium: null,
        avertissementClient: null,
        dateAvertissement: null,
        avertissementPriseMesure: null,
        dateAvertissementPriseMesure: null,
        livraison: null,
        reprise: false,
        enProduction,
        clientPresent: false,
        formulaireComplete: false,
        commentaire,
      }

      if (existingCommande) {
        await prisma.commande.update({
          where: { id: existingCommande.id },
          data: commandeData
        })
        updatedCount++
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
      console.error(` [${index + 1}] Erreur:`, error.message)
    }
  }

  console.log('\n📊 RÉSUMÉ DE LA MIGRATION:')
  console.log(`✅ Commandes créées: ${createdCount}`)
  console.log(`🔄 Commandes mises à jour: ${updatedCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`⏭️  Ignorées: ${skippedCount}`)
  console.log(`📋 Total: ${results.length}`)
}

migrateCommandes()
  .catch(console.error)
  .finally(() => prisma.$disconnect())