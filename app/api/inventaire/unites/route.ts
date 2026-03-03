import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const unites = await prisma.unite.findMany({
      include: { _count: { select: { produits: true } } },
      orderBy: [{ unite: "asc" }],
    });
    return NextResponse.json({
      data: unites.map((u) => ({ ...u, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
    });
  } catch (error) {
    console.error("[API/inventaire/unites GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.unite) return NextResponse.json({ error: "Le nom d'unité est requis" }, { status: 400 });

    const existing = await prisma.unite.findUnique({ where: { unite: body.unite } });
    if (existing) return NextResponse.json({ error: "Cette unité existe déjà" }, { status: 409 });

    const unite = await prisma.unite.create({
      data: { unite: body.unite, qtePar: body.qtePar ?? 1, description: body.description || null },
      include: { _count: { select: { produits: true } } },
    });

    return NextResponse.json({ data: { ...unite, createdAt: unite.createdAt.toISOString(), updatedAt: unite.updatedAt.toISOString() } }, { status: 201 });
  } catch (error) {
    console.error("[API/inventaire/unites POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}