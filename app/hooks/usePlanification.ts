import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  CommandePlanification,
  Equipe,
  FiltresPlanification,
  PlanificationFormData,
  EditInstallationFormData,
} from "@/app/types/planification";
import { FILTRES_DEFAUT } from "@/app/types/planification";
import {
  separerPlanifications,
  filtrerCommandes,
  grouperParDate,
  calculerStatsHebdo,
  calculerChargeEquipe,
  detecterConflits,
  getDaysInMonth,
  getSemainesDuMois,
} from "@/app/services/planification.service";

// ╔══════════════════════════════════════════════════════════════╗
// ║   HOOK — usePlanification                                   ║
// ╚══════════════════════════════════════════════════════════════╝

export function usePlanification() {
  const [commandes, setCommandes] = useState<CommandePlanification[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [filtres, setFiltres] = useState<FiltresPlanification>(FILTRES_DEFAUT);

  // ── Fetch commandes ──
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planification?limite=200");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCommandes(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch équipes ──
  const fetchEquipes = useCallback(async () => {
    try {
      const res = await fetch("/api/planification/equipes");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setEquipes(json.data);
    } catch (err) {
      console.error("[useEquipes]", err);
    }
  }, []);

  useEffect(() => {
    fetchCommandes();
    fetchEquipes();
  }, [fetchCommandes, fetchEquipes]);

  // ── Computed ──
  const { planifiees, nonPlanifiees } = useMemo(
    () => separerPlanifications(commandes),
    [commandes]
  );

  const planifiesFiltrees = useMemo(
    () => filtrerCommandes(planifiees, filtres),
    [planifiees, filtres]
  );

  const parDate = useMemo(() => grouperParDate(planifiesFiltrees), [planifiesFiltrees]);

  const statsHebdo = useMemo(() => calculerStatsHebdo(planifiees), [planifiees]);

  const chargesEquipes = useMemo(
    () => equipes.map((eq) => calculerChargeEquipe(eq, planifiees)),
    [equipes, planifiees]
  );

  const conflits = useMemo(
    () => detecterConflits(planifiees, equipes),
    [planifiees, equipes]
  );

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const semaines = useMemo(() => getSemainesDuMois(currentMonth), [currentMonth]);

  // ── Navigation mois ──
  const goToPrevMonth = useCallback(
    () => setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1)),
    []
  );
  const goToNextMonth = useCallback(
    () => setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1)),
    []
  );
  const goToToday = useCallback(() => setCurrentMonth(new Date()), []);

  // ── Mutations ──
  const planifierInstallation = useCallback(
    async (data: PlanificationFormData) => {
      try {
        const res = await fetch("/api/planification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "creer", ...data }),
        });
        if (!res.ok) throw new Error("Erreur");
        await fetchCommandes();
        return true;
      } catch (err) {
        console.error("[planifier]", err);
        return false;
      }
    },
    [fetchCommandes]
  );

  const editInstallation = useCallback(
    async (commandeId: string, data: Partial<EditInstallationFormData>) => {
      try {
        const res = await fetch("/api/planification", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commandeId, ...data }),
        });
        if (!res.ok) throw new Error("Erreur");
        // Optimistic update
        setCommandes((prev) =>
          prev.map((c) => (c.id === commandeId ? { ...c, ...data } : c))
        );
        return true;
      } catch (err) {
        console.error("[edit]", err);
        return false;
      }
    },
    []
  );

  const terminerInstallation = useCallback(
    async (commandeId: string, planificationId?: string) => {
      try {
        await fetch("/api/planification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "terminer", commandeId, planificationId }),
        });
        setCommandes((prev) =>
          prev.map((c) =>
            c.id === commandeId ? { ...c, statut: "COMPLETEE" } : c
          )
        );
        return true;
      } catch (err) {
        console.error("[terminer]", err);
        return false;
      }
    },
    []
  );

  const reporterInstallation = useCallback(
    async (planificationId: string, nouvelleDatePlanifiee: string, raison?: string) => {
      try {
        await fetch("/api/planification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reporter",
            planificationId,
            nouvelleDatePlanifiee,
            raison,
          }),
        });
        await fetchCommandes();
        return true;
      } catch (err) {
        console.error("[reporter]", err);
        return false;
      }
    },
    [fetchCommandes]
  );

  // ── Équipes ──
  const ajouterEquipe = useCallback(
    async (nom: string, couleur: string) => {
      try {
        const res = await fetch("/api/planification/equipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom, couleur }),
        });
        if (!res.ok) throw new Error("Erreur");
        const json = await res.json();
        setEquipes((prev) => [...prev, json.data]);
        return true;
      } catch (err) {
        console.error("[ajouterEquipe]", err);
        return false;
      }
    },
    []
  );

  const supprimerEquipe = useCallback(async (equipeId: string) => {
    try {
      await fetch(`/api/planification/equipes?id=${equipeId}`, { method: "DELETE" });
      setEquipes((prev) => prev.filter((e) => e.id !== equipeId));
      return true;
    } catch (err) {
      console.error("[supprimerEquipe]", err);
      return false;
    }
  }, []);

  return {
    // State
    commandes, equipes, loading, error,
    currentMonth, filtres, days, semaines,
    // Computed
    planifiees, planifiesFiltrees, nonPlanifiees, parDate,
    statsHebdo, chargesEquipes, conflits,
    // Navigation
    goToPrevMonth, goToNextMonth, goToToday,
    setFiltres, setCurrentMonth,
    // Mutations
    planifierInstallation, editInstallation, terminerInstallation,
    reporterInstallation, ajouterEquipe, supprimerEquipe,
    fetchCommandes, fetchEquipes,
  };
}