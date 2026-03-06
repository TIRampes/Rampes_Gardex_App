import { NextRequest, NextResponse } from 'next/server';
import { completerReprise } from '@/app/services/reprises.service';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/reprises/[id]/completer
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reprise = await completerReprise(id);
    return NextResponse.json({ message: 'Reprise complétée', reprise });
  } catch (error) {
    console.error('POST /api/reprises/[id]/completer erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}