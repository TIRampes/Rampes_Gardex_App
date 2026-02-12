import { PrismaClient, TypeClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding clients de test...");

  // Client 1 - Entrepreneur
  const client1 = await prisma.client.upsert({
    where: { id: "client-test-1" },
    update: {},
    create: {
      id: "client-test-1",
      nom: "Construction Leblanc",
      type: TypeClient.ENTREPRENEUR,
      adresse: "123 Rue Principale",
      ville: "Montréal",
       pays: "Canada",
      codePostal: "H2X 1Y6",
      telephone: "514-555-0101",
      cellulaire: "514-555-0102",
      personne_Contact: "Jean Leblanc",
      emails: ["jean@leblanc.ca", "info@leblanc.ca"],
      communicationTexto: true,
      communicationCourriel: true,
      communicationTelephone: false,
      commentaires: "Client fidèle depuis 2020. Projets résidentiels.",
    },
  });

  // Client 2 - Résidentiel
  const client2 = await prisma.client.upsert({
    where: { id: "client-test-2" },
    update: {},
    create: {
      id: "client-test-2",
      nom: "Rénovations ABC",
      type: TypeClient.RESIDENTIEL,
      adresse: "456 Boul. St-Laurent",
      ville: "Laval",
      pays: "Canada",
      codePostal: "H7N 3R4",
      telephone: "450-555-0202",
      cellulaire: "450-555-0203",
      fax: "450-555-0204",
      personne_Contact: "Marie Côté",
      emails: ["marie@abc-reno.ca"],
      communicationTexto: false,
      communicationCourriel: true,
      communicationTelephone: true,
      commentaires: "Préfère être contactée par téléphone en matinée.",
    },
  });

  // Client 3 - Distributeur
  const client3 = await prisma.client.upsert({
    where: { id: "client-test-3" },
    update: {},
    create: {
      id: "client-test-3",
      nom: "Gestion Immobilière XYZ",
      type: TypeClient.DISTRIBUTEUR,
      adresse: "789 Ave du Parc",
      ville: "Longueuil",
      pays: "Canada",
      codePostal: "J4K 2M5",
      telephone: "514-555-0303",
      personne_Contact: "Robert Martin",
      emails: ["robert@xyz-immo.ca", "commandes@xyz-immo.ca"],
      communicationTexto: false,
      communicationCourriel: true,
      communicationTelephone: false,
      commentaires: "Gère plusieurs immeubles multi-logements.",
    },
  });

  // Client 4 - Ambassadeur
  const client4 = await prisma.client.upsert({
    where: { id: "client-test-4" },
    update: {},
    create: {
      id: "client-test-4",
      nom: "Pro-Bâtiment Inc.",
      type: TypeClient.AMBASSADEUR,
      adresse: "321 Rue des Érables",
      ville: "Brossard",
      pays: "Canada",
      codePostal: "J4W 1A1",
      telephone: "450-555-0404",
      cellulaire: "450-555-0405",
      personne_Contact: "Sophie Tremblay",
      emails: ["sophie@probatiment.ca"],
      communicationTexto: true,
      communicationCourriel: true,
      communicationTelephone: true,
      commentaires: "Ambassadeur - Recommande régulièrement.",
    },
  });

  // Client 5 - Entrepreneur
  const client5 = await prisma.client.upsert({
    where: { id: "client-test-5" },
    update: {},
    create: {
      id: "client-test-5",
      nom: "Les Entreprises Gagnon",
      type: TypeClient.ENTREPRENEUR,
      adresse: "555 Chemin du Golf",
      ville: "Terrebonne",
      pays: "Canada",
      codePostal: "J6Y 1X8",
      telephone: "450-555-0505",
      personne_Contact: "Pierre Gagnon",
      emails: ["pierre@gagnon-ent.ca"],
      communicationTexto: false,
      communicationCourriel: true,
      communicationTelephone: false,
    },
  });

  console.log("✅ Clients créés:");
  console.log(`   - ${client1.nom} (${client1.type})`);
  console.log(`   - ${client2.nom} (${client2.type})`);
  console.log(`   - ${client3.nom} (${client3.type})`);
  console.log(`   - ${client4.nom} (${client4.type})`);
  console.log(`   - ${client5.nom} (${client5.type})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });