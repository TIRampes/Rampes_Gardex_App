import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculerHeuresIntervention, calculerRentabilite, calculerCoutInstallation } from '@/app/api/rentabilite/schema';

// Récupérer le coût horaire depuis Configuration
async function getCoutHoraire(): Promise<number> {
  try {
    const config = await prisma.configuration.findUnique({ where: { cle: 'rentabilite_cout_horaire' } });
    if (config) return parseFloat(config.valeur) || 160;
  } catch {}
  return 160;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtreProjet = searchParams.get('projet') || '';
    const filtreClient = searchParams.get('client') || '';
    const dateDebut = searchParams.get('dateDebut') || '';
    const dateFin = searchParams.get('dateFin') || '';

    const coutHoraire = await getCoutHoraire();

    // Charger les commandes avec interventions complétées
    const where: any = {
      statut: { in: ['ACTIVE', 'COMPLETEE'] },
      service: 'INSTALLATION',
    };

    // Filtres
    if (filtreProjet) where.numero = { contains: filtreProjet };
    if (filtreClient) where.client = { nom: { contains: filtreClient } };

    // Filtre dates: sur la date d'intervention (planifications.datePlanifiee)
    const dateWhere: any = {};
    if (dateDebut) dateWhere.gte = new Date(dateDebut);
    if (dateFin) dateWhere.lte = new Date(dateFin + 'T23:59:59');

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        client: { select: { nom: true } },
        interventions: {
          where: { statut: { in: ['COMPLETEE', 'EN_COURS'] } },
          select: { heureArrivee: true, heureDepart: true, datePrevue: true },
          orderBy: { datePrevue: 'asc' },
        },
        planifications: {
          select: { datePlanifiee: true },
          take: 1,
          orderBy: { datePlanifiee: 'asc' },
        },
      },
      orderBy: { dateEntree: 'desc' },
    });

    // Transformer en lignes avec heures réelles calculées
    const lignes = commandes
      .map((c) => {
        // Heures réelles = somme des interventions
        let heuresReelles = 0;
        let dateDebut: string | null = null;
        let dateFin: string | null = null;

        for (const inter of c.interventions) {
          heuresReelles += calculerHeuresIntervention(inter.heureArrivee, inter.heureDepart);
          const d = inter.datePrevue?.toISOString().split('T')[0] || null;
          if (d) {
            if (!dateDebut || d < dateDebut) dateDebut = d;
            if (!dateFin || d > dateFin) dateFin = d;
          }
        }

        // Fallback: date planification
        if (!dateDebut && c.planifications[0]) {
          dateDebut = c.planifications[0].datePlanifiee.toISOString().split('T')[0];
          dateFin = dateDebut;
        }

        const venteInstallation = Number(c.prixVenteInstallation) || 0;
        const coutInst = calculerCoutInstallation(heuresReelles, coutHoraire);
        const rentab = calculerRentabilite(venteInstallation, heuresReelles, coutHoraire);

        return {
          id: c.id,
          numProjet: c.numero,
          client: c.client?.nom || '—',
          venteInstallation,
          heuresReelles: Math.round(heuresReelles * 100) / 100,
          dateDebut,
          dateFin,
          coutInstallation: Math.round(coutInst * 10) / 10,
          rentabilite: Math.round(rentab * 100) / 100,
        };
      })
      // Ne garder que celles avec des heures ou avec une vente > 0
      .filter((l) => l.heuresReelles > 0 || l.venteInstallation > 0);

    // Filtre date côté serveur sur les interventions
    let filtered = lignes;
    if (dateDebut || dateFin) {
      filtered = lignes.filter((l) => {
        if (!l.dateDebut) return false;
        if (dateDebut && l.dateDebut < dateDebut) return false;
        if (dateFin && l.dateDebut > dateFin) return false;
        return true;
      });
    }

    // Stats
    const avecHeures = filtered.filter((l) => l.heuresReelles > 0);
    const stats = {
      nombreInstallations: filtered.length,
      rentabiliteSup20: avecHeures.filter((l) => l.rentabilite > 20).length,
      moyenneRentabilite: avecHeures.length > 0
        ? Math.round((avecHeures.reduce((a, l) => a + l.rentabilite, 0) / avecHeures.length) * 100) / 100
        : 0,
      coutHoraire,
    };

    return NextResponse.json({ lignes: filtered, stats, coutHoraire });
  } catch (error) {
    console.error('GET /api/rentabilite erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}