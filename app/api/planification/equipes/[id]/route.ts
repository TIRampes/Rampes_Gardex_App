import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Correction du type pour Next.js 15/16 : params est une Promise
type RouteParams = { 
  params: Promise<{ id: string }> 
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // On doit obligatoirement await les params
    const { id } = await params; 
    
    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    
    if (body.nom !== undefined) updateData.nom = body.nom;
    if (body.responsable !== undefined) updateData.responsable = body.responsable || null;
    if (body.nbHeuresJour !== undefined) updateData.nbHeuresJour = body.nbHeuresJour;
    if (body.couleur !== undefined) updateData.couleur = body.couleur;

    const equipe = await prisma.equipe.update({ 
      where: { id }, 
      data: updateData 
    });
    
    return NextResponse.json(equipe);
  } catch (error) {
    console.error('PUT equipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // On doit obligatoirement await les params
    const { id } = await params;

    const existing = await prisma.equipe.findUnique({
      where: { id },
      include: { 
        _count: { 
          select: { planifications: true, interventions: true } 
        } 
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Non trouvée' }, { status: 404 });
    }

    // Si l'équipe a des relations, on la désactive au lieu de la supprimer
    if (existing._count.planifications > 0 || existing._count.interventions > 0) {
      await prisma.equipe.update({ 
        where: { id }, 
        data: { actif: false } 
      });
      return NextResponse.json({ message: 'Désactivée (contient des données liées)' });
    }

    await prisma.equipe.delete({ where: { id } });
    return NextResponse.json({ message: 'Supprimée avec succès' });
  } catch (error) {
    console.error('DELETE equipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}