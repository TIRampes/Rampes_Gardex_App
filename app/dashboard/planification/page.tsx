"use client";
export const dynamic = 'force-dynamic';
import { useState, useCallback, useMemo } from "react";
import {
  Users,
  MapPin,
  CalendarPlus,
  Clock,
  Ruler,
  Footprints,
  Activity,
  CalendarDays,
  Loader2,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";

import { usePlanification } from "@/app/hooks/usePlanifications";
import {
  getInstallationsForDate,
  formatDateKey,
} from "@/app/services/planification.service";

import PlanificationFiltres from "@/app/components/planification/Planificationfiltres";
import PlanificationCalendrier from  "@/app/components/planification/Planificationcalendrier";
import DateDetailModal from  "@/app/components/planification/Datedetailmodal";
import PlanifierModal from  "@/app/components/planification/Planifiermodal";
import NonPlanifieesModal from  "@/app/components/planification/Nonplanifeesmodal";
import EquipesModal from  "@/app/components/planification/Equipesmodal";
import EditInstallationModal from  "@/app/components/planification/Editinstallationmodal";
import ChargeEquipesPanel from  "@/app/components/planification/Chargeequipespanel";

import type { CommandePlanification } from "@/app/types/planification";

// ╔══════════════════════════════════════════════════════════════╗
// ║   PAGE PRINCIPALE — PLANIFICATION                           ║
// ║   /app/(dashboard)/planification/page.tsx                   ║
// ╚══════════════════════════════════════════════════════════════╝

export default function PlanificationPage() {
  const {
    loading,
    error,
    equipes,
    currentMonth,
    filtres,
    days,
    semaines,
    planifiees,
    planifiesFiltrees,
    nonPlanifiees,
    statsHebdo,
    chargesEquipes,
    conflits,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    setFiltres,
    planifierInstallation,
    editInstallation,
    terminerInstallation,
    reporterInstallation,
    ajouterEquipe,
    supprimerEquipe,
    fetchCommandes,
  } = usePlanification();

  // ── Modals ──
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNonPlanifiees, setShowNonPlanifiees] = useState(false);
  const [showEquipes, setShowEquipes] = useState(false);
  const [installationAPlanifier, setInstallationAPlanifier] =
    useState<CommandePlanification | null>(null);
  const [installationAEditer, setInstallationAEditer] =
    useState<CommandePlanification | null>(null);
  const [showChargePanel, setShowChargePanel] = useState(false);

  // ── Installations pour la date sélectionnée ──
  const installationsDate = useMemo(() => {
    if (!selectedDate) return [];
    return getInstallationsForDate(planifiesFiltrees, selectedDate, filtres);
  }, [selectedDate, planifiesFiltrees, filtres]);

  // ── Handlers ──
  const handleSelectDate = useCallback((d: Date) => setSelectedDate(d), []);

  const handlePlanifier = useCallback(
    (cmd: CommandePlanification) => {
      setShowNonPlanifiees(false);
      setInstallationAPlanifier(cmd);
    },
    []
  );

  const handleEditFromDetail = useCallback(
    (cmd: CommandePlanification) => {
      setSelectedDate(null);
      setInstallationAEditer(cmd);
    },
    []
  );

  const handleTerminerFromDetail = useCallback(
    async (cmdId: string, planifId?: string) => {
      if (!confirm("Marquer cette installation comme terminée?")) return;
      await terminerInstallation(cmdId, planifId);
    },
    [terminerInstallation]
  );

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-[2.5rem] h-[2.5rem] text-blue-500 animate-spin mx-auto mb-[0.75rem]" />
          <p className="text-[0.9375rem] text-slate-500">Chargement de la planification…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-[24rem]">
          <AlertCircle className="w-[2.5rem] h-[2.5rem] text-red-400 mx-auto mb-[0.75rem]" />
          <p className="text-[0.9375rem] text-red-600 font-medium mb-[0.5rem]">Erreur de chargement</p>
          <p className="text-[0.8125rem] text-slate-500 mb-[1rem]">{error}</p>
          <button
            onClick={fetchCommandes}
            className="px-[1rem] py-[0.5rem] bg-blue-500 text-white rounded-lg text-[0.875rem] font-medium hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[1rem] sm:space-y-[1.5rem] pb-[2rem]">
      {/* ══════════════════ Modals ══════════════════ */}
      {selectedDate && (
        <DateDetailModal
          date={selectedDate}
          installations={installationsDate}
          onClose={() => setSelectedDate(null)}
          onEdit={handleEditFromDetail}
          onTerminer={handleTerminerFromDetail}
        />
      )}
      {showNonPlanifiees && (
        <NonPlanifieesModal
          installations={nonPlanifiees}
          onPlanifier={handlePlanifier}
          onClose={() => setShowNonPlanifiees(false)}
        />
      )}
      {showEquipes && (
        <EquipesModal
          equipes={equipes}
          onAjouter={ajouterEquipe}
          onSupprimer={supprimerEquipe}
          onClose={() => setShowEquipes(false)}
        />
      )}
      {installationAPlanifier && (
        <PlanifierModal
          commande={installationAPlanifier}
          equipes={equipes}
          onPlanifier={planifierInstallation}
          onClose={() => setInstallationAPlanifier(null)}
        />
      )}
      {installationAEditer && (
        <EditInstallationModal
          commande={installationAEditer}
          equipes={equipes}
          onSave={editInstallation}
          onTerminer={terminerInstallation}
          onClose={() => setInstallationAEditer(null)}
        />
      )}

      {/* ══════════════════ Header ══════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-[0.75rem]">
        <div>
          <h1 className="text-[1.5rem] sm:text-[1.875rem] font-bold text-slate-800 flex items-center gap-[0.5rem]">
            <CalendarDays className="w-[1.5rem] h-[1.5rem] sm:w-[2rem] sm:h-[2rem] text-blue-500" />
            Planification
          </h1>
          <p className="text-[0.8125rem] sm:text-[0.875rem] text-slate-500 mt-[0.125rem]">
            Planifiez les installations et les mesures
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[0.5rem] sm:gap-[0.625rem]">
          {/* Résumé semaine */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-[0.75rem] sm:px-[1rem] py-[0.5rem] rounded-xl shadow-sm">
            <p className="text-[0.625rem] sm:text-[0.6875rem] opacity-80 font-medium">Cette semaine</p>
            <div className="flex items-center gap-[0.625rem] sm:gap-[1rem] text-[0.75rem] sm:text-[0.8125rem]">
              <span className="flex items-center gap-[0.25rem]">
                <Activity className="w-[0.75rem] h-[0.75rem]" />
                <strong>{statsHebdo.nbInstallations}</strong> inst.
              </span>
              <span className="flex items-center gap-[0.25rem]">
                <Clock className="w-[0.75rem] h-[0.75rem]" />
                <strong>{statsHebdo.heuresTotal}</strong>h
              </span>
              <span className="flex items-center gap-[0.25rem]">
                <Ruler className="w-[0.75rem] h-[0.75rem]" />
                <strong>{statsHebdo.piedsTotal}</strong> pi
              </span>
            </div>
          </div>

          {/* Boutons actions */}
          <button
            onClick={() => setShowChargePanel((p) => !p)}
            className={`flex items-center gap-[0.375rem] px-[0.625rem] sm:px-[0.75rem] py-[0.5rem] border rounded-xl text-[0.8125rem] transition-colors ${
              showChargePanel
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <BarChart3 className="w-[1rem] h-[1rem]" />
            <span className="hidden sm:inline">Charge</span>
            {conflits.length > 0 && (
              <span className="w-[1.125rem] h-[1.125rem] bg-red-500 text-white text-[0.5625rem] font-bold rounded-full flex items-center justify-center">
                {conflits.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowEquipes(true)}
            className="flex items-center gap-[0.375rem] px-[0.625rem] sm:px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-xl text-[0.8125rem] hover:bg-slate-50 transition-colors"
          >
            <Users className="w-[1rem] h-[1rem]" />
            <span className="hidden sm:inline">Équipes</span>
            <span className="bg-slate-200 text-slate-700 text-[0.625rem] font-bold px-[0.375rem] py-[0.0625rem] rounded-full">
              {equipes.length}
            </span>
          </button>

          <button
            onClick={fetchCommandes}
            className="p-[0.5rem] border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-[1rem] h-[1rem] text-slate-500" />
          </button>

          <button
            onClick={() => setShowNonPlanifiees(true)}
            className="flex items-center gap-[0.375rem] px-[0.75rem] sm:px-[1rem] py-[0.5rem] sm:py-[0.625rem] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-[0.8125rem] sm:text-[0.875rem]"
          >
            <CalendarPlus className="w-[1.125rem] h-[1.125rem]" />
            Non planifiées
            <span className="bg-white/80 text-slate-800 text-[0.6875rem] font-bold px-[0.375rem] py-[0.0625rem] rounded-full">
              {nonPlanifiees.length}
            </span>
          </button>
        </div>
      </div>

      {/* ══════════════════ Stats rapides mobile ══════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-[0.5rem] sm:gap-[0.625rem]">
        {[
          {
            icon: Activity,
            label: "Planifiées",
            value: planifiees.length,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: CalendarPlus,
            label: "Non planifiées",
            value: nonPlanifiees.length,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: Clock,
            label: "Heures sem.",
            value: `${statsHebdo.heuresTotal}h`,
            color: "text-slate-700",
            bg: "bg-slate-50",
          },
          {
            icon: Ruler,
            label: "Pi.lin. sem.",
            value: statsHebdo.piedsTotal,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            icon: Users,
            label: "Équipes actives",
            value: statsHebdo.nbEquipesActives,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            icon: Footprints,
            label: "Déplacements sem.",
            value: statsHebdo.nbDeplacements,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className={`${bg} rounded-xl p-[0.625rem] sm:p-[0.75rem] border border-slate-100`}
          >
            <div className="flex items-center gap-[0.375rem] mb-[0.25rem]">
              <Icon className={`w-[0.875rem] h-[0.875rem] ${color}`} />
              <span className="text-[0.625rem] sm:text-[0.6875rem] text-slate-500 font-medium">
                {label}
              </span>
            </div>
            <p className={`text-[1.125rem] sm:text-[1.375rem] font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════ Filtres ══════════════════ */}
      <PlanificationFiltres
        filtres={filtres}
        onChangeFiltres={setFiltres}
        equipes={equipes}
        semaines={semaines}
        nbNonPlanifiees={nonPlanifiees.length}
      />

      {/* ══════════════════ Layout principal ══════════════════ */}
      <div className={`grid gap-[1rem] ${showChargePanel ? "lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_22rem]" : "grid-cols-1"}`}>
        {/* Calendrier */}
        <PlanificationCalendrier
          days={days}
          currentMonth={currentMonth}
          planifiees={planifiesFiltrees}
          filtres={filtres}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onGoToday={goToToday}
          onSelectDate={handleSelectDate}
        />

        {/* Panneau latéral charge */}
        {showChargePanel && (
          <div className="hidden lg:block">
            <ChargeEquipesPanel charges={chargesEquipes} conflits={conflits} />
          </div>
        )}
      </div>

      {/* Charge panel mobile */}
      {showChargePanel && (
        <div className="lg:hidden">
          <ChargeEquipesPanel charges={chargesEquipes} conflits={conflits} />
        </div>
      )}

      {/* ══════════════════ Légende équipes ══════════════════ */}
      <div className="bg-white rounded-xl border border-slate-200 p-[0.75rem] sm:p-[1rem]">
        <p className="text-[0.6875rem] font-semibold text-slate-400 uppercase tracking-wider mb-[0.5rem]">
          Légende des équipes
        </p>
        <div className="flex flex-wrap gap-[0.375rem] sm:gap-[0.5rem]">
          {equipes.map((eq) => (
            <div
              key={eq.id}
              className="flex items-center gap-[0.25rem] text-[0.75rem] sm:text-[0.8125rem]"
            >
              <div className={`w-[0.75rem] h-[0.75rem] rounded ${eq.couleur}`} />
              <span className="text-slate-700 font-medium">{eq.nom}</span>
              {(eq.nbInstallations ?? 0) > 0 && (
                <span className="text-slate-400 text-[0.625rem]">
                  ({eq.nbInstallations})
                </span>
              )}
            </div>
          ))}
          {equipes.length === 0 && (
            <p className="text-[0.8125rem] text-slate-400">
              Aucune équipe —{" "}
              <button
                onClick={() => setShowEquipes(true)}
                className="text-blue-500 underline"
              >
                en créer une
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}