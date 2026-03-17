import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const planif = await prisma.planification.findUnique({
      where: { id },
      include: { commande: { include: { client: true } } },
    });
    if (!planif) return NextResponse.json({ error: 'Planification non trouvée' }, { status: 404 });

    const c = planif.commande;
    const client = c?.client;

    // Extraire email depuis le champ Json "emails"
    let clientEmail: string | null = null;
    if (client?.emails) {
      const raw = client.emails as unknown;
      if (typeof raw === 'string') clientEmail = raw;
      else if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') clientEmail = raw[0];
      else if (typeof raw === 'object' && raw !== null && 'principal' in raw) clientEmail = String((raw as Record<string, unknown>).principal);
    }

    let emailOk = false;
    let smsOk = false;
    const erreurs: string[] = [];

    // Essayer d'envoyer l'email via Graph (si le service existe)
    try {
      const { envoyerAvisClient } = await import('@/app/services/avis-client.service');
      const result = await envoyerAvisClient({
        email: clientEmail,
        telephone: client?.telephone || null,
        clientNom: client?.nom || '—',
        service: c?.service || 'INSTALLATION',
        date: planif.datePlanifiee.toISOString(),
        adresse: c?.adresse || '',
        numero: c?.numero || '',
        heureDebut: planif.heureDebut,
      });
      emailOk = result.email;
      smsOk = result.sms;
      erreurs.push(...result.erreurs);
    } catch (serviceErr: any) {
      erreurs.push(`Service non configuré: ${serviceErr.message}`);
    }

    // Marquer comme envoyé quand même (pour le tracking)
    await prisma.planification.update({
      where: { id },
      data: { avisClientEnvoye: true, avisClientDate: new Date() },
    });

    return NextResponse.json({
      email: emailOk,
      sms: smsOk,
      message: `Email: ${emailOk ? '✓' : '✕'} | SMS: ${smsOk ? '✓' : '✕'}`,
      erreurs,
    });
  } catch (error: any) {
    console.error('POST avis erreur:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}