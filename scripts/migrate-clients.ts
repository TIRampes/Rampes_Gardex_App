import { PrismaClient, TypeClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

const mapTypeClient = (type: string): TypeClient => {
  const mapping: Record<string, TypeClient> = {
    'Entrepreneur': TypeClient.ENTREPRENEUR,
    'Résidentiel': TypeClient.RESIDENTIEL,
    'Distributeur': TypeClient.DISTRIBUTEUR,
    'Ambassadeur': TypeClient.AMBASSADEUR
  }
  return mapping[type] || TypeClient.ENTREPRENEUR
}

const mapBoolean = (value: string): boolean => {
  if (!value) return false
  return value.toLowerCase() === 'vrai' || value === 'True' || value === 'true'
}

async function migrateClients() {
  console.log('🚀 Début de la migration des clients...')
  
  const results: any[] = []
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let updatedCount = 0
  let createdCount = 0

  const csvPath = path.join(__dirname, '../data/Logistique_Clients.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error(` Fichier non trouvé: ${csvPath}`)
    return
  }

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv({
        mapHeaders: ({ header, index }) => {
          // Nettoie les headers des guillemets et espaces
          return header.replace(/^"|"$/g, '').trim()
        }
      }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(` ${results.length} clients trouvés dans le CSV`)

  // 🔍 DEBUG: Afficher la première ligne
  if (results.length > 0) {
    console.log('\n🔍 APERÇU PREMIÈRE LIGNE:')
    console.log('Clés:', Object.keys(results[0]))
    console.log('Valeurs:', Object.values(results[0]))
    console.log('Ligne complète:', results[0])
  }

  for (const [index, row] of results.entries()) {
    try {
      //   Prendre la PREMIÈRE valeur non-vide de la ligne
      const values = Object.values(row) as string[]
      const nom = values.find(v => v && typeof v === 'string' && v.trim() !== '') || ''
      
      if (!nom || nom.trim() === '') {
        skippedCount++
        continue
      }

      const nomTrim = nom.trim()
      
      // Afficher progression
      if (index % 100 === 0) {
        console.log(` Traitement ligne ${index + 1}: "${nomTrim.substring(0, 30)}..."`)
      }

      const emails = []
      if (row.Email?.trim()) emails.push(row.Email.trim())
      if (row.Email2?.trim()) emails.push(row.Email2.trim())
      if (row.Email3?.trim()) emails.push(row.Email3.trim())

      const telephone = row.Telephone ? row.Telephone.replace(/\s/g, '') : ''
      const cellulaire = row.Cellulaire ? row.Cellulaire.replace(/\s/g, '') : null
      const fax = row.Fax ? row.Fax.replace(/\s/g, '') : null
      const pays = row.Pays || 'Canada'

      // RECHERCHER LE CLIENT EXISTANT
      let existingClient = null
      
      if (emails.length > 0) {
        existingClient = await prisma.client.findFirst({
          where: {
            emails: {
              array_contains: emails[0]
            }
          }
        })
      }

      if (!existingClient && telephone) {
        existingClient = await prisma.client.findFirst({
          where: {
            nom: nomTrim,
            telephone: telephone
          }
        })
      }

      if (!existingClient) {
        existingClient = await prisma.client.findFirst({
          where: {
            nom: nomTrim
          }
        })
      }

      const clientData = {
        nom: nomTrim,
        type: mapTypeClient(row['Type client']), 
        adresse: row.Adresse?.trim() || 'Adresse non spécifiée',
        ville: row.Ville?.trim() || null,
        codePostal: row.CodePostal?.trim() || null,
        province: row.Province?.trim() || null,
        telephone: telephone || 'Non spécifié',
        cellulaire: cellulaire,
        fax: fax,
        personne_Contact: row.Contact?.trim() || 'Non spécifié',
        emails: emails,
        communicationTexto: mapBoolean(row.Communication_Texto),
        communicationCourriel: mapBoolean(row.Communication_Email),
        communicationTelephone: mapBoolean(row.Communication_Telephone),
        pays: pays,
        commentaires: row.Commentaires?.trim() || null,
        actif: true,
      }

      if (existingClient) {
        await prisma.client.update({
          where: { id: existingClient.id },
          data: clientData
        })
        updatedCount++
      } else {
        await prisma.client.create({
          data: clientData
        })
        createdCount++
        console.log(` NOUVEAU client créé: ${nomTrim}`)
      }

      successCount++

    } catch (error: any) {
      errorCount++
      console.error(`❌ [${index + 1}] Erreur:`, error.message)
    }
  }

  console.log('\n📊 RÉSUMÉ DE LA MIGRATION:')
  console.log(`✅ Nouveaux clients créés: ${createdCount}`)
  console.log(`🔄 Clients existants mis à jour: ${updatedCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`⏭️  Ignorés (sans nom): ${skippedCount}`)
  console.log(`📋 Total lignes CSV: ${results.length}`)
}

migrateClients()
  .catch(console.error)
  .finally(() => prisma.$disconnect())