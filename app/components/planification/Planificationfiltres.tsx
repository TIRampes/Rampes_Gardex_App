"use client";

import { Search, Filter, SlidersHorizontal } from "lucide-react";
import type { FiltresPlanification, Equipe, SemaineDuMois } from "@/app/types/planification";

interface PlanificationFiltresProps {
  filtres: FiltresPlanification;
  onChangeFiltres: (f: FiltresPlanification) => void;
  equipes: Equipe[];
  semaines: SemaineDuMois[];
  nbNonPlanifiees: number;
}

export default function PlanificationFiltres({
  filtres,
  onChangeFiltres,
  equipes,
  semaines,
  nbNonPlanifiees,
}: PlanificationFiltresProps) {
  const update = (partial: Partial<FiltresPlanification>) =>
    onChangeFiltres({ ...filtres, ...partial });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-[0.75rem] sm:p-[1rem] flex flex-wrap items-center gap-[0.625rem] sm:gap-[1rem]">
      {/* Recherche */}
      <div className="relative flex-shrink-0">
        <Search className="absolute left-[0.625rem] top-1/2 -translate-y-1/2 w-[0.875rem] h-[0.875rem] text-slate-400" />
        <input
          type="text"
          value={filtres.recherche}
          onChange={(e) => update({ recherche: e.target.value })}
          placeholder="Rechercher..."
          className="pl-[2rem] pr-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] w-[9rem] sm:w-[12rem] focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none transition-colors"
        />
      </div>

      {/* Type */}
      <div className="flex items-center gap-[0.375rem]">
        <span className="text-[0.75rem] text-slate-500 font-medium hidden sm:inline">Type:</span>
        <select
          value={filtres.type}
          onChange={(e) => update({ type: e.target.value as FiltresPlanification["type"] })}
          className="px-[0.625rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] bg-white focus:ring-2 focus:ring-blue-300 outline-none"
        >
          <option value="tous">Tous types</option>
          <option value="installation">Installation</option>
          <option value="mesure">Mesure</option>
        </select>
      </div>

      {/* Type commande */}
      <div className="flex items-center gap-[0.375rem]">
        <span className="text-[0.75rem] text-slate-500 font-medium hidden sm:inline">Cmd:</span>
        <select
          value={filtres.typeCommande}
          onChange={(e) => update({ typeCommande: e.target.value as FiltresPlanification["typeCommande"] })}
          className="px-[0.625rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] bg-white focus:ring-2 focus:ring-blue-300 outline-none"
        >
          <option value="tous">Toutes</option>
          <option value="standard">Standard</option>
          <option value="commercial">Commercial</option>
          <option value="multiplan">Multiplan</option>
          <option value="multiphase">Multiphase</option>
        </select>
      </div>

      {/* Équipe */}
      <div className="flex items-center gap-[0.375rem]">
        <span className="text-[0.75rem] text-slate-500 font-medium hidden sm:inline">Équipe:</span>
        <select
          value={filtres.equipe}
          onChange={(e) => update({ equipe: e.target.value })}
          className="px-[0.625rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] bg-white focus:ring-2 focus:ring-blue-300 outline-none"
        >
          <option value="toutes">Toutes</option>
          {equipes.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.nom}</option>
          ))}
        </select>
      </div>

      {/* Semaine */}
      <div className="flex items-center gap-[0.375rem]">
        <span className="text-[0.75rem] text-slate-500 font-medium hidden lg:inline">Semaine:</span>
        <select
          value={filtres.semaine}
          onChange={(e) => update({ semaine: e.target.value })}
          className="px-[0.625rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] bg-white focus:ring-2 focus:ring-blue-300 outline-none"
        >
          <option value="toutes">Toutes</option>
          {semaines.map((s) => (
            <option key={s.num} value={s.num}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Badge non planifiées */}
      <div className="ml-auto">
        <span className="px-[0.625rem] py-[0.375rem] bg-green-500 text-white text-[0.75rem] font-semibold rounded-lg">
          {nbNonPlanifiees} prêtes à planifier
        </span>
      </div>
    </div>
  );
}