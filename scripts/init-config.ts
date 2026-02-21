// scripts/init-config.ts
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Initialisation des configurations...");

  const configs = [
    {
      cle: "coutHeureInstallation",
      valeur: "160",
      description: "Coût à l'heure d'une installation (en $)",
    },
    {
      cle: "facteurTempsInstallation",
      valeur: "0.7",
      description: "Facteur de correction pour le temps d'installation",
    },
  ];

  for (const config of configs) {
    await prisma.configuration.upsert({
      where: { cle: config.cle },
      update: { valeur: config.valeur, description: config.description },
      create: config,
    });
    console.log(`✓ ${config.cle} = ${config.valeur}`);
  }

  console.log("Initialisation terminée !");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());