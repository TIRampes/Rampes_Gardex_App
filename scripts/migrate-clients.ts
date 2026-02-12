import { PrismaClient, TypeClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

// Mapping des types de clients du CSV vers l'enum Prisma
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
  console.log('🚀 Début de la migration des clients...')
  
  const results: any[] = []
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  const csvPath = path.join(__dirname, '../data/Logistique_Clients.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error(` Fichier non trouvé: ${csvPath}`)
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

  console.log(`📊 ${results.length} clients trouvés dans le CSV`)

  //  DEBUG: Afficher les 3 premières lignes brutes
  console.log('\n🔍 DEBUG - Aperçu des 3 premières lignes:')
  for (let i = 0; i < 3 && i < results.length; i++) {
    console.log(`\n--- Ligne ${i + 1} ---`)
    console.log('Clés disponibles:', Object.keys(results[i]))
    console.log('Valeur de "Titre":', results[i]["Titre"])
    console.log('Valeur de "titre":', results[i].titre)
    console.log('Valeur de "Title":', results[i].Title)
    console.log('Valeur de "Nom":', results[i].Nom)
    console.log('Valeur de "nom":', results[i].nom)
    console.log('Contenu complet:', JSON.stringify(results[i]).substring(0, 200) + '...')
  }

  for (const [index, row] of results.entries()) {
    try {
      //  ESSAYER TOUTES LES VARIANTES POSSIBLES
      const nom = row["Titre"] || 
                  row.titre || 
                  row.Titre || 
                  row["Title"] || 
                  row.title || 
                  row["Nom"] || 
                  row.nom || 
                  row["NAME"] || 
                  row.name || 
                  Object.values(row)[0] // Première colonne en dernier recours
      
      //  DEBUG: Afficher toutes les 100 lignes
      if (index % 100 === 0) {
        console.log(`🔍 Ligne ${index + 1}: nom = "${nom}"`)
      }
      
      if (!nom || nom.trim() === '') {
        skippedCount++
        continue
      }

      // ✅ Utiliser les crochets pour TOUS les accès
      const emails = []
      if (row["Email"] && row["Email"].trim() !== '') emails.push(row["Email"].trim())
      if (row["Email2"] && row["Email2"].trim() !== '') emails.push(row["Email2"].trim())
      if (row["Email3"] && row["Email3"].trim() !== '') emails.push(row["Email3"].trim())

      const telephone = row["Telephone"] ? row["Telephone"].replace(/\s/g, '') : ''
      const cellulaire = row["Cellulaire"] ? row["Cellulaire"].replace(/\s/g, '') : null
      const fax = row["Fax"] ? row["Fax"].replace(/\s/g, '') : null
      const pays = row["Pays"] || 'Canada'

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
            nom: nom.trim(),
            telephone: telephone
          }
        })
      }

      const clientData = {
        nom: nom.trim(),
        type: mapTypeClient(row["Type client"] || row["Type_client"] || row["Type"]), 
        adresse: row["Adresse"]?.trim() || 'Adresse non spécifiée',
        ville: row["Ville"]?.trim() || null,
        codePostal: row["CodePostal"]?.trim() || row["Code Postal"]?.trim() || null,
        province: row["Province"]?.trim() || null,
        telephone: telephone || 'Non spécifié',
        cellulaire: cellulaire,
        fax: fax,
        personne_Contact: row["Contact"]?.trim() || row["Personne contact"]?.trim() || 'Non spécifié',
        emails: emails,
        communicationTexto: mapBoolean(row["Communication_Texto"] || row["Communication_Text"]),
        communicationCourriel: mapBoolean(row["Communication_Email"] || row["Communication_Courriel"]),
        communicationTelephone: mapBoolean(row["Communication_Telephone"] || row["Communication_Tel"]),
        pays: pays,
        commentaires: row["Commentaires"]?.trim() || null,
        actif: true,
      }

      if (existingClient) {
        await prisma.client.update({
          where: { id: existingClient.id },
          data: clientData
        })
        console.log(`✅ [${index + 1}/${results.length}] Client mis à jour: ${nom}`)
      } else {
        await prisma.client.create({
          data: clientData
        })
        console.log(`✅ [${index + 1}/${results.length}] Client créé: ${nom}`)
      }

      successCount++

    } catch (error: any) {
      errorCount++
      console.error(` [${index + 1}] Erreur pour ${row["Titre"] || row.titre || 'inconnu'}:`, error.message)
    }
  }

  console.log('\n📊 RÉSUMÉ DE LA MIGRATION:')
  console.log(`✅ Succès: ${successCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`⏭️  Ignorés: ${skippedCount}`)
  console.log(`📋 Total: ${results.length}`)
}

migrateClients()
  .catch((e) => {
    console.error(' Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })