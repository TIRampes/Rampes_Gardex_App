import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACHAT_TYPES, calculerStatutGlobal } from '@/app/api/achats/schema';
import type { AchatCommandeView, AchatTypeView, StatsAchats } from '@/app/api/achats/schema';

function toISO(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function mapCommandeToAchatView(c: any): AchatCommandeView {
  const achats: AchatTypeView[] = ACHAT_TYPES.map((t) => ({
    key: t.key,
    label: t.label,
    statut: c[t.prismaStatut] || null,
    dateEnvoie: toISO(c[t.prismaEnvoi]),
    dateReception: toISO(c[t.prismaRecep]),
    quantiteNonRecue: c[t.prismaQte] ?? null,
    actif: c[t.prismaStatut] != null,
  }));

  const actifs = achats.filter((a) => a.actif);
  const recus = actifs.filter((a) => a.statut === 'RECEPTIONNE');

  return {
    id: c.id,
    commandeNumero: c.numero,
    clientNom: c.client?.nom || '—',
    clientVille: c.client?.ville || null,
    service: c.service,
    couleur: c.couleurPersonnalisee || c.couleur || null,
    structure: c.structure,
    datePrevue: toISO(c.datePrevue),
    commentaire: c.commentaire,
    statutLivraison: c.statutLivraison || 'N_A',
    achats,
    statutGlobal: calculerStatutGlobal(achats),
    nbAchatsActifs: actifs.length,
    nbAchatsRecus: recus.length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get('recherche') || '';
    const filtreService = searchParams.get('service') || '';
    const filtreTypeAchat = searchParams.get('typeAchat') || '';

    // Commandes avec au moins un achat inline non-null
    const orAchat = ACHAT_TYPES.map((t) => ({ [t.prismaStatut]: { not: null } }));

    const where: any = {
      statut: { in: ['ACTIVE', 'EN_ATTENTE'] },
      OR: orAchat,
    };

    if (recherche) {
      where.AND = [
        {
          OR: [
            { numero: { contains: recherche } },
            { client: { nom: { contains: recherche } } },
            { commentaire: { contains: recherche } },
          ],
        },
      ];
    }
    if (filtreService) where.service = filtreService;

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        client: { select: { nom: true, ville: true, telephone: true } },
      },
      orderBy: { datePrevue: 'asc' },
    });

    const all = commandes.map(mapCommandeToAchatView);

    // Filtrer par type d'achat côté serveur
    let actifs = all.filter((a) => a.statutLivraison !== 'LIVRE');
    if (filtreTypeAchat) {
      actifs = actifs.filter((a) => a.achats.some((ac) => ac.key === filtreTypeAchat && ac.actif));
    }

    // Historique = commandes livrées
    const historiqueWhere: any = {
      statutLivraison: 'LIVRE',
      OR: orAchat,
    };
    const commandesLivrees = await prisma.commande.findMany({
      where: historiqueWhere,
      include: { client: { select: { nom: true, ville: true, telephone: true } } },
      orderBy: { dateLivraison: 'desc' },
      take: 50,
    });
    const historique = commandesLivrees.map(mapCommandeToAchatView);

    // Stats
    const stats: StatsAchats = {
      total: actifs.length,
      aFaire: actifs.filter((a) => a.achats.some((ac) => ac.statut === 'A_FAIRE')).length,
      fait: actifs.filter((a) => a.achats.some((ac) => ac.statut === 'FAIT')).length,
      enTransit: actifs.filter((a) => a.achats.some((ac) => ac.statut === 'PRET_A_RAMASSER')).length,
      receptionne: actifs.filter((a) => a.achats.every((ac) => !ac.actif || ac.statut === 'RECEPTIONNE')).length,
      backOrder: actifs.filter((a) => a.achats.some((ac) => ac.statut === 'BACK_ORDER')).length,
      historiqueLivres: historique.length,
    };

    return NextResponse.json({ actifs, historique, stats });
  } catch (error) {
    console.error('GET /api/achats erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}