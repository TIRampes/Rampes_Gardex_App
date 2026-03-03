import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url' // <-- ajouté

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url) // <-- remplacé
const __dirname = path.dirname(__filename)        // <-- remplacé

async function migrateCategories() {
  console.log('🚀 Début de la migration des catégories de pièces...')

  const results: string[] = []
  const csvPath = path.join(__dirname, '../data/Logistique_Categorie_Pieces.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fichier non trouvé: ${csvPath}`)
    return
  }

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({ headers: ['nom'], skipLines: 1 }))
      .on('data', (data) => {
        const nom = data.nom?.trim()
        if (nom && nom !== 'Title') results.push(nom)
      })
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`📋 ${results.length} catégories trouvées`)

  let created = 0
  for (const nom of results) {
    try {
      await prisma.categoriePiece.upsert({
        where: { nom },
        update: {},
        create: { nom },
      })
      created++
    } catch (error) {
      console.error(`❌ Erreur pour la catégorie "${nom}":`, error)
    }
  }

  console.log(`✅ ${created} catégories importées.`)
}

migrateCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect())