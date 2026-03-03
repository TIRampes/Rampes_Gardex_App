import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.categoriePiece.findMany({
      include: { _count: { select: { produits: true } } },
      orderBy: [{ nom: "asc" }],
    });
    return NextResponse.json({
      data: categories.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() })),
    });
  } catch (error) {
    console.error("[API/inventaire/categories GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nom) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });

    const existing = await prisma.categoriePiece.findUnique({ where: { nom: body.nom } });
    if (existing) return NextResponse.json({ error: "Cette catégorie existe déjà" }, { status: 409 });

    const categorie = await prisma.categoriePiece.create({
      data: { nom: body.nom },
      include: { _count: { select: { produits: true } } },
    });

    return NextResponse.json({ data: { ...categorie, createdAt: categorie.createdAt.toISOString(), updatedAt: categorie.updatedAt.toISOString() } }, { status: 201 });
  } catch (error) {
    console.error("[API/inventaire/categories POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}