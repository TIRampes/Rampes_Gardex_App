"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  CommandeAttente,
  Representant,
  FiltresAttentes,
  StatsAttentes,
  EnvoiAttente,
} from "@/app/types/attentes";
import { FILTRES_ATTENTES_DEFAUT } from "@/app/types/attentes";
import {
  filtrerAttentes,
  calculerStatsAttentes,
} from "@/app/services/attentes.service";

// ╔══════════════════════════════════════════════════════════════╗
// ║   HOOK — useAttentes                                        ║
// ╚══════════════════════════════════════════════════════════════╝

export function useAttentes() {
  // ── State ──
  const [commandes, setCommandes] = useState<CommandeAttente[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtres, setFiltres] = useState<FiltresAttentes>(FILTRES_ATTENTES_DEFAUT);
  const [totalActives, setTotalActives] = useState(0);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [dernierResultatEnvoi, setDernierResultatEnvoi] = useState<{
    success: boolean;
    message: string;
    details?: unknown[];
  } | null>(null);

  // ── Fetch commandes en attente ──
  const fetchCommandes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtres.representantIds.length > 0) {
        params.set("representantIds", filtres.representantIds.join(","));
      }
      if (filtres.typeAttente !== "tous") params.set("typeAttente", filtres.typeAttente);
      if (filtres.service !== "tous") params.set("service", filtres.service);
      if (filtres.recherche) params.set("recherche", filtres.recherche);
      params.set("tri", filtres.tri.champ);
      params.set("ordre", filtres.tri.ordre);

      const res = await fetch(`/api/attentes?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur chargement des attentes");
      const json = await res.json();

      setCommandes(json.data ?? []);
      setTotalActives(json.meta?.totalActives ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [filtres]);

  // ── Fetch représentants ──
  const fetchRepresentants = useCallback(async () => {
    try {
      const res = await fetch("/api/representants");
      if (!res.ok) return;
      const json = await res.json();
      setRepresentants(json.data ?? []);
    } catch {
      // Non bloquant
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    fetchCommandes();
    fetchRepresentants();
  }, [fetchCommandes, fetchRepresentants]);

  // ── Données filtrées (côté client pour filtrage instantané) ──
  const commandesFiltrees = useMemo(
    () => filtrerAttentes(commandes, filtres),
    [commandes, filtres]
  );

  // ── Statistiques ──
  const stats = useMemo<Omit<StatsAttentes, "prochainEnvoiAuto" | "envoisCetteSemaine">>(
    () => calculerStatsAttentes(commandes, totalActives),
    [commandes, totalActives]
  );

  // ── Envoi individuel ──
  const envoyerIndividuel = useCallback(
    async (representantId: string, commandeIds?: string[], notes?: string) => {
      try {
        setEnvoiEnCours(true);
        const res = await fetch("/api/attentes/envoi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "individuel", representantId, commandeIds, notes }),
        });
        const json = await res.json();

        setDernierResultatEnvoi({
          success: json.success,
          message: json.success
            ? `Email envoyé à ${json.representant} (${json.nbCommandes} commande(s))`
            : `Erreur: ${json.error}`,
        });

        if (json.success) {
          await fetchCommandes(); // Refresh pour mise à jour du statut
        }
        return json.success;
      } catch {
        setDernierResultatEnvoi({ success: false, message: "Erreur réseau" });
        return false;
      } finally {
        setEnvoiEnCours(false);
      }
    },
    [fetchCommandes]
  );

  // ── Envoi groupé ──
  const envoyerGroupe = useCallback(
    async (representantIds: string[], notes?: string) => {
      try {
        setEnvoiEnCours(true);
        const res = await fetch("/api/attentes/envoi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "groupe", representantIds, notes }),
        });
        const json = await res.json();

        setDernierResultatEnvoi({
          success: json.success,
          message: json.success
            ? `${json.nbSuccess}/${json.total} email(s) envoyé(s) avec succès`
            : "Erreur lors de l'envoi",
          details: json.details,
        });

        if (json.success) {
          await fetchCommandes();
        }
        return json.success;
      } catch {
        setDernierResultatEnvoi({ success: false, message: "Erreur réseau" });
        return false;
      } finally {
        setEnvoiEnCours(false);
      }
    },
    [fetchCommandes]
  );

  // ── Envoi à tous ──
  const envoyerTous = useCallback(
    async (notes?: string) => {
      const repIds = stats.parRepresentant.map((r) => r.representantId);
      if (repIds.length === 0) return false;
      return envoyerGroupe(repIds, notes);
    },
    [stats.parRepresentant, envoyerGroupe]
  );

  // ── Reset notification ──
  const clearResultatEnvoi = useCallback(() => setDernierResultatEnvoi(null), []);

  return {
    // Data
    commandes,
    commandesFiltrees,
    representants,
    stats,
    totalActives,
    // State
    loading,
    error,
    filtres,
    envoiEnCours,
    dernierResultatEnvoi,
    // Actions
    setFiltres,
    fetchCommandes,
    envoyerIndividuel,
    envoyerGroupe,
    envoyerTous,
    clearResultatEnvoi,
  };
}