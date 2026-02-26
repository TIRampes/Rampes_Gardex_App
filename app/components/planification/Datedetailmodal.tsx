"use client";

import { X, Edit3, CheckCircle2, AlertTriangle, Clock, Ruler, MapPin } from "lucide-react";
import { CODES_PRODUCTION_MAP, STATUTS_ACHAT_MAP } from "@/app/dashboard/production/schema";
import { formatDateLong, formatDateFr, depasseJournee } from "@/app/services/planification.service";
import type { CommandePlanification, Equipe } from "@/app/types/planification";
import { TYPE_COMMANDE_COLORS } from "@/app/api/planification/schema";

interface DateDetailModalProps {
  date: Date;
  installations: CommandePlanification[];
  onClose: () => void;
  onEdit: (cmd: CommandePlanification) => void;
  onTerminer: (cmdId: string, planifId?: string) => void;
}

function CodeBadge({ code, type }: { code: string | null; type: "prod" | "achat" }) {
  const map = type === "achat" ? STATUTS_ACHAT_MAP : CODES_PRODUCTION_MAP;
  const info = map[code ?? ""] ?? map[""];
  return (
    <span className={`px-[0.375rem] py-[0.0625rem] rounded font-bold text-[0.6875rem] ${info.bg} ${info.text}`}>
      {info.symbole}
    </span>
  );
}

export default function DateDetailModal({
  date,
  installations,
  onClose,
  onEdit,
  onTerminer,
}: DateDetailModalProps) {
  const totalTemps = installations.reduce((a, c) => a + (c.tempsEstimeInstallation || 0), 0);
  const totalPieds = installations.reduce((a, c) => a + (c.piedsLineairesRampes || 0), 0);
  const totalPoteaux = installations.reduce((a, c) => a + (c.nombrePoteaux || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] sm:p-[1rem]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[64rem] max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[0.75rem] sm:p-[1.25rem] border-b bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <div>
            <h2 className="text-[1rem] sm:text-[1.25rem] font-bold capitalize">{formatDateLong(date)}</h2>
            <p className="text-[0.75rem] text-slate-300 mt-[0.125rem]">{installations.length} installation(s) planifiée(s)</p>
          </div>
          <button onClick={onClose} className="p-[0.375rem] hover:bg-slate-600 rounded-lg transition-colors">
            <X className="w-[1.25rem] h-[1.25rem]" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-[0.75rem] sm:p-[1rem] space-y-[0.75rem] sm:space-y-[1rem]">
          {installations.length === 0 ? (
            <div className="text-center py-[4rem] text-slate-400">
              <Clock className="w-[3rem] h-[3rem] mx-auto mb-[0.75rem] opacity-30" />
              <p className="text-[1rem]">Aucune installation pour cette date</p>
            </div>
          ) : (
            installations.map((cmd) => {
              const tempsH = cmd.tempsEstimeInstallation || 0;
              const depasse = depasseJournee(tempsH);
              const couleur = cmd.equipeCouleur || "bg-slate-400";
              const typeColors = TYPE_COMMANDE_COLORS[cmd.typeCommande] ?? TYPE_COMMANDE_COLORS.STANDARD;

              return (
                <div key={cmd.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* En-tête commande */}
                  <div className="p-[0.75rem] sm:p-[1rem] border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-[0.5rem]">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-[0.375rem] sm:gap-[0.5rem] mb-[0.375rem]">
                          <span className="font-mono font-bold text-[1rem] sm:text-[1.25rem] text-slate-800">{cmd.numero}</span>
                          {cmd.reprise && (
                            <span className="px-[0.5rem] py-[0.125rem] bg-orange-500 text-white text-[0.6875rem] font-bold rounded">Reprise</span>
                          )}
                          <span className="px-[0.5rem] py-[0.125rem] bg-red-600 text-white text-[0.6875rem] font-bold rounded">Installation</span>
                          <span className={`px-[0.5rem] py-[0.125rem] ${typeColors.bg} ${typeColors.text} text-[0.6875rem] font-bold rounded`}>
                            {cmd.typeCommande}
                          </span>
                        </div>
                        <p className="font-semibold text-[0.9375rem] sm:text-[1.0625rem] text-slate-800">{cmd.clientNom}</p>
                        {cmd.reference && <p className="text-[0.8125rem] text-slate-500">{cmd.reference}</p>}
                        <p className="text-[0.8125rem] text-slate-500 flex items-center gap-[0.25rem] mt-[0.25rem]">
                          <MapPin className="w-[0.75rem] h-[0.75rem]" />{cmd.adresse}
                        </p>
                        {cmd.commentaire && (
                          <div className="mt-[0.5rem] p-[0.625rem] bg-slate-50 rounded-lg border text-[0.8125rem]">
                            {cmd.commentaire.split("\n").map((line, i) => (
                              <p key={i} className={line.includes("***") ? "text-red-600 font-semibold" : "text-slate-600"}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Dates & actions */}
                      <div className="flex flex-col items-end gap-[0.375rem]">
                        <div className="flex flex-wrap gap-[0.375rem]">
                          <span className="text-[0.75rem] bg-slate-200 px-[0.5rem] py-[0.25rem] rounded">{formatDateFr(cmd.dateEntree)}</span>
                          <span className="text-[0.75rem] bg-green-100 text-green-800 px-[0.5rem] py-[0.25rem] rounded">
                            📅 {formatDateFr(cmd.datePrevue)}
                          </span>
                        </div>
                        {depasse && (
                          <span className="text-[0.75rem] bg-amber-100 text-amber-800 px-[0.5rem] py-[0.25rem] rounded flex items-center gap-[0.25rem]">
                            <AlertTriangle className="w-[0.75rem] h-[0.75rem]" /> Dépasse 8h
                          </span>
                        )}
                        <div className="flex gap-[0.375rem] mt-[0.25rem]">
                          <button onClick={() => onEdit(cmd)} className="p-[0.375rem] hover:bg-slate-100 rounded-lg transition-colors" title="Modifier">
                            <Edit3 className="w-[1rem] h-[1rem] text-slate-500" />
                          </button>
                          <button onClick={() => onTerminer(cmd.id, cmd.planificationId ?? undefined)} className="p-[0.375rem] hover:bg-emerald-50 rounded-lg transition-colors" title="Terminer">
                            <CheckCircle2 className="w-[1rem] h-[1rem] text-emerald-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statuts production & achats */}
                  <div className="p-[0.75rem] sm:p-[1rem] grid grid-cols-1 sm:grid-cols-2 gap-[0.75rem] sm:gap-[1rem]">
                    <div className="space-y-[0.375rem]">
                      <p className="text-[0.6875rem] font-semibold text-slate-400 uppercase tracking-wider">Production</p>
                      {[
                        { label: "Mesure", val: cmd.mesure },
                        { label: "Plan", val: cmd.plan },
                        { label: "Envoyé prod.", val: cmd.envoyeProduction },
                        { label: "Prod. terminée", val: cmd.productionTerminee },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-[0.5rem] text-[0.8125rem]">
                          <span className="text-slate-500 w-[7rem]">{item.label}:</span>
                          <CodeBadge code={item.val} type="prod" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-[0.375rem]">
                      <p className="text-[0.6875rem] font-semibold text-slate-400 uppercase tracking-wider">Achats</p>
                      {[
                        { label: "Verre", val: cmd.achatVerres },
                        { label: "Limon", val: cmd.achatLimons },
                        { label: "Peinture", val: cmd.achatPeinture },
                        { label: "Colonne", val: cmd.achatColonnes },
                        { label: "Fibre", val: cmd.achatFibre },
                        { label: "Attaches", val: cmd.achatAttaches },
                        { label: "Plancher", val: cmd.achatPlancherAluminium },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-[0.5rem] text-[0.8125rem]">
                          <span className="text-slate-500 w-[5rem]">{item.label}:</span>
                          <CodeBadge code={item.val} type="achat" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer métriques */}
                  <div className="p-[0.75rem] sm:p-[1rem] bg-slate-50 border-t flex flex-wrap items-center gap-[0.75rem]">
                    <div className={`px-[0.75rem] py-[0.375rem] rounded-lg text-white text-[0.8125rem] font-semibold ${couleur}`}>
                      {cmd.equipeNom ?? "Non assigné"}
                    </div>
                    <div className="text-[0.8125rem]">
                      <span className="text-slate-500">Pieds lin.:</span>
                      <span className="font-bold ml-[0.25rem]">{cmd.piedsLineairesRampes}</span>
                    </div>
                    <div className="text-[0.8125rem]">
                      <span className="text-slate-500">Poteaux:</span>
                      <span className="font-bold ml-[0.25rem]">{cmd.nombrePoteaux}</span>
                    </div>
                    <div className="text-[0.8125rem]">
                      <span className="text-slate-500">Temps:</span>
                      <span className="font-bold ml-[0.25rem]">{tempsH}h</span>
                    </div>
                    <div className="text-[0.8125rem]">
                      <span className="text-slate-500">Couleur:</span>
                      <span className="font-bold ml-[0.25rem]">{cmd.couleur ?? "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer résumé */}
        <div className="border-t-4 border-blue-500 p-[0.75rem] sm:p-[1rem] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[0.75rem]">
          <button onClick={onClose} className="px-[1.25rem] sm:px-[1.5rem] py-[0.625rem] sm:py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors">
            Fermer
          </button>
          <div className="flex flex-wrap items-center gap-[0.75rem] sm:gap-[1.25rem]">
            <div className="border-2 border-blue-500 px-[0.75rem] py-[0.375rem] rounded-lg">
              <p className="text-[0.6875rem] text-slate-500">Temps total</p>
              <p className="text-[1.125rem] font-bold">{totalTemps}h</p>
            </div>
            <div className="border-2 border-blue-500 px-[0.75rem] py-[0.375rem] rounded-lg">
              <p className="text-[0.6875rem] text-slate-500">Pieds linéaires</p>
              <p className="text-[1.125rem] font-bold">{totalPieds}</p>
            </div>
            <div className="border-2 border-blue-500 px-[0.75rem] py-[0.375rem] rounded-lg">
              <p className="text-[0.6875rem] text-slate-500">Poteaux</p>
              <p className="text-[1.125rem] font-bold">{totalPoteaux}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}