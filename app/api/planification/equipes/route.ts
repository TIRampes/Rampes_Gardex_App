import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreerEquipeSchema, UpdateEquipeSchema } from "@/app/api/planification/schema";

// GET /api/planification/equipes
export async function GET() {
  try {
    const equipes = await prisma.equipe.findMany({
      where: { actif: true },
      include: {
        membres: { select: { id: true, nom: true, prenom: true, role: true }, where: { actif: true } },
        planifications: {
          where: { statut: { in: ["PLANIFIEE", "CONFIRMEE", "EN_COURS"] } },
          select: { id: true, datePlanifiee: true, commande: { select: { tempsEstimeInstallation: true } } },
        },
      },
      orderBy: { nom: "asc" },
    });

    const data = equipes.map((eq) => ({
      id: eq.id,
      nom: eq.nom,
      couleur: eq.couleur,
      actif: eq.actif,
      membres: eq.membres.map((m) => ({
        id: m.id,
        nom: m.nom,
        prenom: m.prenom,
        role: m.role,
      })),
      nbInstallations: eq.planifications.length,
      heuresPlanifiees: eq.planifications.reduce(
        (acc, p) => acc + (p.commande?.tempsEstimeInstallation ?? 0), 0
      ),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[API/equipes GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/planification/equipes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreerEquipeSchema.parse(body);

    const equipe = await prisma.equipe.create({
      data: {
        nom: data.nom,
        couleur: data.couleur,
        ...(data.membreIds?.length
          ? { membres: { connect: data.membreIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { membres: { select: { id: true, nom: true, prenom: true, role: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: equipe.id,
        nom: equipe.nom,
        couleur: equipe.couleur,
        actif: equipe.actif,
        membres: equipe.membres,
        nbInstallations: 0,
        heuresPlanifiees: 0,
      },
    });
  } catch (error) {
    console.error("[API/equipes POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/planification/equipes
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = UpdateEquipeSchema.parse(body);
    const { equipeId, membreIds, ...fields } = data;

    await prisma.equipe.update({
      where: { id: equipeId },
      data: {
        ...fields,
        ...(membreIds ? { membres: { set: membreIds.map((id) => ({ id })) } } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/equipes PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/planification/equipes?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    await prisma.equipe.update({ where: { id }, data: { actif: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/equipes DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}