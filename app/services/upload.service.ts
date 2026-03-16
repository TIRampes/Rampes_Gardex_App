// ╔══════════════════════════════════════════════════════╗
// ║   SERVICE UPLOAD PHOTOS — Railway Object Storage      ║
// ╚══════════════════════════════════════════════════════╝
//
// Railway offre un Object Storage S3-compatible.
// Variables d'environnement requises:
//
//   RAILWAY_STORAGE_ENDPOINT=https://<bucket>.s3.<region>.amazonaws.com
//   RAILWAY_STORAGE_BUCKET=rampes-gardex-photos
//   RAILWAY_STORAGE_REGION=us-east-1
//   RAILWAY_STORAGE_ACCESS_KEY=...
//   RAILWAY_STORAGE_SECRET_KEY=...
//   RAILWAY_STORAGE_PUBLIC_URL=https://<bucket>.s3.<region>.amazonaws.com
//
// SETUP RAILWAY OBJECT STORAGE:
// 1. Dashboard Railway → projet → New → Object Storage
// 2. Copier les credentials S3 dans les variables d'env
// 3. Le bucket est créé automatiquement
// 4. Les fichiers sont accessibles via URL publique

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  endpoint: process.env.RAILWAY_STORAGE_ENDPOINT || '',
  region: process.env.RAILWAY_STORAGE_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_KEY || '',
  },
  forcePathStyle: true, // Railway S3 nécessite path-style
});

const BUCKET = process.env.RAILWAY_STORAGE_BUCKET || 'rampes-gardex-photos';
const PUBLIC_URL = process.env.RAILWAY_STORAGE_PUBLIC_URL || '';

/**
 * Upload un fichier (photo) vers Railway Object Storage
 * @param buffer - Le contenu du fichier en Buffer
 * @param contentType - MIME type (image/jpeg, image/png, etc.)
 * @param folder - Dossier logique (ex: "interventions/cld123")
 * @returns URL publique du fichier uploadé
 */
export async function uploadPhoto(
  buffer: Buffer,
  contentType: string,
  folder: string
): Promise<{ url: string; key: string }> {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const key = `${folder}/${randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));

  const url = `${PUBLIC_URL}/${key}`;
  return { url, key };
}

/**
 * Supprime un fichier de Railway Object Storage
 */
export async function deletePhoto(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

/**
 * Parse un FormData multipart pour extraire le fichier photo
 * Utilisé dans les routes API Next.js
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