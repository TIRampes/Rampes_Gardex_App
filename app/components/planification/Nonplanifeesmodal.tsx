"use client";

import { X, CheckCircle, Clock, Ruler, AlertTriangle, CalendarPlus } from "lucide-react";
import { calculerJoursNecessaires } from "@/app/services/planification.service";
import { TYPE_COMMANDE_COLORS } from "@/app/api/planification/schema";
import type { CommandePlanification } from "@/app/types/planification";

interface NonPlanifieesModalProps {
  installations: CommandePlanification[];
  onPlanifier: (cmd: CommandePlanification) => void;
  onClose: () => void;
}

export default function NonPlanifieesModal({
  installations,
  onPlanifier,
  onClose,
}: NonPlanifieesModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] sm:p-[1rem]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[64rem] max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[0.75rem] sm:p-[1rem] border-b bg-amber-500 text-white">
          <div>
            <h2 className="text-[1rem] sm:text-[1.25rem] font-bold">Installations non planifiées</h2>
            <p className="text-[0.8125rem] opacity-90">{installations.length} installation(s) en attente de planification</p>
          </div>
          <button onClick={onClose} className="p-[0.375rem] hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-[1.25rem] h-[1.25rem]" />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-auto p-[0.75rem] sm:p-[1rem] space-y-[0.75rem]">
          {installations.length === 0 ? (
            <div className="text-center py-[4rem] text-slate-500">
              <CheckCircle className="w-[3rem] h-[3rem] mx-auto mb-[0.75rem] opacity-30" />
              <p className="text-[1rem] font-medium">Toutes les installations sont planifiées!</p>
            </div>
          ) : (
            installations.map((cmd) => {
              const jours = calculerJoursNecessaires(cmd.tempsEstimeInstallation);
              const typeColors = TYPE_COMMANDE_COLORS[cmd.typeCommande] ?? TYPE_COMMANDE_COLORS.STANDARD;

              return (
                <div key={cmd.id} className="border border-slate-200 rounded-xl p-[0.75rem] sm:p-[1rem] hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-[0.75rem]">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-[0.375rem] mb-[0.375rem]">
                        <span className="font-mono font-bold text-[1rem] sm:text-[1.125rem]">{cmd.numero}</span>
                        <span className={`px-[0.5rem] py-[0.125rem] text-[0.6875rem] font-bold rounded ${typeColors.bg} ${typeColors.text}`}>
                          {cmd.typeCommande}
                        </span>
                        <span className="px-[0.5rem] py-[0.125rem] bg-red-600 text-white text-[0.6875rem] font-bold rounded">
                          {cmd.service === "INSTALLATION" ? "Installation" : cmd.service}
                        </span>
                      </div>
                      <p className="font-semibold text-[0.9375rem] text-slate-800">{cmd.clientNom}</p>
                      <p className="text-[0.8125rem] text-slate-500">{cmd.adresse}</p>

                      <div className="flex flex-wrap items-center gap-[0.5rem] mt-[0.5rem]">
                        <div className="bg-blue-100 px-[0.625rem] py-[0.25rem] rounded text-[0.8125rem] flex items-center gap-[0.25rem]">
                          <Clock className="w-[0.75rem] h-[0.75rem] text-blue-600" />
                          <span className="text-blue-700">Temps:</span>
                          <strong className="text-blue-800">{cmd.tempsEstimeInstallation || 0}h</strong>
                        </div>
                        <div className="bg-emerald-100 px-[0.625rem] py-[0.25rem] rounded text-[0.8125rem] flex items-center gap-[0.25rem]">
                          <Ruler className="w-[0.75rem] h-[0.75rem] text-emerald-600" />
                          <span className="text-emerald-700">Pi.lin.:</span>
                          <strong className="text-emerald-800">{cmd.piedsLineairesRampes}</strong>
                        </div>
                        {jours > 1 && (
                          <div className="bg-amber-100 px-[0.625rem] py-[0.25rem] rounded text-[0.8125rem] flex items-center gap-[0.25rem]">
                            <AlertTriangle className="w-[0.75rem] h-[0.75rem] text-amber-600" />
                            <span className="text-amber-700">{jours} jours</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-[0.5rem]">
                      <button
                        onClick={() => onPlanifier(cmd)}
                        className="flex items-center gap-[0.375rem] px-[0.75rem] sm:px-[1rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-[0.875rem] transition-colors"
                      >
                        <CalendarPlus className="w-[1rem] h-[1rem]" />
                        Planifier
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-[0.75rem] sm:p-[1rem] border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-[1.25rem] py-[0.625rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-[0.875rem] transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}