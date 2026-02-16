import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notifications: {
      id: string;
      title: string;
      message: string;
      time: string;
      unread: boolean;
      type: "info" | "warning" | "success" | "error";
      link?: string;
    }[] = [];

    // 1. Commandes créées (dernières 24h)
    const commandesRecentes = await prisma.commande.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true, numero: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    commandesRecentes.forEach((cmd) => {
      notifications.push({
        id: `cmd-${cmd.id}`,
        title: "Nouvelle commande",
        message: `${cmd.numero} créée`,
        time: formatTimeAgo(cmd.createdAt),
        unread: true,
        type: "info",
        link: `/dashboard/commandes/${cmd.id}`,
      });
    });

    // 2. Commandes en retard
    const commandesEnRetard = await prisma.commande.findMany({
      where: {
        statut: "ACTIVE",
        datePrevue: { lt: today },
      },
      select: { 
        id: true, 
        numero: true, 
        client: { select: { nom: true } } 
      },
      take: 3,
    });

    commandesEnRetard.forEach((cmd) => {
      notifications.push({
        id: `retard-${cmd.id}`,
        title: "Commande en retard",
        message: `${cmd.numero} - ${cmd.client.nom}`,
        time: "En retard",
        unread: true,
        type: "warning",
        link: `/dashboard/commandes/${cmd.id}`,
      });
    });

    // 3. Reprises en cours
    const reprisesEnCours = await prisma.reprise.findMany({
      where: { completee: false },
      select: { 
        id: true, 
        createdAt: true,
        commande: { select: { numero: true } },
        client: { select: { nom: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    });

    reprisesEnCours.forEach((rep) => {
      notifications.push({
        id: `reprise-${rep.id}`,
        title: "Reprise en cours",
        message: `${rep.commande.numero} - ${rep.client.nom}`,
        time: formatTimeAgo(rep.createdAt),
        unread: true,
        type: "error",
        link: `/dashboard/reprises`,
      });
    });

    // 4. Interventions aujourd'hui
    const interventionsAujourdhui = await prisma.intervention.findMany({
      where: {
        datePrevue: { gte: today, lt: tomorrow },
        statut: "PLANIFIEE",
      },
      select: {
        id: true,
        type: true,
        heureDebut: true,
        commande: { 
          select: { 
            client: { select: { nom: true } },
          },
        },
      },
      take: 3,
    });

    const typeLabels: Record<string, string> = {
      INSTALLATION: "Installation",
      LIVRAISON: "Livraison",
      CUEILLETTE: "Cueillette",
      TRANSPORT: "Transport",
    };

    interventionsAujourdhui.forEach((int) => {
      notifications.push({
        id: `int-${int.id}`,
        title: `${typeLabels[int.type] || int.type} prévue`,
        message: `${int.commande.client.nom} - ${int.heureDebut || "À planifier"}`,
        time: "Aujourd'hui",
        unread: false,
        type: "info",
        link: `/dashboard/planification`,
      });
    });

    // 5. Commandes complétées (48h)
    const commandesCompletees = await prisma.commande.findMany({
      where: {
        statut: "COMPLETEE",
        dateCompletion: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      select: { id: true, numero: true, dateCompletion: true },
      orderBy: { dateCompletion: "desc" },
      take: 2,
    });

    commandesCompletees.forEach((cmd) => {
      notifications.push({
        id: `complete-${cmd.id}`,
        title: "Commande complétée",
        message: `${cmd.numero} terminée`,
        time: cmd.dateCompletion ? formatTimeAgo(cmd.dateCompletion) : "",
        unread: false,
        type: "success",
        link: `/dashboard/commandes/${cmd.id}`,
      });
    });

    // Trier: non lues d'abord
    notifications.sort((a, b) => (a.unread === b.unread ? 0 : a.unread ? -1 : 1));

    return NextResponse.json({
      notifications: notifications.slice(0, 10),
      unreadCount: notifications.filter(n => n.unread).length,
    });
  } catch (error) {
    console.error("Erreur API notifications:", error);
    return NextResponse.json({ 
      notifications: [],
      unreadCount: 0,
    });
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `${diffDays} jours`;
  return new Date(date).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}