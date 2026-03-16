import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadPhoto, parsePhotoFromRequest, deletePhoto } from '@/app/services/upload.service';
import { TYPE_PHOTO_ENUM } from '@/app/api/interventions/schema';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/interventions/[id]/photos
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const photos = await prisma.photo.findMany({
      where: { interventionId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('GET photos erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/interventions/[id]/photos — Upload photo via multipart/form-data
// FormData: photo (File), type (AVANT|APRES|PREUVE|AUTRE), description (optional)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Vérifier que l'intervention existe
    const intervention = await prisma.intervention.findUnique({ where: { id } });
    if (!intervention) {
      return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    }

    // Parser le FormData
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const typePhoto = (formData.get('type') as string) || 'AUTRE';
    const description = (formData.get('description') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Valider le type
    if (!TYPE_PHOTO_ENUM.includes(typePhoto as any)) {
      return NextResponse.json({ error: `Type invalide. Valeurs: ${TYPE_PHOTO_ENUM.join(', ')}` }, { status: 400 });
    }

    // Valider la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    // Valider le type MIME
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Seuls les fichiers image sont acceptés' }, { status: 400 });
    }

    // Upload vers Railway Object Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = `interventions/${id}`;
    const { url } = await uploadPhoto(buffer, file.type, folder);

    // Sauvegarder en BD
    const photo = await prisma.photo.create({
      data: {
        interventionId: id,
        type: typePhoto as any,
        url,
        description,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('POST photo erreur:', error);
    return NextResponse.json({ error: 'Erreur upload' }, { status: 500 });
  }
}

// DELETE /api/interventions/[id]/photos — supprimer une photo (body: { photoId })
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const photoId = body.photoId;

    if (!photoId) return NextResponse.json({ error: 'photoId requis' }, { status: 400 });

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, interventionId: id },
    });

    if (!photo) return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 });

    // Extraire la clé S3 depuis l'URL
    const key = photo.url.split('/').slice(-2).join('/'); // interventions/xxx/uuid.jpg
    try { await deletePhoto(key); } catch { /* fichier peut ne plus exister */ }

    await prisma.photo.delete({ where: { id: photoId } });

    return NextResponse.json({ message: 'Photo supprimée' });
  } catch (error) {
    console.error('DELETE photo erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}