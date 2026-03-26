import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id },
      select: { formulaireData: true, formulaireMime: true, formulaireNom: true },
    });

    if (!fournisseur || !fournisseur.formulaireData) {
      return NextResponse.json({ error: 'Formulaire non trouvé' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', fournisseur.formulaireMime || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fournisseur.formulaireNom || 'formulaire')}"`);

    return new NextResponse(fournisseur.formulaireData, { headers });
  } catch (error) {
    console.error('GET /api/inventaire/fournisseurs/[id]/formulaire erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}