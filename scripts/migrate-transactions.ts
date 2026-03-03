// scripts/migrate-transactions.ts
import { PrismaClient, TypeMouvement } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

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

// Normalisation pour recherche (supprime espaces, remplace - par ., met en majuscule)
function normalizeCode(code: string): string {
  return code.replace(/\s+/g, '').replace(/-/g, '.').toUpperCase()
}

// Cherche un produit par code exact, puis par normalisation. Sinon le crée.
async function getOrCreateProduit(code: string): Promise<string> {
  // 1. recherche exacte
  let produit = await prisma.produit.findUnique({ where: { code } })
  if (produit) return produit.id

  // 2. recherche normalisée parmi tous les produits
  const norm = normalizeCode(code)
  const tous = await prisma.produit.findMany()
  const found = tous.find(p => normalizeCode(p.code) === norm)
  if (found) return found.id

  // 3. création automatique
  console.log(`➕ Création du produit manquant: ${code}`)
  const newProduit = await prisma.produit.create({
    data: {
      code,
      nom: code,
      description: `Créé automatiquement lors de l'import des transactions`,
      quantite: 0,
      seuilMin: 0,
    }
  })
  return newProduit.id
}

async function migrateTransactions() {
  console.log('🚀 Début de la migration des transactions...')

  const results: any[] = []
  const csvPath = path.join(__dirname, '../data/Logistique_Inventaire_Transaction.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fichier non trouvé: ${csvPath}`)
    return
  }

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

  let imported = 0
  let skipped = 0
  let duplicates = 0

  for (const row of results) {
    try {
      const codePieceRaw = row.Piece?.trim()
      if (!codePieceRaw) {
        skipped++
        continue
      }

      const produitId = await getOrCreateProduit(codePieceRaw)

      const quantite = parseNumber(row.Quantite)

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

      await prisma.mouvementStock.create({ data })
      imported++
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('noTransaction')) {
        duplicates++
      } else {
        console.error(`❌ Erreur pour la transaction:`, row, error)
      }
    }
  }

  console.log(`✅ ${imported} transactions importées`)
  console.log(`⚠️ ${skipped} ignorées (code vide)`)
  console.log(`⚠️ ${duplicates} doublons ignorés (noTransaction en double)`)
}

migrateTransactions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())