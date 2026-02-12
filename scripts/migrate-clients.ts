import { PrismaClient, TypeClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

// Permet de mapper les types de clients du CSV vers les valeurs de l'enum TypeClient
const mapTypeClient = (type: string): TypeClient => {
  const mapping: Record<string, TypeClient> = {
    'Entrepreneur': TypeClient.ENTREPRENEUR,
    'Résidentiel': TypeClient.RESIDENTIEL,
    'Distributeur': TypeClient.DISTRIBUTEUR,
    'Ambassadeur': TypeClient.AMBASSADEUR
  }
  return mapping[type] || TypeClient.ENTREPRENEUR
}

// Mapping des booléens CSV vers boolean
const mapBoolean = (value: string): boolean => {
  if (!value) return false
  return value.toLowerCase() === 'vrai' || value === 'True' || value === 'true'
}

async function migrateClients() {
  console.log(' Début de la migration des clients...')
  
  const results: any[] = []
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  const csvPath = path.join(__dirname, '../data/Logistique_Clients.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error(`Fichier non trouvé: ${csvPath}`)
    console.log(' Assurez-vous que le fichier CSV est dans le dossier "data" à la racine')
    return
  }

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(` ${results.length} clients trouvés dans le CSV`)

  for (const [index, row] of results.entries()) {
    try {
      if (!row.Titre || row.Titre.trim() === '') {
        skippedCount++
        continue
      }

      const emails = []
      if (row.Email && row.Email.trim() !== '') emails.push(row.Email.trim())
      if (row.Email2 && row.Email2.trim() !== '') emails.push(row.Email2.trim())
      if (row.Email3 && row.Email3.trim() !== '') emails.push(row.Email3.trim())

      const telephone = row.Telephone ? row.Telephone.replace(/\s/g, '') : ''
      const cellulaire = row.Cellulaire ? row.Cellulaire.replace(/\s/g, '') : null
      const fax = row.Fax ? row.Fax.replace(/\s/g, '') : null
      const pays = row.Pays || 'Canada'

      // Vérifier si le client existe déjà
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
            nom: row.Titre.trim(),
            telephone: telephone
          }
        })
      }

      // Utilisation de TypeClient.XXX au lieu de strings
      const clientData = {
        nom: row.Titre?.trim() || '',
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
        console.log(` [${index + 1}/${results.length}] Client mis à jour: ${row.Titre}`)
      } else {
        await prisma.client.create({
          data: clientData
        })
        console.log(` [${index + 1}/${results.length}] Client créé: ${row.Titre}`)
      }

      successCount++

    } catch (error: any) {
      errorCount++
      console.error(` [${index + 1}] Erreur pour ${row.Titre}:`, error.message)
    }
  }

  console.log('\n RÉSUMÉ DE LA MIGRATION:')
  console.log(` Succès: ${successCount}`)
  console.log(` Erreurs: ${errorCount}`)
  console.log(` Ignorés: ${skippedCount}`)
  console.log(` Total: ${results.length}`)
}

migrateClients()
  .catch((e) => {
    console.error(' Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })