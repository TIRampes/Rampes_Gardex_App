import { NextResponse,NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste tous les représentants actifs
export async function GET(request: NextRequest) {
  try {
    const representants = await prisma.representant.findMany({
      where: { actif: true },
      orderBy: { nom: "asc" },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
      },
    });

    return NextResponse.json(representants);
  } catch (error) {
    console.error("Erreur GET représentants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des représentants" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau représentant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { nom, email, telephone } = body;

    if (!nom?.trim()) {
      return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
    }

    const representant = await prisma.representant.create({
      data: {
        nom: nom.trim(),
        email: email?.trim() || null,
        telephone: telephone?.trim() || null,
      },
    });

    return NextResponse.json(representant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST représentant:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}