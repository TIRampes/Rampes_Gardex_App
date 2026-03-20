import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InterventionUpdateSchema } from '@/app/api/interventions/schema';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type RouteParams = { params: Promise<{ id: string }> };

// 1. Initialisation du client S3 pour les signatures
const s3Client = new S3Client({
  endpoint: process.env.RAILWAY_STORAGE_ENDPOINT || 'https://t3.storageapi.dev',
  region: 'auto',
  credentials: {
    accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

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

    // 2. SIGNATURE DES PHOTOS (Pour qu'elles s'affichent dans le modal)
    const photosWithSignedUrls = await Promise.all(
      (intervention.photos || []).map(async (photo) => {
        try {
          // On extrait la clé (Key) de l'URL stockée
          const key = photo.url.split('.dev/').pop()?.split('?')[0] || photo.url;

          const command = new GetObjectCommand({
            Bucket: process.env.RAILWAY_STORAGE_BUCKET,
            Key: key,
          });

          // Le lien sera valide 1 heure
          const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          return { 
            ...photo, 
            url: signedUrl,
            createdAt: photo.createdAt.toISOString() 
          };
        } catch (s3Err) {
          console.error("Erreur signature image detail:", s3Err);
          return photo;
        }
      })
    );

    // 3. CONSTRUCTION DE L'OBJET RÉPONSE (Identique à ce qu'attend le frontend)
    const detailedIntervention = {
      ...intervention,
      adresse: intervention.commande?.adresse || 'Adresse non spécifiée',
      clientNom: intervention.commande?.client?.nom || '—',
      clientVille: intervention.commande?.client?.ville || '',
      clientTelephone: intervention.commande?.client?.telephone || '',
      commandeNumero: intervention.commande?.numero || '—',
      photos: photosWithSignedUrls,
      datePrevue: intervention.datePrevue.toISOString(),
    };

    return NextResponse.json({
      intervention: detailedIntervention
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
    const updateData: any = {};

    // Mappage automatique des champs du schéma vers Prisma
    Object.keys(data).forEach(key => {
      if ((data as any)[key] !== undefined) {
        updateData[key] = (data as any)[key];
      }
    });

    // Gestion spécifique des dates
    if (data.dateSignature) {
        updateData.dateSignature = toDate(data.dateSignature);
    }

    const interventionUpdated = await prisma.intervention.update({ 
      where: { id }, 
      data: updateData 
    });

    return NextResponse.json(interventionUpdated);

  } catch (error) {
    console.error('PUT /api/interventions/[id] erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}