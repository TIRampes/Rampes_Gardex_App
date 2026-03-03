// scripts/migrate-transactions.ts
import { PrismaClient, TypeMouvement } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Active les logs Prisma
})

function parseNumber(str: string | undefined): number {
  if (!str) return 0
  return parseInt(str.replace(/,/g, '')) || 0
}

function parseDate(str: string | undefined): Date | null {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function mapTypeTransaction(type: string): TypeMouvement {
  const t = type?.toLowerCase().trim()
  if (t === 'entrée') return TypeMouvement.ENTREE
  if (t === 'sortie') return TypeMouvement.SORTIE
  if (t === 'sortie-peinture') return TypeMouvement.SORTIE_PEINTURE
  if (t === 'mise à jour') return TypeMouvement.AJUSTEMENT
  return TypeMouvement.AJUSTEMENT
}

function normalizeCode(code: string): string {
  return code.replace(/\s+/g, '').replace(/-/g, '.').toUpperCase()
}

async function migrateTransactions() {
  console.log('🚀 Début de la migration des transactions...')

  // Test de connexion DB
  try {
    const test = await prisma.$queryRaw`SELECT 1`
    console.log('✅ Connexion DB OK', test)
  } catch (err) {
    console.error('❌ Échec de connexion à la base de données:', err)
    process.exit(1)
  }

  const csvPath = path.join(__dirname, '../data/Logistique_Inventaire_Transaction.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fichier non trouvé: ${csvPath}`)
    return
  }

  // Lecture du CSV
  const results: any[] = []
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.replace(/^"|"$/g, '').trim()
      }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`📋 ${results.length} transactions trouvées`)

  // Précharger tous les produits
  console.log('⏳ Préchargement des produits...')
  const tousProduits = await prisma.produit.findMany()
  // Maps pour recherche rapide
  const exactMap = new Map(tousProduits.map(p => [p.code, p.id]))
  const normalizedMap = new Map(tousProduits.map(p => [normalizeCode(p.code), p.id]))
  console.log(`✅ ${tousProduits.length} produits préchargés`)

  let imported = 0
  let skipped = 0
  let duplicates = 0
  let createdProducts = 0

  for (let i = 0; i < results.length; i++) {
    const row = results[i]

    // Progression toutes les 500 lignes
    if (i % 500 === 0) {
      console.log(`⏳ Progression: ${i}/${results.length} (importés: ${imported})`)
    }

    try {
      // Log pour suivre la ligne en cours
      console.log(`Traitement ligne ${i}...`)

      const codePieceRaw = row.Piece?.trim()
      if (!codePieceRaw) {
        skipped++
        console.log(`   → Code vide, ignoré`)
        continue
      }

      // Recherche du produit
      let produitId = exactMap.get(codePieceRaw)
      if (!produitId) {
        const norm = normalizeCode(codePieceRaw)
        produitId = normalizedMap.get(norm)
        if (produitId) {
          console.log(`   → Produit trouvé par normalisation: ${codePieceRaw} -> ${norm}`)
        }
      } else {
        console.log(`   → Produit trouvé exact: ${codePieceRaw}`)
      }

      // Création si inexistant
      if (!produitId) {
        console.log(`   ➕ Création du produit manquant: ${codePieceRaw}`)
        const newProduit = await prisma.produit.create({
          data: {
            code: codePieceRaw,
            nom: codePieceRaw,
            description: `Créé automatiquement lors de l'import des transactions`,
            quantite: 0,
            seuilMin: 0,
          }
        })
        produitId = newProduit.id
        // Ajouter aux Maps
        exactMap.set(codePieceRaw, produitId)
        normalizedMap.set(normalizeCode(codePieceRaw), produitId)
        createdProducts++
      }

      const quantite = parseNumber(row.Quantite)
      console.log(`   → Quantité: ${quantite}`)

      const data = {
        produitId,
        type: mapTypeTransaction(row.TypeTransaction),
        quantite,
        quantiteAvant: 0,
        quantiteApres: 0,
        noTransaction: row.NoTransaction?.trim(),
        receptionTransaction: parseNumber(row.ReceptionTransaction),
        codePiecePeinte: row.Code_Piece_Peinte?.trim() || null,
        dateReceptionPeinture: parseDate(row.DateReceptionPeinture),
        noOrdrePeinture: row.NoOrdrePeinture?.trim() || null,
        heureTransaction: row.HeureTransaction?.trim() || null,
        emplacement: row.Emplacement?.trim() || null,
        createdAt: parseDate(row.DateTransaction) || new Date(),
      }

      console.log(`   → Tentative de création de la transaction...`)
      await prisma.mouvementStock.create({ data })
      imported++
      console.log(`   ✅ Transaction importée`)
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('noTransaction')) {
        duplicates++
        console.log(`   ⚠️ Doublon ignoré pour noTransaction: ${row.NoTransaction}`)
      } else {
        console.error(`❌ Erreur pour la transaction ligne ${i}:`, error)
        // Optionnel: décommenter pour arrêter à la première erreur
        // throw error
      }
    }
  }

  console.log(`\n✅ ${imported} transactions importées`)
  console.log(`⚠️ ${skipped} ignorées (code vide)`)
  console.log(`⚠️ ${duplicates} doublons ignorés (noTransaction en double)`)
  console.log(`🆕 ${createdProducts} produits créés automatiquement`)
}

migrateTransactions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())