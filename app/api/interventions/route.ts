import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TypeIntervention } from '@prisma/client';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 1. Initialisation du client S3 pour Railway Tigris
const s3Client = new S3Client({
  endpoint: "https://t3.storageapi.dev",
  region: 'auto',
  credentials: {
    accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_KEY!,
  },
  forcePathStyle: true,
});

// 2. Fonction pour signer les URLs des photos
async function signPhotoUrl(rawUrl: string) {
  if (!rawUrl) return "";
  try {
    const key = rawUrl.split('.dev/').pop()?.split('?')[0] || '';
    const command = new GetObjectCommand({
      Bucket: process.env.RAILWAY_STORAGE_BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (e) {
    console.error("Erreur de signature:", e);
    return rawUrl;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    const periode = searchParams.get('periode') || 'toutes';
    const recherche = searchParams.get('recherche') || '';

    const where: any = {};
    const validTypes = Object.values(TypeIntervention);
    if (typeParam && validTypes.includes(typeParam as TypeIntervention)) {
      where.type = typeParam;
    }

    if (recherche) {
      where.OR = [
        { commande: { numero: { contains: recherche } } },
        { commande: { client: { nom: { contains: recherche } } } },
        { commande: { adresse: { contains: recherche } } },
      ];
    }

    const now = new Date();
    if (periode === 'aujourdhui') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      where.datePrevue = { gte: start, lte: end };
    } else if (periode === 'semaine') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
      where.datePrevue = { gte: start, lte: end };
    }

    const interventions = await prisma.intervention.findMany({
      where,
      include: {
        commande: { include: { client: true } },
        photos: true,
        equipe: true,
        responsable: true,
      },
      orderBy: [{ datePrevue: 'asc' }, { heureDebut: 'asc' }],
    });

    // 3. Traitement des données (Mapping + Signature des photos)
    const data = await Promise.all(interventions.map(async (i) => {
      // On signe toutes les photos de l'intervention pour la liste
      const signedPhotos = await Promise.all((i.photos || []).map(async (p) => ({
        ...p,
        url: await signPhotoUrl(p.url),
        createdAt: p.createdAt.toISOString(),
      })));

      return {
        ...i,
        id: i.id,
        commandeNumero: i.commande?.numero || '—',
        clientNom: i.commande?.client?.nom || '—',
        clientVille: i.commande?.client?.ville || null,
        clientTelephone: i.commande?.client?.telephone || null,
        adresse: i.commande?.adresse || 'Adresse non spécifiée',
        datePrevue: i.datePrevue.toISOString(),
        dateSignature: i.dateSignature?.toISOString() || null,
        equipeNom: i.equipe?.nom || null,
        equipeCouleur: i.equipe?.couleur || null,
        responsableNom: i.responsable ? `${i.responsable.prenom} ${i.responsable.nom}` : null,
        photos: signedPhotos,
        // Info pour les compteurs
        tempsEstimeInstallation: i.commande?.tempsEstimeInstallation || 0,
      };
    }));

    // 4. RECALCUL DES STATISTIQUES (Le bilan des valeurs)
    const stats = {
      total: data.length,
      installations: data.filter(i => i.type === 'INSTALLATION').length,
      livraisons: data.filter(i => i.type === 'LIVRAISON').length,
      cueillettes: data.filter(i => i.type === 'CUEILLETTE').length,
      transports: data.filter(i => i.type === 'TRANSPORT').length,
      completees: data.filter(i => i.statut === 'COMPLETEE').length,
      heuresEstimees: data.reduce((acc, i) => acc + (Number(i.tempsEstimeInstallation) || 1), 0),
    };

    // 5. Renvoi de la réponse complète
    return NextResponse.json({
      interventions: data,
      stats: stats // CRUCIAL : Ne pas oublier cette ligne pour afficher le bandeau
    });

  } catch (error) {
    console.error('GET /api/interventions erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}