// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: app/api/auth/mfa/verify/route.ts                ║
// ║  NOUVEAU — créer le dossier app/api/auth/mfa/verify/      ║
// ╚══════════════════════════════════════════════════════════╝

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifierCode } from '@/lib/mfa';

// POST — Vérifier le code TOTP après login Microsoft
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Code à 6 chiffres requis' }, { status: 400 });
    }

    // Chercher le secret MFA de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { mfaSecret: true, mfaEnabled: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: 'MFA non activé' }, { status: 400 });
    }

    const isValid = verifierCode(user.mfaSecret, code);
    if (!isValid) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 401 });
    }

    // Code valide — on retourne un token MFA
    // Ce cookie sera vérifié par le proxy
    const response = NextResponse.json({ message: 'Vérifié', verified: true });
    response.cookies.set('mfa-verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24h — même durée que la session
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth/mfa/verify erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET — Vérifier si le MFA est requis pour cet utilisateur
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ required: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { mfaEnabled: true },
    });

    return NextResponse.json({ required: user?.mfaEnabled ?? false });
  } catch (error) {
    console.error('GET /api/auth/mfa/verify erreur:', error);
    return NextResponse.json({ required: false });
  }
}