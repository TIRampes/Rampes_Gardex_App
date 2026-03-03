import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

// Fonction pour convertir les nombres, avec fallback
function parseNumber(str: string | undefined): number {
  if (!str) return 1
  const num = parseInt(str.replace(/,/g, ''))
  return isNaN(num) ? 1 : num
}

async function migrateUnites() {
  console.log('🚀 Début de la migration des unités...')

  const results: any[] = []
  const csvPath = path.join(process.cwd(), 'data/Logistique_Unite.csv') // utilisation de process.cwd() pour éviter __dirname

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fichier non trouvé: ${csvPath}`)
    return
  }

  // Lecture CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.replace(/^"|"$/g, '').trim()
      }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`📋 ${results.length} lignes trouvées dans le CSV`)

  let created = 0
  for (const [index, row] of results.entries()) {
    try {
      console.log(`\n🔹 Ligne ${index + 1}:`, row)

      const uniteRaw = row.Unite || row.unite || row['Unité'] // tentative de récupérer toutes variantes
      const unite = uniteRaw?.trim()
      if (!unite) {
        console.warn(`⚠️ Ligne ${index + 1} ignorée : valeur d'unité vide`)
        continue
      }

      const qtePar = parseNumber(row.QtéPar || row.QtePar)
      const description = row.Description?.trim() || null

      const result = await prisma.unite.upsert({
        where: { unite },
        update: { qtePar, description },
        create: { unite, qtePar, description },
      })

      console.log(`✅ Unité importée: ${result.unite}`)
      created++
    } catch (error) {
      console.error(`❌ Erreur pour la ligne ${index + 1}:`, error)
    }
  }

  console.log(`\n🎯 ${created} unités importées sur ${results.length} lignes.`)
}

migrateUnites()
  .catch(console.error)
  .finally(() => prisma.$disconnect())