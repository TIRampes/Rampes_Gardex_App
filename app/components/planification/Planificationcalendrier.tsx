"use client";

import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { MONTH_NAMES, DAY_NAMES_SHORT} from "@/app/api/planification/schema";
import {
  formatDateKey,
  getInstallationsForDate,
  getTotalsForDate,
  depasseJournee,
} from "@/app/services/planification.service";
import type {
  DayInfo,
  CommandePlanification,
  FiltresPlanification,
} from "@/app/types/planification";

interface CalendrierProps {
  days: DayInfo[];
  currentMonth: Date;
  planifiees: CommandePlanification[];
  filtres: FiltresPlanification;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
  onSelectDate: (d: Date) => void;
}

export default function PlanificationCalendrier({
  days,
  currentMonth,
  planifiees,
  filtres,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onSelectDate,
}: CalendrierProps) {
  const todayKey = formatDateKey(new Date());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Navigation mois */}
      <div className="flex items-center justify-between p-[0.75rem] sm:p-[1rem] bg-slate-800 text-white">
        <button
          onClick={onPrevMonth}
          className="p-[0.5rem] hover:bg-slate-700 rounded-full transition-colors"
        >
          <ChevronLeft className="w-[1.5rem] h-[1.5rem] sm:w-[1.75rem] sm:h-[1.75rem]" />
        </button>
        <div className="text-center">
          <h2 className="text-[1.125rem] sm:text-[1.5rem] font-bold capitalize">
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={onGoToday}
            className="text-[0.6875rem] text-blue-300 hover:text-blue-200 font-medium mt-[0.125rem]"
          >
            Aujourd&apos;hui
          </button>
        </div>
        <button
          onClick={onNextMonth}
          className="p-[0.5rem] hover:bg-slate-700 rounded-full transition-colors"
        >
          <ChevronRight className="w-[1.5rem] h-[1.5rem] sm:w-[1.75rem] sm:h-[1.75rem]" />
        </button>
      </div>

      {/* En-têtes jours */}
      <div className="grid grid-cols-7 bg-slate-700 text-white">
        {DAY_NAMES_SHORT.map((jour) => (
          <div
            key={jour}
            className="p-[0.375rem] sm:p-[0.75rem] text-center border-r border-slate-600 last:border-r-0"
          >
            <p className="font-semibold uppercase text-[0.625rem] sm:text-[0.75rem]">{jour}</p>
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7">
        {days.map((dayInfo, idx) => {
          const installations = getInstallationsForDate(planifiees, dayInfo.date, filtres);
          const totals = getTotalsForDate(planifiees, dayInfo.date, filtres);
          const isWE = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;
          const isToday = formatDateKey(dayInfo.date) === todayKey && dayInfo.currentMonth;
          const hasInstalls = totals.count > 0 && dayInfo.currentMonth;
          const totalDepasse = depasseJournee(totals.tempsTotal);

          return (
            <div
              key={idx}
              onClick={() => hasInstalls && onSelectDate(dayInfo.date)}
              className={`
                min-h-[4.5rem] sm:min-h-[8.75rem] border-r border-b border-slate-200
                p-[0.25rem] sm:p-[0.5rem] transition-colors duration-150
                ${!dayInfo.currentMonth ? "bg-slate-100/50 text-slate-300" : isWE ? "bg-slate-50" : "bg-white"}
                ${hasInstalls ? "cursor-pointer hover:bg-blue-50/60" : ""}
                ${isToday ? "ring-2 ring-inset ring-blue-500" : ""}
              `}
            >
              {/* Numéro + badges */}
              <div className="flex items-start justify-between mb-[0.125rem]">
                <span
                  className={`
                    text-[0.8125rem] sm:text-[1.0625rem] font-bold
                    ${!dayInfo.currentMonth ? "text-slate-300" : ""}
                    ${isToday
                      ? "bg-blue-500 text-white w-[1.5rem] h-[1.5rem] sm:w-[2rem] sm:h-[2rem] rounded-full flex items-center justify-center text-[0.6875rem] sm:text-[0.8125rem]"
                      : ""}
                  `}
                >
                  {dayInfo.day}
                </span>
                {hasInstalls && (
                  <div className="flex items-center gap-[0.125rem]">
                    {totalDepasse && (
                      <AlertTriangle className="w-[0.75rem] h-[0.75rem] text-amber-500" />
                    )}
                    <span className="bg-slate-800 text-white text-[0.5625rem] font-bold px-[0.3125rem] py-[0.0625rem] rounded">
                      {totals.count}
                    </span>
                    <span className="bg-red-500 text-white text-[0.5625rem] font-bold px-[0.3125rem] py-[0.0625rem] rounded">
                      {totals.tempsTotal}h
                    </span>
                  </div>
                )}
              </div>

              {/* Installations du jour */}
              {dayInfo.currentMonth && (
                <div className="space-y-[0.125rem] hidden sm:block">
                  {installations.slice(0, 2).map((cmd) => {
                    const tempsH = cmd.tempsEstimeInstallation || 0;
                    const depasse = depasseJournee(tempsH);
                    const couleur = cmd.equipeCouleur || "bg-slate-400";

                    return (
                      <div
                        key={cmd.id}
                        className={`p-[0.25rem] sm:p-[0.375rem] rounded text-[0.5625rem] sm:text-[0.625rem] text-white relative ${couleur}`}
                      >
                        {depasse && (
                          <span className="absolute -top-[0.1875rem] -right-[0.1875rem] bg-amber-400 text-amber-900 text-[0.5rem] w-[0.875rem] h-[0.875rem] rounded-full flex items-center justify-center font-bold">
                            !
                          </span>
                        )}
                        <p className="font-bold truncate">{cmd.numero}</p>
                        <p className="truncate opacity-90 text-[0.5rem]">{cmd.clientNom}</p>
                        <div className="flex items-center justify-between mt-[0.0625rem] text-[0.5rem] opacity-75">
                          <span>{cmd.equipeNom?.replace("Équipe ", "") ?? "—"}</span>
                          <span>{tempsH}h · {cmd.piedsLineairesRampes}pi</span>
                        </div>
                      </div>
                    );
                  })}
                  {installations.length > 2 && (
                    <p className="text-[0.5625rem] text-blue-600 font-medium text-center">
                      +{installations.length - 2} autres
                    </p>
                  )}

                  {/* Résumé par équipe */}
                  {totals.count > 0 && Object.keys(totals.byEquipe).length > 0 && (
                    <div className="mt-[0.125rem] pt-[0.125rem] border-t border-slate-200 text-[0.5rem] text-slate-500 hidden lg:block">
                      {Object.values(totals.byEquipe)
                        .slice(0, 2)
                        .map((eq) => (
                          <div key={eq.equipeNom} className="flex justify-between">
                            <span>{eq.equipeNom.replace("Équipe ", "")}</span>
                            <span>
                              {eq.count} · {eq.heures}h
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile : nombre uniquement */}
              {hasInstalls && (
                <div className="sm:hidden mt-[0.25rem]">
                  <div className="bg-blue-500 text-white text-[0.5625rem] font-bold text-center py-[0.125rem] rounded">
                    {totals.count} inst.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}