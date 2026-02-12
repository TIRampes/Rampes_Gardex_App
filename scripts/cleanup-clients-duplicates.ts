import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupClientDuplicates() {
  console.log(' Nettoyage des doublons clients...')
  
  // 1. Trouver tous les clients groupés par nom
  const allClients = await prisma.client.findMany({
    orderBy: { createdAt: 'asc' }
  })
  
  const groupedByName: Record<string, typeof allClients> = {}
  
  for (const client of allClients) {
    if (!groupedByName[client.nom]) {
      groupedByName[client.nom] = []
    }
    groupedByName[client.nom].push(client)
  }
  
  let deletedCount = 0
  let keptCount = 0
  
  //  Pour chaque nom avec plusieurs clients
  for (const [nom, clients] of Object.entries(groupedByName)) {
    if (clients.length > 1) {
      console.log(`\n ${nom} (${clients.length} doublons)`)
      
      // Garder le premier (le plus ancien), supprimer les autres
      const [premier, ...doublons] = clients
      
      for (const doublon of doublons) {
        await prisma.client.delete({
          where: { id: doublon.id }
        })
        deletedCount++
        console.log(` Supprimé: ${doublon.id} (${doublon.telephone})`)
      }
      keptCount++
    }
  }
  
  console.log('\n RÉSULTAT:')
  console.log(`${keptCount} clients conservés`)
  console.log(` ${deletedCount} doublons supprimés`)
}

cleanupClientDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())