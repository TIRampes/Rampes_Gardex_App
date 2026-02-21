import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les configurations
export async function GET() {
  try {
    const configs = await prisma.configuration.findMany();
    
    // Convertir en objet clé-valeur
    const configMap = Object.fromEntries(configs.map(c => [c.cle, c.valeur]));
    
    // Valeurs par défaut
    return NextResponse.json({
      coutHeureInstallation: parseFloat(configMap.coutHeureInstallation || "160"),
      facteurTempsInstallation: parseFloat(configMap.facteurTempsInstallation || "0.7"),
      ...configMap
    });
  } catch (error) {
    console.error("Erreur GET configurations:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

// POST - Mettre à jour une configuration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cle, valeur } = body;

    if (!cle) {
      return NextResponse.json({ error: "La clé est obligatoire" }, { status: 400 });
    }

    const config = await prisma.configuration.upsert({
      where: { cle },
      update: { valeur },
      create: { cle, valeur },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erreur POST configuration:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}