import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const f = await prisma.fournisseur.findUnique({ where: { id: params.id }, include: { _count: { select: { produitsPrincipaux: true, produits: true, achats: true } } } });
    if (!f) return NextResponse.json({ error: "Fournisseur non trouvé" }, { status: 404 });
    return NextResponse.json({ data: { ...f, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() } });
  } catch (error) {
    console.error("[API/fournisseurs/[id] GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const existing = await prisma.fournisseur.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Fournisseur non trouvé" }, { status: 404 });

    const f = await prisma.fournisseur.update({
      where: { id: params.id },
      data: {
        ...(body.nom !== undefined && { nom: body.nom }),
        ...(body.contact !== undefined && { contact: body.contact || null }),
        ...(body.telephone !== undefined && { telephone: body.telephone || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.adresse !== undefined && { adresse: body.adresse || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.actif !== undefined && { actif: body.actif }),
      },
      include: { _count: { select: { produitsPrincipaux: true, produits: true, achats: true } } },
    });

    return NextResponse.json({ data: { ...f, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString() } });
  } catch (error) {
    console.error("[API/fournisseurs/[id] PUT]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.fournisseur.findUnique({ where: { id: params.id }, include: { produitsPrincipaux: { take: 1 }, achats: { take: 1 } } });
    if (!existing) return NextResponse.json({ error: "Fournisseur non trouvé" }, { status: 404 });
    if (existing.produitsPrincipaux.length > 0 || existing.achats.length > 0) {
      await prisma.fournisseur.update({ where: { id: params.id }, data: { actif: false } });
      return NextResponse.json({ data: { id: params.id, action: "desactive" } });
    }
    await prisma.fournisseur.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id, action: "supprime" } });
  } catch (error) {
    console.error("[API/fournisseurs/[id] DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}