// ============================================================
// app/multilogements/[commandeId]/page.tsx — Détail d'une commande
// ============================================================
import { Metadata } from "next";
import CommandeDetailClient from "@/app/components/multilogements/CommandeDetailClient";
import { id } from "zod/v4/locales";

export const metadata: Metadata = {
  title: "Détail commande | Multi-logements | Rampes Gardex",
};

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CommandeDetailClient commandeId={id} />;
}