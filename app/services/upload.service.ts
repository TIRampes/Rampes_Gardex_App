// ╔══════════════════════════════════════════════════════╗
// ║   SERVICE UPLOAD PHOTOS — Railway Object Storage      ║
// ╚══════════════════════════════════════════════════════╝

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

/**
 * Configuration optimisée pour Railway Tigris
 * - La région DOIT être 'auto'
 * - forcePathStyle est activé pour l'endpoint générique
 */
const s3 = new S3Client({
  endpoint: process.env.RAILWAY_STORAGE_ENDPOINT || 'https://t3.storageapi.dev',
  region: 'auto', 
  credentials: {
    accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_KEY || '',
  },
  forcePathStyle: true, 
});

const BUCKET = process.env.RAILWAY_STORAGE_BUCKET || 'coordinated-pod-ut2vzaph';
const PUBLIC_URL = process.env.RAILWAY_STORAGE_PUBLIC_URL || `https://${BUCKET}.t3.storageapi.dev`;

/**
 * Upload une photo vers le bucket Railway
 */
export async function uploadPhoto(
  buffer: Buffer,
  contentType: string,
  folder: string
): Promise<{ url: string; key: string }> {
  // Déterminer l'extension du fichier
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const key = `${folder}/${randomUUID()}.${ext}`;

  try {
    // Railway Tigris ne supporte pas 'ACL'. La visibilité se règle 
    // dans le tableau de bord Railway (Bucket Settings -> Public)
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3.send(command);
    
    // Construction de l'URL publique
    const finalUrl = `${PUBLIC_URL}/${key}`;

    return { url: finalUrl, key };
  } catch (error) {
    console.error('Erreur technique S3:', error);
    throw new Error('Erreur lors de l upload vers le stockage Railway');
  }
}

/**
 * Supprime un fichier
 */
export async function deletePhoto(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
  } catch (error) {
    console.error('Erreur suppression S3:', error);
  }
}

/**
 * Parse la requête pour extraire l'image
 */
export async function parsePhotoFromRequest(request: Request): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
} | null> {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    if (!file) return null;

    const arrayBuffer = await file.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: file.type || 'image/jpeg',
      filename: file.name || 'photo.jpg',
    };
  } catch {
    return null;
  }
}