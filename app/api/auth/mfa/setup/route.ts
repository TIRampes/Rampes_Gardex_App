// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: app/api/auth/mfa/setup/route.ts                 ║
// ║  NOUVEAU — créer les dossiers app/api/auth/mfa/setup/     ║
// ╚══════════════════════════════════════════════════════════╝

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { genererSecret, verifierCode } from '@/lib/mfa';
import QRCode from 'qrcode';

// GET — Générer un secret + QR code pour activer le MFA
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { secret, uri } = genererSecret(session.user.email);

    // Générer le QR code en base64
    const qrCodeDataUrl = await QRCode.toDataURL(uri, {
      width: 256,
      margin: 2,
      color: { dark: '#1a2332', light: '#ffffff' },
    });

    return NextResponse.json({ secret, qrCode: qrCodeDataUrl, uri });
  } catch (error) {
    console.error('GET /api/auth/mfa/setup erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — Confirmer l'activation avec le premier code
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { secret, code } = await request.json();
    if (!secret || !code) {
      return NextResponse.json({ error: 'Secret et code requis' }, { status: 400 });
    }

    // Vérifier que le code est valide avant de sauvegarder
    const isValid = verifierCode(secret, code);
    if (!isValid) {
      return NextResponse.json({ error: 'Code invalide. Réessayez.' }, { status: 400 });
    }

    // Sauvegarder le secret et activer le MFA
    await prisma.user.update({
      where: { email: session.user.email },
      data: { mfaSecret: secret, mfaEnabled: true },
    });

    return NextResponse.json({ message: 'MFA activé avec succès' });
  } catch (error) {
    console.error('POST /api/auth/mfa/setup erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — Désactiver le MFA
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { mfaSecret: null, mfaEnabled: false },
    });

    return NextResponse.json({ message: 'MFA désactivé' });
  } catch (error) {
    console.error('DELETE /api/auth/mfa/setup erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}