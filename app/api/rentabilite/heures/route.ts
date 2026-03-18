import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EntreeHeuresSchema, ModifHeuresSchema } from '@/app/api/rentabilite/schema';

// GET — Lister les entrées pour le modal de modification (filtré par année)
export async function GET(request: NextRequest) {
  try {
    const annee = new URL(request.url).searchParams.get('annee') || String(new Date().getFullYear());
    const recherche = new URL(request.url).searchParams.get('recherche') || '';

    const startDate = new Date(`${annee}-01-01`);
    const endDate = new Date(`${annee}-12-31T23:59:59`);

    const where: any = {
      statut: { in: ['COMPLETEE', 'EN_COURS'] },
      type: 'INSTALLATION',
      datePrevue: { gte: startDate, lte: endDate },
    };

    const interventions = await prisma.intervention.findMany({
      where,
      include: {
        commande: { select: { numero: true } },
      },
      orderBy: { datePrevue: 'desc' },
    });

    let entries = interventions.map((i) => {
      // Calculer heures depuis heureArrivee/heureDepart
      let heures = 0;
      if (i.heureArrivee && i.heureDepart) {
        const [ha, ma] = i.heureArrivee.split(':').map(Number);
        const [hd, md] = i.heureDepart.split(':').map(Number);
        if (!isNaN(ha) && !isNaN(hd)) {
          heures = Math.round(((hd * 60 + md) - (ha * 60 + ma)) / 60 * 100) / 100;
        }
      }
      return {
        id: i.id,
        commandeId: i.commandeId,
        numProjet: i.commande?.numero || '—',
        nombreHeures: heures > 0 ? heures : 0,
        dateInstallation: i.datePrevue.toISOString().split('T')[0],
        heureArrivee: i.heureArrivee,
        heureDepart: i.heureDepart,
      };
    });

    if (recherche) {
      entries = entries.filter((e) => e.numProjet.includes(recherche));
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('GET /api/rentabilite/heures erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — Nouvelle entrée d'heures (crée une intervention si besoin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EntreeHeuresSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });

    const { numProjet, nombreHeures, dateInstallation } = parsed.data;

    // Trouver la commande
    const commande = await prisma.commande.findFirst({ where: { numero: numProjet } });
    if (!commande) return NextResponse.json({ error: `Projet ${numProjet} non trouvé` }, { status: 404 });

    // Convertir heures en heureArrivee/heureDepart (ex: 2.5h → 08:00 / 10:30)
    const totalMinutes = Math.round(nombreHeures * 60);
    const hFin = 8 + Math.floor(totalMinutes / 60);
    const mFin = totalMinutes % 60;
    const heureArrivee = '08:00';
    const heureDepart = `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`;

    // Créer l'intervention COMPLETEE
    const intervention = await prisma.intervention.create({
      data: {
        commandeId: commande.id,
        type: 'INSTALLATION',
        datePrevue: new Date(dateInstallation),
        heureArrivee,
        heureDepart,
        statut: 'COMPLETEE',
        formulaireComplete: true,
        notes: `Heures saisies manuellement: ${nombreHeures}h`,
      },
    });

    return NextResponse.json({ id: intervention.id, message: 'Heures enregistrées' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/rentabilite/heures erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT — Modifier les heures d'une intervention existante
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nombreHeures, dateInstallation } = body;
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const existing = await prisma.intervention.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });

    // Recalculer heureArrivee/heureDepart
    const updateData: any = {};
    if (nombreHeures !== undefined) {
      const totalMinutes = Math.round(nombreHeures * 60);
      const hFin = 8 + Math.floor(totalMinutes / 60);
      const mFin = totalMinutes % 60;
      updateData.heureArrivee = '08:00';
      updateData.heureDepart = `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`;
    }
    if (dateInstallation) {
      updateData.datePrevue = new Date(dateInstallation);
    }

    await prisma.intervention.update({ where: { id }, data: updateData });

    return NextResponse.json({ message: 'Modifié' });
  } catch (error) {
    console.error('PUT /api/rentabilite/heures erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — Supprimer une entrée d'heures
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
    await prisma.intervention.delete({ where: { id } });
    return NextResponse.json({ message: 'Supprimé' });
  } catch (error) {
    console.error('DELETE /api/rentabilite/heures erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}