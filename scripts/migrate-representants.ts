import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

//  Nettoie le numéro de téléphone
const cleanPhone = (phone: string): string | null => {
  if (!phone) return null
  return phone.replace(/\s/g, '') // Enlève seulement les espaces, GARDE les tirets
}
// Normalise le nom pour la recherche
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
    .replace(/[^a-z0-9]/g, '') // Enlève les caractères spéciaux
}

async function migrateRepresentants() {
  console.log('Début de la migration des représentants...')
  
  const results: any[] = []
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let updatedCount = 0
  let createdCount = 0

  const csvPath = path.join(__dirname, '../data/Logistique_Representant.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error(` Fichier non trouvé: ${csvPath}`)
    console.log('📁 Assurez-vous que le fichier CSV est dans le dossier "data"')
    return
  }

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(` ${results.length} représentants trouvés dans le CSV`)

  //  DEBUG: Afficher la première ligne
  if (results.length > 0) {
    console.log('\n🔍 APERÇU PREMIÈRE LIGNE:')
    console.log('Clés:', Object.keys(results[0]))
    console.log('Valeurs:', Object.values(results[0]))
  }

  for (const [index, row] of results.entries()) {
    try {
      //  Construction du nom complet: Prénom + Nom
      const prenom = (row["Prénom"] || '').trim()
      const nom = (row["Nom"] || '').trim()
      const nomComplet = `${prenom} ${nom}`.trim()
      const nomRep = row["NomRep"]?.trim() || ''

      //  Utiliser le nom complet comme nom principal
      let nomFinal = nomComplet
      
      // Si pas de prénom/nom, utiliser NomRep
      if (!nomFinal && nomRep) {
        nomFinal = nomRep
      }

      if (!nomFinal) {
        console.log(`⚠️ [${index + 1}] Ligne ignorée: aucun nom trouvé`)
        skippedCount++
        continue
      }

      const email = row["Email"]?.trim() || null
      const telephone = cleanPhone(row["NoTelephone"])

      //  RECHERCHE INTELLIGENTE DU REPRÉSENTANT
      let existingRepresentant = null
      let searchMethod = ''

      // 1. PRIORITÉ: Email (unique)
      if (email) {
        existingRepresentant = await prisma.representant.findFirst({
          where: { email: email }
        })
        if (existingRepresentant) searchMethod = 'email'
      }

      // 2. Téléphone
      if (!existingRepresentant && telephone) {
        existingRepresentant = await prisma.representant.findFirst({
          where: { telephone: telephone }
        })
        if (existingRepresentant) searchMethod = 'téléphone'
      }

      // 3. Nom exact
      if (!existingRepresentant) {
        existingRepresentant = await prisma.representant.findFirst({
          where: { nom: nomFinal }
        })
        if (existingRepresentant) searchMethod = 'nom exact'
      }

      // 4. Nom normalisé (pour les variations)
      if (!existingRepresentant) {
        const normalizedNomFinal = normalizeName(nomFinal)
        const allReps = await prisma.representant.findMany()
        existingRepresentant = allReps.find(r => 
          normalizeName(r.nom) === normalizedNomFinal
        )
        if (existingRepresentant) searchMethod = 'nom normalisé'
      }

      const representantData = {
        nom: nomFinal,
        email: email,
        telephone: telephone,
        actif: true
      }

      if (existingRepresentant) {
        // MISE À JOUR
        await prisma.representant.update({
          where: { id: existingRepresentant.id },
          data: representantData
        })
        updatedCount++
        
        if (updatedCount % 5 === 0) {
          console.log(`🔄 [${index + 1}/${results.length}] Mis à jour: ${nomFinal} (${searchMethod})`)
        }
      } else {
        //  CRÉATION
        await prisma.representant.create({
          data: representantData
        })
        createdCount++
        console.log(`✅ [${index + 1}/${results.length}] Créé: ${nomFinal}`)
      }

      successCount++

    } catch (error: any) {
      errorCount++
      console.error(`❌ [${index + 1}] Erreur:`, error.message)
      console.error('   Ligne:', row)
    }
  }

  console.log('\n📊 RÉSUMÉ DE LA MIGRATION:')
  console.log(`✅ Créés: ${createdCount}`)
  console.log(`🔄 Mis à jour: ${updatedCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`⏭️  Ignorés: ${skippedCount}`)
  console.log(`📋 Total: ${results.length}`)
}

// 🚀 EXÉCUTION
migrateRepresentants()
  .catch((e) => {
    console.error('💥 Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })