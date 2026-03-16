import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InterventionUpdateSchema } from '@/app/api/interventions/schema';

type RouteParams = { params: Promise<{ id: string }> };

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string') { const d = new Date(val); return isNaN(d.getTime()) ? null : d; }
  return null;
}

// GET /api/interventions/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: {
        commande: {
          include: {
            client: true,
            representant: { select: { nom: true } },
            planifications: { include: { equipe: true }, take: 1, orderBy: { datePlanifiee: 'desc' } },
          },
        },
        equipe: true,
        responsable: { select: { nom: true, prenom: true } },
        photos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!intervention) {
      return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    }

    // Récupérer les autres interventions du même jour (pour la carte)
    const start = new Date(intervention.datePrevue);
    start.setHours(0, 0, 0, 0);
    const end = new Date(intervention.datePrevue);
    end.setHours(23, 59, 59, 999);

    const autresInterventions = await prisma.intervention.findMany({
      where: {
        id: { not: id },
        datePrevue: { gte: start, lte: end },
      },
      include: {
        commande: { select: { numero: true, adresse: true, client: { select: { nom: true } } } },
      },
    });

    return NextResponse.json({
      intervention,
      autresInterventionsJour: autresInterventions.map((a) => ({
        id: a.id,
        commandeNumero: a.commande?.numero,
        clientNom: a.commande?.client?.nom,
        adresse: a.commande?.adresse,
        type: a.type,
        heureDebut: a.heureDebut,
      })),
    });
  } catch (error) {
    console.error('GET /api/interventions/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/interventions/[id] — Sauvegarder le formulaire d'intervention
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = InterventionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.intervention.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    // Scalaires — set uniquement si fourni
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.heureArrivee !== undefined) updateData.heureArrivee = data.heureArrivee || null;
    if (data.heureDepart !== undefined) updateData.heureDepart = data.heureDepart || null;
    if (data.personneRessource !== undefined) updateData.personneRessource = data.personneRessource || null;
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;

    // Installation
    if (data.accessibiliteBalcon !== undefined) updateData.accessibiliteBalcon = data.accessibiliteBalcon || null;
    if (data.balconEncombre !== undefined) updateData.balconEncombre = data.balconEncombre || null;
    if (data.niveauBalconConforme !== undefined) updateData.niveauBalconConforme = data.niveauBalconConforme || null;
    if (data.backingConforme !== undefined) updateData.backingConforme = data.backingConforme || null;
    if (data.colonneCapage !== undefined) updateData.colonneCapage = data.colonneCapage || null;
    if (data.noteAvant !== undefined) updateData.noteAvant = data.noteAvant || null;
    if (data.travauxNonComplete !== undefined) updateData.travauxNonComplete = data.travauxNonComplete;
    if (data.travauxNonCompleteNote !== undefined) updateData.travauxNonCompleteNote = data.travauxNonCompleteNote || null;
    if (data.mainsInstallees !== undefined) updateData.mainsInstallees = data.mainsInstallees || null;
    if (data.cacheVisInstallees !== undefined) updateData.cacheVisInstallees = data.cacheVisInstallees || null;
    if (data.capsulesPoteaux !== undefined) updateData.capsulesPoteaux = data.capsulesPoteaux || null;
    if (data.vuEnsemble !== undefined) updateData.vuEnsemble = data.vuEnsemble || null;
    if (data.noteApres !== undefined) updateData.noteApres = data.noteApres || null;

    // Livraison
    if (data.materielComplet !== undefined) updateData.materielComplet = data.materielComplet || null;
    if (data.etatMateriel !== undefined) updateData.etatMateriel = data.etatMateriel || null;
    if (data.quantiteConforme !== undefined) updateData.quantiteConforme = data.quantiteConforme || null;
    if (data.emplacementLivraison !== undefined) updateData.emplacementLivraison = data.emplacementLivraison || null;
    if (data.accessibilite !== undefined) updateData.accessibilite = data.accessibilite || null;
    if (data.noteLivraison !== undefined) updateData.noteLivraison = data.noteLivraison || null;

    // Cueillette
    if (data.materielIdentifie !== undefined) updateData.materielIdentifie = data.materielIdentifie || null;
    if (data.etatMaterielRecupere !== undefined) updateData.etatMaterielRecupere = data.etatMaterielRecupere || null;
    if (data.quantiteRecuperee !== undefined) updateData.quantiteRecuperee = data.quantiteRecuperee ?? null;
    if (data.emplacementCueillette !== undefined) updateData.emplacementCueillette = data.emplacementCueillette || null;
    if (data.difficulteAcces !== undefined) updateData.difficulteAcces = data.difficulteAcces || null;
    if (data.noteCueillette !== undefined) updateData.noteCueillette = data.noteCueillette || null;
    if (data.listeMateriels !== undefined) updateData.listeMateriels = data.listeMateriels || null;

    // Transport
    if (data.adresseDepart !== undefined) updateData.adresseDepart = data.adresseDepart || null;
    if (data.adresseArrivee !== undefined) updateData.adresseArrivee = data.adresseArrivee || null;
    if (data.vehiculeInspecte !== undefined) updateData.vehiculeInspecte = data.vehiculeInspecte || null;
    if (data.chargementSecurise !== undefined) updateData.chargementSecurise = data.chargementSecurise || null;
    if (data.documentationComplete !== undefined) updateData.documentationComplete = data.documentationComplete || null;
    if (data.kmDepart !== undefined) updateData.kmDepart = data.kmDepart ?? null;
    if (data.kmArrivee !== undefined) updateData.kmArrivee = data.kmArrivee ?? null;
    if (data.membresEquipe !== undefined) updateData.membresEquipe = data.membresEquipe || null;
    if (data.materielTransporte !== undefined) updateData.materielTransporte = data.materielTransporte || null;
    if (data.noteTransport !== undefined) updateData.noteTransport = data.noteTransport || null;

    // Signatures
    if (data.signatureInstallateur !== undefined) updateData.signatureInstallateur = data.signatureInstallateur || null;
    if (data.signatureClient !== undefined) updateData.signatureClient = data.signatureClient || null;
    if (data.signatureLivreur !== undefined) updateData.signatureLivreur = data.signatureLivreur || null;
    if (data.signatureChauffeur !== undefined) updateData.signatureChauffeur = data.signatureChauffeur || null;
    if (data.dateSignature !== undefined) updateData.dateSignature = toDate(data.dateSignature);

    if (data.formulaireComplete !== undefined) updateData.formulaireComplete = data.formulaireComplete;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const intervention = await prisma.intervention.update({ where: { id }, data: updateData });

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('PUT /api/interventions/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}