"use client";

import { AlertTriangle, AlertCircle, Info, TrendingUp, Users, Clock } from "lucide-react";
import { HEURES_PAR_JOUR } from "@/app/api/planification/schema";
import type { ChargeEquipeSemaine, ConflitPlanification } from "@/app/types/planification";

// ══════════════════════════════════════════
// Panneau charge d'équipe
// ══════════════════════════════════════════

interface ChargeEquipesProps {
  charges: ChargeEquipeSemaine[];
  conflits: ConflitPlanification[];
}

export default function ChargeEquipesPanel({ charges, conflits }: ChargeEquipesProps) {
  const confErrors = conflits.filter((c) => c.severite === "ERROR");
  const confWarnings = conflits.filter((c) => c.severite === "WARNING");
  const confInfos = conflits.filter((c) => c.severite === "INFO");

  return (
    <div className="space-y-[0.75rem] sm:space-y-[1rem]">
      {/* Alertes conflits */}
      {conflits.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-[0.75rem] sm:p-[1rem]">
          <h3 className="text-[0.8125rem] font-bold text-slate-700 mb-[0.5rem] flex items-center gap-[0.375rem]">
            <AlertTriangle className="w-[0.875rem] h-[0.875rem] text-amber-500" />
            Alertes ({conflits.length})
          </h3>
          <div className="space-y-[0.375rem] max-h-[10rem] overflow-y-auto">
            {confErrors.map((c, i) => (
              <div key={`e-${i}`} className="flex items-start gap-[0.375rem] text-[0.8125rem] p-[0.375rem] bg-red-50 rounded-lg">
                <AlertCircle className="w-[0.875rem] h-[0.875rem] text-red-500 mt-[0.125rem] flex-shrink-0" />
                <span className="text-red-700">{c.message}</span>
              </div>
            ))}
            {confWarnings.map((c, i) => (
              <div key={`w-${i}`} className="flex items-start gap-[0.375rem] text-[0.8125rem] p-[0.375rem] bg-amber-50 rounded-lg">
                <AlertTriangle className="w-[0.875rem] h-[0.875rem] text-amber-500 mt-[0.125rem] flex-shrink-0" />
                <span className="text-amber-700">{c.message}</span>
              </div>
            ))}
            {confInfos.slice(0, 3).map((c, i) => (
              <div key={`i-${i}`} className="flex items-start gap-[0.375rem] text-[0.8125rem] p-[0.375rem] bg-blue-50 rounded-lg">
                <Info className="w-[0.875rem] h-[0.875rem] text-blue-500 mt-[0.125rem] flex-shrink-0" />
                <span className="text-blue-700">{c.message}</span>
              </div>
            ))}
            {confInfos.length > 3 && (
              <p className="text-[0.75rem] text-slate-400 text-center">+{confInfos.length - 3} autres</p>
            )}
          </div>
        </div>
      )}

      {/* Charge par équipe */}
      <div className="bg-white rounded-xl border border-slate-200 p-[0.75rem] sm:p-[1rem]">
        <h3 className="text-[0.8125rem] font-bold text-slate-700 mb-[0.75rem] flex items-center gap-[0.375rem]">
          <TrendingUp className="w-[0.875rem] h-[0.875rem] text-blue-500" />
          Charge des équipes — cette semaine
        </h3>

        {charges.length === 0 ? (
          <p className="text-[0.8125rem] text-slate-400 text-center py-[1.5rem]">Aucune équipe configurée</p>
        ) : (
          <div className="space-y-[0.875rem]">
            {charges.map((charge) => (
              <div key={charge.equipeId} className="space-y-[0.375rem]">
                {/* En-tête équipe */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[0.375rem]">
                    <div className={`w-[0.625rem] h-[0.625rem] rounded-full ${charge.couleur}`} />
                    <span className="text-[0.8125rem] font-semibold text-slate-700">{charge.equipeNom}</span>
                  </div>
                  <div className="flex items-center gap-[0.5rem] text-[0.75rem]">
                    <span className="text-slate-500 flex items-center gap-[0.125rem]">
                      <Users className="w-[0.625rem] h-[0.625rem]" />
                      {charge.totalInstallations}
                    </span>
                    <span className="text-slate-500 flex items-center gap-[0.125rem]">
                      <Clock className="w-[0.625rem] h-[0.625rem]" />
                      {charge.totalHeures}h
                    </span>
                    <span
                      className={`font-bold px-[0.375rem] py-[0.0625rem] rounded text-[0.6875rem] ${
                        charge.tauxOccupation > 100
                          ? "bg-red-100 text-red-700"
                          : charge.tauxOccupation > 80
                          ? "bg-amber-100 text-amber-700"
                          : charge.tauxOccupation > 50
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {charge.tauxOccupation}%
                    </span>
                  </div>
                </div>

                {/* Barres par jour */}
                <div className="grid grid-cols-5 gap-[0.25rem]">
                  {charge.jours.map((jour) => {
                    const pct = Math.min((jour.heures / HEURES_PAR_JOUR) * 100, 100);
                    const overflow = jour.heures > HEURES_PAR_JOUR;
                    const overflowPct = overflow
                      ? Math.min(((jour.heures - HEURES_PAR_JOUR) / HEURES_PAR_JOUR) * 100, 100)
                      : 0;

                    return (
                      <div key={jour.date} className="text-center">
                        <p className="text-[0.625rem] text-slate-400 uppercase font-medium mb-[0.125rem]">
                          {jour.jourSemaine}
                        </p>
                        <div className="relative h-[2.5rem] bg-slate-100 rounded overflow-hidden">
                          {/* Barre normale */}
                          <div
                            className={`absolute bottom-0 left-0 right-0 rounded transition-all ${
                              overflow ? "bg-red-400" : charge.couleur.replace("bg-", "bg-")
                            }`}
                            style={{ height: `${pct}%` }}
                          />
                          {/* Overflow */}
                          {overflow && (
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-red-600 rounded-t opacity-60"
                              style={{ height: `${overflowPct}%` }}
                            />
                          )}
                          {/* Ligne 8h */}
                          <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-slate-400/50" style={{ bottom: "100%" }} />
                        </div>
                        <p className={`text-[0.5625rem] font-bold mt-[0.0625rem] ${overflow ? "text-red-600" : "text-slate-600"}`}>
                          {jour.heures > 0 ? `${jour.heures}h` : "—"}
                        </p>
                        {jour.nbInstallations > 0 && (
                          <p className="text-[0.5rem] text-slate-400">
                            {jour.nbInstallations} inst.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}