import { useState, useEffect, useCallback, useMemo } from "react";
import type { CommandeProduction } from "@/app/dashboard/production/schema";

// ╔══════════════════════════════════════════════════════════╗
// ║     HOOK: useProduction                                  ║
// ║     Gère l'état et les appels API du module production   ║
// ╚══════════════════════════════════════════════════════════╝

interface UseProductionOptions {
  autoFetch?: boolean;
  statut?: string;
  limite?: number;
}

export function useProduction(options: UseProductionOptions = {}) {
  const { autoFetch = true, statut = "ACTIVE", limite = 200 } = options;

  const [commandes, setCommandes] = useState<CommandeProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ──── Fetch ────
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/production?statut=${statut}&limite=${limite}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCommandes(json.data);
    } catch (err) {
      console.error("[useProduction] Erreur fetch:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [statut, limite]);

  useEffect(() => {
    if (autoFetch) fetchCommandes();
  }, [autoFetch, fetchCommandes]);

  // ──── Computed ────
  const commandesEnProduction = useMemo(
    () =>
      commandes.filter(
        (c) =>
          c.envoyeProduction === "COMPLETE" &&
          c.productionTerminee !== "COMPLETE"
      ),
    [commandes]
  );

  const commandesActives = useMemo(
    () => commandes.filter((c) => c.statut === "ACTIVE"),
    [commandes]
  );

  const totaux = useMemo(
    () => ({
      piedsLineaires: commandesEnProduction.reduce(
        (s, c) => s + c.piedsLineairesRampes,
        0
      ),
      poteaux: commandesEnProduction.reduce(
        (s, c) => s + c.nombrePoteaux,
        0
      ),
      enProduction: commandesEnProduction.length,
      terminees: commandes.filter((c) => c.productionTerminee === "COMPLETE")
        .length,
      enAttente: commandes.filter(
        (c) => c.statut === "ACTIVE" && c.envoyeProduction !== "COMPLETE"
      ).length,
    }),
    [commandes, commandesEnProduction]
  );

  // ──── Mutations ────
  const updateChamp = useCallback(
    async (cmdId: string, champ: string, valeur: string | null) => {
      try {
        const res = await fetch("/api/production", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commandeId: cmdId, [champ]: valeur }),
        });
        if (!res.ok) throw new Error("Erreur mise à jour");
        setCommandes((prev) =>
          prev.map((c) => (c.id === cmdId ? { ...c, [champ]: valeur } : c))
        );
        return true;
      } catch (err) {
        console.error("[useProduction] updateChamp:", err);
        return false;
      }
    },
    []
  );

  const updateDateProduction = useCallback(
    async (cmdId: string, date: string | null) => {
      return updateChamp(cmdId, "dateProduction", date);
    },
    [updateChamp]
  );

  const mettreEnProduction = useCallback(
    async (cmdId: string) => {
      try {
        await fetch("/api/production", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commandeId: cmdId,
            envoyeProduction: "COMPLETE",
            enProduction: true,
          }),
        });
        setCommandes((prev) =>
          prev.map((c) =>
            c.id === cmdId
              ? { ...c, envoyeProduction: "COMPLETE", enProduction: true }
              : c
          )
        );
        return true;
      } catch (err) {
        console.error("[useProduction] mettreEnProduction:", err);
        return false;
      }
    },
    []
  );

  const retirerDeProduction = useCallback(async (cmdId: string) => {
    try {
      await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retirer", commandeId: cmdId }),
      });
      setCommandes((prev) =>
        prev.map((c) =>
          c.id === cmdId
            ? {
                ...c,
                envoyeProduction: null,
                enProduction: false,
                dateProduction: null,
              }
            : c
        )
      );
      return true;
    } catch (err) {
      console.error("[useProduction] retirerDeProduction:", err);
      return false;
    }
  }, []);

  const terminerProduction = useCallback(async (cmdId: string) => {
    try {
      await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "terminer", commandeId: cmdId }),
      });
      setCommandes((prev) =>
        prev.map((c) =>
          c.id === cmdId
            ? {
                ...c,
                productionTerminee: "COMPLETE",
                enProduction: false,
              }
            : c
        )
      );
      return true;
    } catch (err) {
      console.error("[useProduction] terminerProduction:", err);
      return false;
    }
  }, []);

  const mettreEnProductionBatch = useCallback(
    async (cmdIds: string[], dateProduction: string) => {
      try {
        const res = await fetch("/api/production", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "mettre-en-production",
            commandeIds: cmdIds,
            dateProduction,
          }),
        });
        if (!res.ok) throw new Error("Erreur batch");
        // Refetch pour s'assurer de la cohérence
        await fetchCommandes();
        return true;
      } catch (err) {
        console.error("[useProduction] batch:", err);
        return false;
      }
    },
    [fetchCommandes]
  );

  return {
    // Données
    commandes,
    commandesEnProduction,
    commandesActives,
    totaux,
    loading,
    error,
    // Actions
    fetchCommandes,
    updateChamp,
    updateDateProduction,
    mettreEnProduction,
    mettreEnProductionBatch,
    retirerDeProduction,
    terminerProduction,
  };
}