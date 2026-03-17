import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { fileURLToPath } from 'url'

// Fix __dirname en ES Module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Répertoire racine du projet
const rootDir = path.resolve(__dirname, '..')
// Dossier contenant les CSV
const dataDir = path.join(rootDir, 'data')

const prisma = new PrismaClient()

// Parse CSV avec BOM + quotes relax
async function parseCSV(filePath: string) {
  return new Promise<any[]>((resolve, reject) => {
    const rows: any[] = []

    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,                 // ✅ Fix BOM UTF8
          relax_quotes: true,        // ✅ Fix quotes Excel
          relax_column_count: true   // ✅ Fix colonnes irrégulières
        })
      )
      .on('data', (r) => rows.push(r))
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

// Nettoyage simple
function clean(v: any) {
  if (typeof v === 'string') return v.replace(/^"|"$/g, '').trim()
  return v
}

// Convertit date JJ/MM/AAAA en Date
function safeDate(d: string) {
  if (!d) return null

  const parts = d.split('/')
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  }

  return new Date(d)
}

// Import équipes
async function importEquipes() {
  console.log('IMPORT EQUIPES')

  const fileName = 'Logistique_Equipe.csv' // adapte selon ton fichier
  const file = path.join(dataDir, fileName)

  if (!fs.existsSync(file)) {
    throw new Error(`Fichier introuvable : ${file}`)
  }

  const rows = await parseCSV(file)

  for (const r of rows) {
    const nom = clean(r.NomEquipe)
    if (!nom) continue

    const responsable = clean(r.Responsable)
    const heures = parseInt(clean(r.NbHeureTravailParJour)) || 8

    await prisma.equipe.upsert({
      where: { nom },
      update: { responsable, nbHeuresJour: heures },
      create: {
        nom,
        responsable,
        nbHeuresJour: heures,
        couleur: 'bg-blue-500',
        actif: true
      }
    })

    console.log('OK equipe', nom)
  }
}

// Import heures semaine
async function importHeures() {
  console.log('IMPORT HEURES')

  const fileName = 'Logistique_Equipe_Heure_Semaine.csv'
  const file = path.join(dataDir, fileName)

  if (!fs.existsSync(file)) {
    throw new Error(`Fichier introuvable : ${file}`)
  }

  const rows = await parseCSV(file)

  for (const r of rows) {
    const nom = clean(r.Equipe)
    if (!nom) continue

    let equipe = await prisma.equipe.findUnique({ where: { nom } })
    if (!equipe) {
      equipe = await prisma.equipe.create({
        data: {
          nom,
          responsable: nom,
          nbHeuresJour: 8,
          couleur: 'bg-blue-500',
          actif: true
        }
      })
    }

    await prisma.equipeHeureSemaine.create({
      data: {
        equipeId: equipe.id,
        semaineDu: safeDate(r.Semaine),
        semaineFin: safeDate(r.Semaine_fin),
        jours: parseInt(r.Jours) || 5,
        heures: parseInt(r.Heures) || 40
      }
    })

    console.log('OK heures', nom)
  }
}

// Script principal
async function main() {
  await prisma.$transaction(async () => {
    await importEquipes()
    await importHeures()
  })
}

// Lancement
main()
  .then(() => console.log('IMPORT TERMINE'))
  .catch(e => console.error('ERREUR :', e.message || e))
  .finally(() => prisma.$disconnect())