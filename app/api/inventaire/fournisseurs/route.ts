import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get("recherche") ?? "";
    const actif = searchParams.get("actif");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limite = parseInt(searchParams.get("limite") ?? "50");

    const where: Record<string, unknown> = {};
    if (actif !== null && actif !== "") where.actif = actif === "true";
    if (recherche) {
      where.OR = [
        { nom: { contains: recherche } },
        { contact: { contains: recherche } },
        { email: { contains: recherche } },
        { telephone: { contains: recherche } },
      ];
    }

    const [fournisseurs, total] = await Promise.all([
      prisma.fournisseur.findMany({
        where,
        include: { _count: { select: { produitsPrincipaux: true, produits: true, achats: true } } },
        orderBy: [{ nom: "asc" }],
        skip: (page - 1) * limite,
        take: limite,
      }),
      prisma.fournisseur.count({ where }),
    ]);

    return NextResponse.json({
      data: fournisseurs.map((f) => ({ ...f, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() })),
      pagination: { page, limite, total, totalPages: Math.ceil(total / limite) },
    });
  } catch (error) {
    console.error("[API/inventaire/fournisseurs GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nom) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });

    const fournisseur = await prisma.fournisseur.create({
      data: {
        nom: body.nom,
        contact: body.contact || null,
        telephone: body.telephone || null,
        email: body.email || null,
        adresse: body.adresse || null,
        notes: body.notes || null,
        actif: body.actif ?? true,
      },
      include: { _count: { select: { produitsPrincipaux: true, produits: true, achats: true } } },
    });

    return NextResponse.json({ data: { ...fournisseur, createdAt: fournisseur.createdAt.toISOString(), updatedAt: fournisseur.updatedAt.toISOString() } }, { status: 201 });
  } catch (error) {
    console.error("[API/inventaire/fournisseurs POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}