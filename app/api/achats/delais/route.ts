import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DelaisConfigSchema, DELAIS_DEFAUT } from '@/app/api/achats/schema';
import type { DelaisConfig } from '@/app/api/achats/schema';

const CLE_DELAIS = 'achats_delais_livraison';
const CLE_RUPTURES = 'achats_ruptures_stock';
const CLE_DEBUT = 'achats_debut_construction';

async function getConfig(cle: string): Promise<string | null> {
  const row = await prisma.configuration.findUnique({ where: { cle } });
  return row?.valeur ?? null;
}

async function setConfig(cle: string, valeur: string, description?: string) {
  await prisma.configuration.upsert({
    where: { cle },
    update: { valeur },
    create: { cle, valeur, description: description || cle, modifiable: true },
  });
}

// GET /api/achats/delais
export async function GET() {
  try {
    const delaisJson = await getConfig(CLE_DELAIS);
    const rupturesJson = await getConfig(CLE_RUPTURES);
    const debutConstruction = await getConfig(CLE_DEBUT);

    const delais = delaisJson ? JSON.parse(delaisJson) : DELAIS_DEFAUT;
    const ruptures = rupturesJson ? JSON.parse(rupturesJson) : [];

    return NextResponse.json({
      delais,
      ruptures,
      debutConstruction: debutConstruction || '',
    } satisfies DelaisConfig);
  } catch (error) {
    console.error('GET /api/achats/delais erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/achats/delais — sauvegarde tout d'un coup
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = DelaisConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    await Promise.all([
      setConfig(CLE_DELAIS, JSON.stringify(data.delais), 'Délais de livraison par secteur'),
      setConfig(CLE_RUPTURES, JSON.stringify(data.ruptures), 'Ruptures de stock actuelles'),
      setConfig(CLE_DEBUT, data.debutConstruction || '', 'Date début construction'),
    ]);

    return NextResponse.json({ message: 'Configuration sauvegardée', ...data });
  } catch (error) {
    console.error('PUT /api/achats/delais erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}