import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

// recréer __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Type CSV générique
type CSVRow = Record<string, string>

// Lire un CSV avec BOM et guillemets gérés
function readCSV(file: string): CSVRow[] {
  const content = fs.readFileSync(file, 'utf8')
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ',',
    relax_column_count: true,
    bom: true,        // ignore BOM UTF-8
    quote: '"'        // gérer correctement les guillemets
  }) as CSVRow[]
}

// sécuriser une date
function parseDate(value?: string) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

async function main() {
  console.log("Seed non-conformités...")

  // Fichiers CSV dans le dossier data
  const base = path.join(__dirname, '../data')

  // ==========================
  // DEPARTEMENTS
  // ==========================
  const departements = readCSV(path.join(base, "Logistique_Departement_NC.csv"))
  await prisma.departementNC.createMany({
    data: departements.map(d => ({ nom: d.Title?.trim() })),
    skipDuplicates: true
  })
  const dbDepartements = await prisma.departementNC.findMany()
  const departementMap = new Map(dbDepartements.map(d => [d.nom, d.id]))
  console.log("Departements:", dbDepartements.length)

  // ==========================
  // RESPONSABLES
  // ==========================
  const responsables = readCSV(path.join(base, "Logistique_Responsable_NC.csv"))
  await prisma.responsableNC.createMany({
    data: responsables.map(r => ({
      nom: r.Nom?.trim(),
      email: r.Email_Responsable?.trim() || null
    })),
    skipDuplicates: true
  })
  const dbResponsables = await prisma.responsableNC.findMany()
  const responsableMap = new Map(dbResponsables.map(r => [r.nom, r.id]))
  console.log("Responsables:", dbResponsables.length)

  // ==========================
  // TYPES NC
  // ==========================
  const types = readCSV(path.join(base, "Logistique_Type_NC.csv"))
  const typesData = types
    .map(t => {
      const deptId = departementMap.get(t.Departement)
      if (!deptId) return null
      return { nom: t.TypeNC?.trim(), departementId: deptId }
    })
    .filter(Boolean)
  await prisma.typeNC.createMany({ data: typesData as any, skipDuplicates: true })
  const dbTypes = await prisma.typeNC.findMany({ include: { departement: true } })
  const typeMap = new Map(dbTypes.map(t => [`${t.departement.nom}|${t.nom}`, t.id]))
  console.log("Types:", dbTypes.length)

  // ==========================
  // NON CONFORMITES
  // ==========================
  const ncRecords = readCSV(path.join(base, "Logistique_Non_Conformite.csv"))
  const ncData = ncRecords.map(nc => {
    const deptId = departementMap.get(nc.Departement)
    const typeId = typeMap.get(`${nc.Departement}|${nc["Non-Conformite"]}`)
    const respId = responsableMap.get(nc.Responsable)

    return {
      noProjet: nc.NoProjet || null,
      description: nc.Description || "",
      dateDetection: parseDate(nc.DateNonConformite) || new Date(),
      departementId: deptId || null,
      typeId: typeId || null,
      responsableId: respId || null,
      envoiMail: nc.EnvoiMail === "Oui",
      mesureCorrective: nc.AjoutMesureCorrective === "Oui" ? "Oui" : null,
      correction: nc.Correction || null,
      dateCorrection: parseDate(nc.DateCorrection),
      confirmation: nc.Confirmation === "Oui",
      departementTexte: nc.Departement || null,
      responsableTexte: nc.Responsable || null
    }
  })
  await prisma.nonConformite.createMany({ data: ncData })
  console.log("Non conformités:", ncData.length)

  console.log("Seed terminé ✅")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())