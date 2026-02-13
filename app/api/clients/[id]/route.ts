import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TypeClient } from "@prisma/client";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { commandes: true } }, commandes: { take: 10, orderBy: { createdAt: "desc" }, select: { id: true, numero: true, statut: true, dateEntree: true } } },
    });
    if (!client) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    return NextResponse.json(client);
  } catch (error) {
    console.error("Erreur GET client:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

    const client = await prisma.client.update({
      where: { id },
      data: {
        nom: body.nom?.trim(), type: body.type as TypeClient, adresse: body.adresse?.trim(),
        ville: body.ville?.trim() || null, province: body.province?.trim() || null,
        codePostal: body.codePostal?.trim() || null, pays: body.pays?.trim() || null,
        telephone: body.telephone?.trim(), cellulaire: body.cellulaire?.trim() || null,
        fax: body.fax?.trim() || null, personne_Contact: body.personne_Contact?.trim(),
        emails: Array.isArray(body.emails) ? body.emails.filter((e: string) => e?.trim()) : [],
        communicationTexto: Boolean(body.communicationTexto),
        communicationCourriel: body.communicationCourriel !== false,
        communicationTelephone: Boolean(body.communicationTelephone),
        commentaires: body.commentaires?.trim() || null,
      },
      include: { _count: { select: { commandes: true } } },
    });
    return NextResponse.json(client);
  } catch (error) {
    console.error("Erreur PUT client:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    await prisma.client.update({ where: { id }, data: { actif: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE client:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}