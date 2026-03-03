import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseNumber(str: string | undefined): number {
  if (!str) return 0
  return parseInt(str.replace(/,/g, '')) || 0
}

function parseBoolean(str: string | undefined): boolean {
  if (!str) return false
  const val = str.toLowerCase().trim()
  return val === 'true' || val === 'vrai' || val === '1'
}

async function migratePieces() {
  console.log('🚀 Début de la migration des pièces...')

  const results: any[] = []
  const csvPath = path.join(__dirname, '../data/Logistique_Inventaire_Pieces.csv')

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

  console.log(`📋 ${results.length} pièces trouvées`)

  let created = 0, updated = 0
  for (const row of results) {
    try {
      const code = row.Code_Piece?.trim()
      if (!code) continue

      const categorieNom = row.Categorie_Piece?.trim()
      const categorie = categorieNom
        ? await prisma.categoriePiece.findUnique({ where: { nom: categorieNom } })
        : null

      const uniteNom = row.Unite_Piece?.trim()
      const unite = uniteNom
        ? await prisma.unite.findFirst({ where: { unite: { contains: uniteNom } } })
        : null

      const fournisseurNom = row.Fournisseur_Piece?.trim()
      const fournisseur = fournisseurNom
        ? await prisma.fournisseur.findFirst({ where: { nom: { contains: fournisseurNom } } })
        : null

      const invEmpl1 = parseNumber(row.InventaireEmplacement1)
      const invEmpl2 = parseNumber(row.InventaireEmplacement2)

      const data = {
        code,
        nom: row.Description_Piece?.trim() || code,
        description: row.Description_Piece?.trim(),
        quantite: invEmpl1 + invEmpl2,
        seuilMin: parseNumber(row.PointCommande),
        prixUnitaire: row.Prix_Piece ? parseFloat(row.Prix_Piece.replace(/,/g, '')) : null,
        emplacement: row.Emplacement?.trim() || null,
        couleur: row.Couleur_Piece?.trim() || null,
        achatFait: parseBoolean(row.Achat_fait),
        partiPeinture: parseNumber(row.PartiPeinture),
        piecePeinte: parseBoolean(row.PiecePeinte),
        codePieceNonPeinte: row.Code_Piece_NonPeinte?.trim() || null,
        emplacement2: row.Emplacement2?.trim() || null,
        inventaireEmplacement1: invEmpl1,
        inventaireEmplacement2: invEmpl2,
        dateDerniereTransaction: row.DateDerniereTransaction ? new Date(row.DateDerniereTransaction) : null,
        categoriePieceId: categorie?.id || null,
        uniteId: unite?.id || null,
        fournisseurId: fournisseur?.id || null,
      }

      const existing = await prisma.produit.findUnique({ where: { code } })
      if (existing) {
        await prisma.produit.update({ where: { code }, data })
        updated++
      } else {
        await prisma.produit.create({ data })
        created++
      }
    } catch (error) {
      console.error(`❌ Erreur pour la pièce:`, row, error)
    }
  }

  console.log(`✅ ${created} créées, ${updated} mises à jour.`)
}

migratePieces()
  .catch(console.error)
  .finally(() => prisma.$disconnect())