import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les configurations
export async function GET() {
  try {
    const configs = await prisma.configuration.findMany();
    
    // Convertir en objet clé-valeur
    const configMap = Object.fromEntries(configs.map(c => [c.cle, c.valeur]));
    
    // Construire l'objet de retour avec la structure attendue par le front
    return NextResponse.json({
      coutHeureInstallation: parseFloat(configMap.coutHeureInstallation || "160"),
      facteurTempsInstallation: parseFloat(configMap.facteurTempsInstallation || "0.7"),
      facteursPiedsLineaires: {
        barrotin: parseFloat(configMap.facteur_barrotin || "1.25"),
        verre: parseFloat(configMap.facteur_verre || "1"),
        mur: parseFloat(configMap.facteur_mur || "4"),
        mainDouble: parseFloat(configMap.facteur_mainDouble || "2.25"),
        gardexVision: parseFloat(configMap.facteur_gardexVision || "1"),
        gardexUrbaine: parseFloat(configMap.facteur_gardexUrbaine || "2"),
        gardexOptimum: parseFloat(configMap.facteur_gardexOptimum || "0.75"),
      },
    });
  } catch (error) {
    console.error("Erreur GET configurations:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

// POST - Mettre à jour plusieurs configurations
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Préparer les opérations d'upsert pour chaque clé
    const operations = [];
    
    // Traiter les valeurs simples
    if (body.coutHeureInstallation !== undefined) {
      operations.push(
        prisma.configuration.upsert({
          where: { cle: "coutHeureInstallation" },
          update: { valeur: String(body.coutHeureInstallation) },
          create: { cle: "coutHeureInstallation", valeur: String(body.coutHeureInstallation) },
        })
      );
    }
    
    if (body.facteurTempsInstallation !== undefined) {
      operations.push(
        prisma.configuration.upsert({
          where: { cle: "facteurTempsInstallation" },
          update: { valeur: String(body.facteurTempsInstallation) },
          create: { cle: "facteurTempsInstallation", valeur: String(body.facteurTempsInstallation) },
        })
      );
    }
    
    // Traiter les facteurs de pieds linéaires
    if (body.facteursPiedsLineaires) {
      const f = body.facteursPiedsLineaires;
      if (f.barrotin !== undefined) {
        operations.push(
          prisma.configuration.upsert({
            where: { cle: "facteur_barrotin" },
            update: { valeur: String(f.barrotin) },
            create: { cle: "facteur_barrotin", valeur: String(f.barrotin) },
          })
        );
      }
      if (f.verre !== undefined) {
        operations.push(
          prisma.configuration.upsert({
            where: { cle: "facteur_verre" },
            update: { valeur: String(f.verre) },
            create: { cle: "facteur_verre", valeur: String(f.verre) },
          })
        );
      }
      if (f.mur !== undefined) {
        operations.push(
          prisma.configuration.upsert({
            where: { cle: "facteur_mur" },
            update: { valeur: String(f.mur) },
            create: { cle: "facteur_mur", valeur: String(f.mur) },
          })
        );
      }
      if (f.mainDouble !== undefined) {
        operations.push(
          prisma.configuration.upsert({
            where: { cle: "facteur_mainDouble" },
            update: { valeur: String(f.mainDouble) },
            create: { cle: "facteur_mainDouble", valeur: String(f.mainDouble) },
          })
        );
      }
      if (f.gardexVision !== undefined) {
        operations.push(
          prisma.configuration.upsert({
            where: { cle: "facteur_gardexVision" },
            update: { valeur: String(f.gardexVision) },
            create: { cle: "facteur_gardexVision", valeur: String(f.gardexVision) },
          })
        );
      }
      if (f.gardexUrbaine !== undefined) {
        operations.push(
          prisma.configuration.upsert({
            where: { cle: "facteur_gardexUrbaine" },
            update: { valeur: String(f.gardexUrbaine) },
            create: { cle: "facteur_gardexUrbaine", valeur: String(f.gardexUrbaine) },
          })
        );
      }
      if (f.gardexOptimum !== undefined) {
        operations.push(
          prisma.configuration.upsert({
            where: { cle: "facteur_gardexOptimum" },
            update: { valeur: String(f.gardexOptimum) },
            create: { cle: "facteur_gardexOptimum", valeur: String(f.gardexOptimum) },
          })
        );
      }
    }
    
    // Exécuter toutes les opérations en transaction
    await prisma.$transaction(operations);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST configuration:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}