import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateAchatsCommandeSchema } from '@/app/api/achats/schema';

type RouteParams = { params: Promise<{ id: string }> };

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string') { const d = new Date(val); return isNaN(d.getTime()) ? null : d; }
  return null;
}

// PUT /api/achats/commandes/[id] — met à jour les champs achats inline sur la commande
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = UpdateAchatsCommandeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.commande.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });

    const data = parsed.data;

    // Construire le data Prisma — seulement les champs fournis
    const updateData: Record<string, unknown> = {};

    // Fibre
    if (data.achatFibre !== undefined) updateData.achatFibre = data.achatFibre || null;
    if (data.dateEnvoieFibre !== undefined) updateData.dateEnvoieFibre = toDate(data.dateEnvoieFibre);
    if (data.dateReceptionFibre !== undefined) updateData.dateReceptionFibre = toDate(data.dateReceptionFibre);
    if (data.quantiteNonRecueFibre !== undefined) updateData.quantiteNonRecueFibre = data.quantiteNonRecueFibre ?? null;

    // Limons
    if (data.achatLimons !== undefined) updateData.achatLimons = data.achatLimons || null;
    if (data.dateEnvoieLimons !== undefined) updateData.dateEnvoieLimons = toDate(data.dateEnvoieLimons);
    if (data.dateReceptionLimons !== undefined) updateData.dateReceptionLimons = toDate(data.dateReceptionLimons);
    if (data.quantiteNonRecueLimons !== undefined) updateData.quantiteNonRecueLimons = data.quantiteNonRecueLimons ?? null;

    // Verres
    if (data.achatVerres !== undefined) updateData.achatVerres = data.achatVerres || null;
    if (data.dateEnvoieVerres !== undefined) updateData.dateEnvoieVerres = toDate(data.dateEnvoieVerres);
    if (data.dateReceptionVerre !== undefined) updateData.dateReceptionVerre = toDate(data.dateReceptionVerre);
    if (data.quantiteNonRecueVerres !== undefined) updateData.quantiteNonRecueVerres = data.quantiteNonRecueVerres ?? null;

    // Colonnes
    if (data.achatColonnes !== undefined) updateData.achatColonnes = data.achatColonnes || null;
    if (data.dateEnvoieColonnes !== undefined) updateData.dateEnvoieColonnes = toDate(data.dateEnvoieColonnes);
    if (data.dateReceptionColonnes !== undefined) updateData.dateReceptionColonnes = toDate(data.dateReceptionColonnes);
    if (data.quantiteNonRecueColonnes !== undefined) updateData.quantiteNonRecueColonnes = data.quantiteNonRecueColonnes ?? null;

    // Peinture
    if (data.achatPeinture !== undefined) updateData.achatPeinture = data.achatPeinture || null;
    if (data.dateEnvoiePeinture !== undefined) updateData.dateEnvoiePeinture = toDate(data.dateEnvoiePeinture);
    if (data.dateReceptionPeinture !== undefined) updateData.dateReceptionPeinture = toDate(data.dateReceptionPeinture);
    if (data.quantiteNonRecuePeinture !== undefined) updateData.quantiteNonRecuePeinture = data.quantiteNonRecuePeinture ?? null;

    // Attaches
    if (data.achatAttaches !== undefined) updateData.achatAttaches = data.achatAttaches || null;
    if (data.dateEnvoieAttaches !== undefined) updateData.dateEnvoieAttaches = toDate(data.dateEnvoieAttaches);
    if (data.dateReceptionAttaches !== undefined) updateData.dateReceptionAttaches = toDate(data.dateReceptionAttaches);
    if (data.quantiteNonRecueAttaches !== undefined) updateData.quantiteNonRecueAttaches = data.quantiteNonRecueAttaches ?? null;

    // Plancher Aluminium
    if (data.achatPlancherAluminium !== undefined) updateData.achatPlancherAluminium = data.achatPlancherAluminium || null;
    if (data.dateEnvoiePlancherAluminium !== undefined) updateData.dateEnvoiePlancherAluminium = toDate(data.dateEnvoiePlancherAluminium);
    if (data.dateReceptionPlancherAluminium !== undefined) updateData.dateReceptionPlancherAluminium = toDate(data.dateReceptionPlancherAluminium);
    if (data.quantiteNonRecuePlancherAluminium !== undefined) updateData.quantiteNonRecuePlancherAluminium = data.quantiteNonRecuePlancherAluminium ?? null;

    // Commentaire
    if (data.commentaire !== undefined) updateData.commentaire = data.commentaire || null;

    const commande = await prisma.commande.update({ where: { id }, data: updateData });

    return NextResponse.json(commande);
  } catch (error) {
    console.error('PUT /api/achats/commandes/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}