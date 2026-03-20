import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // Définir le début de la semaine (Lundi)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Définir le début du mois
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Définir le début de l'année
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const responsables = await prisma.responsableNC.findMany({
      include: {
        nonConformites: {
          select: { dateDetection: true, statut: true }
        }
      }
    });

    const stats = responsables.map(resp => {
      const nc = resp.nonConformites;
      return {
        id: resp.id,
        nom: resp.nom,
        total: nc.length,
        ouvertes: nc.filter(n => n.statut !== 'RESOLU' && n.statut !== 'FERME').length,
        cetteSemaine: nc.filter(n => new Date(n.dateDetection) >= startOfWeek).length,
        ceMois: nc.filter(n => new Date(n.dateDetection) >= startOfMonth).length,
        cetteAnnee: nc.filter(n => new Date(n.dateDetection) >= startOfYear).length,
      };
    }).sort((a, b) => b.ouvertes - a.ouvertes);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erreur Stats:', error);
    return NextResponse.json({ error: 'Erreur statistiques' }, { status: 500 });
  }
}