// ============================================================
// components/MultiLogementsClient.tsx
// Composant client — Liste des commandes multi-logements
// ============================================================
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CommandeMulti, CommandeMultiListResponse } from "@/app/api/multilogements/schema";

// ─── Icônes SVG inline ──────────────────────────────────────
const Icon = ({ name, size = 20 }: { name: string; size?: number }) => {
  const paths: Record<string, React.ReactNode> = {
    building: (
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    search: <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    check: <path d="M5 13l4 4L19 7" />,
    clock: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    trend: <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    right: <path d="M9 5l7 7-7 7" />,
    factory: (
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    calendar: (
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    map: (
      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    ),
    users: (
      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    ),
    alert: (
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
    refresh: (
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    ),
    loader: (
      <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" />
    ),
  };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || null}
    </svg>
  );
};

// ─── Barre de progression ───────────────────────────────────
const ProgressBar = ({
  pct,
  height = "h-2.5",
  couleurBarre,
}: {
  pct: number;
  height?: string;
  couleurBarre?: string;
}) => {
  const couleur =
    couleurBarre ||
    (pct === 100
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 30
          ? "bg-amber-500"
          : "bg-red-400");
  return (
    <div className={`w-full ${height} bg-slate-200 rounded-full overflow-hidden`}>
      <div
        className={`${height} ${couleur} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
};

// ─── Utilitaires ────────────────────────────────────────────
const formaterDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("fr-CA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

const formaterDateCourte = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("fr-CA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const getTypeLabel = (t: string) => {
  switch (t) {
    case "COMMERCIAL":
      return "Commercial";
    case "MULTI_PHASE":
      return "Multi-phase";
    case "MULTIPLAN":
      return "Multi-plan";
    default:
      return t;
  }
};

const getTypeBadgeColor = (t: string) => {
  switch (t) {
    case "COMMERCIAL":
      return "bg-blue-500 text-white";
    case "MULTI_PHASE":
      return "bg-purple-500 text-white";
    case "MULTIPLAN":
      return "bg-teal-500 text-white";
    default:
      return "bg-slate-500 text-white";
  }
};

const getStatutCouleur = (s: string) => {
  switch (s) {
    case "ACTIVE":
      return "bg-blue-100 text-blue-800";
    case "EN_ATTENTE":
      return "bg-amber-100 text-amber-800";
    case "COMPLETEE":
      return "bg-emerald-100 text-emerald-800";
    case "ANNULEE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getStatutLabel = (s: string) => {
  switch (s) {
    case "ACTIVE":
      return "Active";
    case "EN_ATTENTE":
      return "En attente";
    case "COMPLETEE":
      return "Complétée";
    case "ANNULEE":
      return "Annulée";
    default:
      return s;
  }
};

const getCodeProdLabel = (code: string | null | undefined) => {
  if (!code) return { label: "—", color: "bg-slate-100 text-slate-500" };
  switch (code) {
    case "COMPLETE":
      return { label: "√", color: "bg-emerald-500 text-white" };
    case "ATTENTE_CLIENT":
      return { label: "At.C", color: "bg-yellow-100 text-yellow-700" };
    case "NON_APPLICABLE":
      return { label: "N/A", color: "bg-slate-200 text-slate-600" };
    case "PARTIEL":
      return { label: "P", color: "bg-blue-100 text-blue-700" };
    case "DOSSIER_MESUREUR":
      return { label: "D", color: "bg-indigo-100 text-indigo-700" };
    case "MODIFICATION":
      return { label: "M", color: "bg-orange-100 text-orange-700" };
    case "ATTENTE_CAROL_CONFIRM":
      return { label: "C-C", color: "bg-pink-100 text-pink-700" };
    case "ATTENTE_CAROL_MESURE":
      return { label: "C-RM", color: "bg-rose-100 text-rose-700" };
    case "BACK_ORDER":
      return { label: "B/O", color: "bg-amber-100 text-amber-700" };
    case "ATTENTE_REPRESENTANT":
      return { label: "At. Rep", color: "bg-cyan-100 text-cyan-700" };
    default:
      return { label: code, color: "bg-slate-100 text-slate-500" };
  }
};

// ─── Progression d'une commande ─────────────────────────────
function getProgression(cmd: CommandeMulti) {
  const total = cmd.balcons.length;
  const completes = cmd.balcons.filter((b) => b.installationTerminee).length;
  return {
    total,
    completes,
    pct: total > 0 ? Math.round((completes / total) * 100) : 0,
  };
}

function getTotalPiedsLin(cmd: CommandeMulti) {
  return cmd.balcons.reduce((s, b) => s + b.piedsLineaires, 0);
}

function getTotalPoteaux(cmd: CommandeMulti) {
  return cmd.balcons.reduce((s, b) => s + b.poteaux, 0);
}

function getPhases(cmd: CommandeMulti) {
  if (cmd.typeCommande === "COMMERCIAL") return null;
  const map = new Map<
    number,
    { phase: number; balcons: typeof cmd.balcons }
  >();
  for (const b of cmd.balcons) {
    const p = b.numeroPhase ?? 0;
    if (!map.has(p)) map.set(p, { phase: p, balcons: [] });
    map.get(p)!.balcons.push(b);
  }
  return Array.from(map.values()).sort((a, b) => a.phase - b.phase);
}

// ─── Étapes de production d'un balcon ───────────────────────
function getEtapesBalcon(b: any) {
  return [
    { label: "Mesure", code: b.mesure },
    { label: "Plan", code: b.plan },
    { label: "Production", code: b.envoyeProduction },
    { label: "Terminé", code: b.termine },
    { label: "Installation", code: b.installation },
  ];
}

// =============================================================
// COMPOSANT PRINCIPAL
// =============================================================
export default function MultiLogementsClient() {
  const router = useRouter();

  // ─── States ─────────────────────────────────────────────
  const [commandes, setCommandes] = useState<CommandeMulti[]>([]);
  const [stats, setStats] = useState({
    totalCommandes: 0,
    commandesCommercial: 0,
    commandesMultiPhase: 0,
    commandesMultiPlan: 0,
    totalBalcons: 0,
    balconsCompletes: 0,
    totalPiedsLineaires: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [onglet, setOnglet] = useState<"actifs" | "historique">("actifs");
  const [filtreType, setFiltreType] = useState("tous");
  const [recherche, setRecherche] = useState("");

  // Détail inline
  const [selectedCmd, setSelectedCmd] = useState<CommandeMulti | null>(null);

  // ─── Fetch ──────────────────────────────────────────────
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtreType !== "tous") params.set("type", filtreType);
      if (recherche) params.set("recherche", recherche);

      const res = await fetch(`/api/multilogements?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data: CommandeMultiListResponse = await res.json();
      setCommandes(data.commandes);
      setStats(data.stats);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtreType, recherche]);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  // ─── Filtrage local par onglet ──────────────────────────
  const commandesFiltrees = useMemo(() => {
    return commandes.filter((c) => {
      if (onglet === "actifs") return c.statut === "ACTIVE" || c.statut === "EN_ATTENTE";
      return c.statut === "COMPLETEE" || c.statut === "ANNULEE";
    });
  }, [commandes, onglet]);

  const countActifs = commandes.filter(
    (c) => c.statut === "ACTIVE" || c.statut === "EN_ATTENTE"
  ).length;
  const countHistorique = commandes.filter(
    (c) => c.statut === "COMPLETEE" || c.statut === "ANNULEE"
  ).length;

  // ─── Skeleton loader ───────────────────────────────────
  const CardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 bg-slate-200 rounded" />
        <div className="h-5 w-16 bg-slate-200 rounded-full" />
      </div>
      <div className="h-6 w-3/4 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-slate-200 rounded mb-4" />
      <div className="h-2.5 w-full bg-slate-200 rounded-full mb-4" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );

  // ─── Carte Commande ────────────────────────────────────
  const CarteCommande = ({ cmd }: { cmd: CommandeMulti }) => {
    const prog = getProgression(cmd);
    const phases = getPhases(cmd);
    const phaseEnCours = phases?.find((p) =>
      p.balcons.some((b) => !b.installationTerminee)
    );

    return (
      <div
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => setSelectedCmd(selectedCmd?.id === cmd.id ? null : cmd)}
      >
        {/* En-tête */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${getTypeBadgeColor(cmd.typeCommande)}`}
                >
                  {getTypeLabel(cmd.typeCommande)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatutCouleur(cmd.statut)}`}
                >
                  {getStatutLabel(cmd.statut)}
                </span>
                <span className="text-xs text-slate-400">#{cmd.numero}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-800 truncate">
                {cmd.client.nom}
              </h2>
              <p className="text-slate-500 text-sm truncate">
                {cmd.reference || cmd.adresse}
                {cmd.client.ville ? ` • ${cmd.client.ville}` : ""}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-sm text-slate-500">Progression</p>
              <p className="text-3xl font-bold text-amber-600">
                {prog.completes}
                <span className="text-lg text-slate-400">/{prog.total}</span>
              </p>
              <p className="text-xs text-slate-400">{prog.pct}%</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-3">
            <ProgressBar pct={prog.pct} />
          </div>

          {/* Phase actuelle (multi-phase / multi-plan) */}
          {phaseEnCours && (
            <div className="mt-3 bg-purple-50 rounded-lg p-2 flex items-center gap-2 flex-wrap">
              <span className="text-purple-600 text-xs font-bold">
                Phase actuelle :
              </span>
              <span className="text-sm font-semibold text-purple-800">
                Phase {phaseEnCours.phase}
              </span>
              <span className="text-xs text-purple-500">
                ({phaseEnCours.balcons.filter((b) => b.installationTerminee).length}/
                {phaseEnCours.balcons.length} complétés)
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Icon name="calendar" size={12} />
              Entrée : {formaterDateCourte(cmd.dateEntree)}
            </span>
            {cmd.datePrevue && (
              <span className="flex items-center gap-1">
                <Icon name="clock" size={12} />
                Prévue : {formaterDateCourte(cmd.datePrevue)}
              </span>
            )}
          </div>
        </div>

        {/* Statistiques en pied */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 text-center py-3 text-xs">
          <div>
            <p className="text-slate-400">Balcons</p>
            <p className="font-bold text-slate-800">{cmd.balcons.length}</p>
          </div>
          <div>
            <p className="text-slate-400">Pieds lin.</p>
            <p className="font-bold text-slate-800">
              {getTotalPiedsLin(cmd).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Poteaux</p>
            <p className="font-bold text-slate-800">{getTotalPoteaux(cmd)}</p>
          </div>
          <div>
            <p className="text-slate-400">En production</p>
            <p className="font-bold text-slate-800">
              {cmd.enProduction ? "✓" : "—"}
            </p>
          </div>
        </div>

        {/* Flèche détail */}
        <div className="bg-slate-50 px-5 py-2 flex items-center justify-end text-slate-400 group-hover:text-amber-600 transition-colors">
          <span className="text-xs font-medium mr-1">Voir le détail</span>
          <Icon name="right" size={14} />
        </div>
      </div>
    );
  };

  // ─── Panneau détail inline ─────────────────────────────
  const PanneauDetail = ({ cmd }: { cmd: CommandeMulti }) => {
    const prog = getProgression(cmd);
    const phases = getPhases(cmd);

    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 overflow-hidden col-span-1 lg:col-span-2">
        {/* Header détail */}
        <div className="p-5 bg-slate-800 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${getTypeBadgeColor(cmd.typeCommande)}`}
                >
                  {getTypeLabel(cmd.typeCommande)}
                </span>
                <span className="text-slate-300">#{cmd.numero}</span>
              </div>
              <h2 className="text-xl font-bold">{cmd.client.nom}</h2>
              <p className="text-slate-300 text-sm">
                {cmd.reference || cmd.adresse}
                {cmd.client.ville ? ` • ${cmd.client.ville}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-amber-400">{prog.pct}%</p>
              <p className="text-slate-400 text-sm">
                {prog.completes}/{prog.total} balcons
              </p>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar pct={prog.pct} height="h-4" />
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="p-5 border-b border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Pieds linéaires</p>
              <p className="text-xl font-bold">
                {getTotalPiedsLin(cmd).toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Poteaux</p>
              <p className="text-xl font-bold">{getTotalPoteaux(cmd)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Représentant</p>
              <p className="text-sm font-bold truncate">
                {cmd.representant?.nom || "—"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Date entrée</p>
              <p className="text-sm font-bold">
                {formaterDateCourte(cmd.dateEntree)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Date prévue</p>
              <p className="text-sm font-bold">
                {formaterDateCourte(cmd.datePrevue)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Prix total</p>
              <p className="text-sm font-bold">
                {Number(cmd.prixTotal).toLocaleString("fr-CA", {
                  style: "currency",
                  currency: "CAD",
                })}
              </p>
            </div>
          </div>

          {/* Codes de production globaux de la commande */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">
              Progression globale de la commande
            </h4>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: "Mesure", code: cmd.mesure },
                { label: "Plan", code: cmd.plan },
                { label: "Production", code: cmd.envoyeProduction },
                { label: "Prod. terminée", code: cmd.productionTerminee },
                { label: "Terminé", code: cmd.termine },
                { label: "Installation", code: cmd.installation },
              ].map((etape) => {
                const info = getCodeProdLabel(etape.code);
                return (
                  <div
                    key={etape.label}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <span className="text-[10px] text-slate-400 font-medium">
                      {etape.label}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${info.color}`}
                    >
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {cmd.commentaire && (
            <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm text-slate-700">{cmd.commentaire}</p>
            </div>
          )}
        </div>

        {/* === COMMERCIAL : Liste plate des balcons === */}
        {cmd.typeCommande === "COMMERCIAL" && (
          <div className="p-5">
            <h3 className="font-bold text-slate-800 text-lg mb-3">
              Balcons / Plans ({cmd.balcons.length})
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {cmd.balcons.map((bal) => (
                <LigneBalcon key={bal.id} bal={bal} />
              ))}
              {cmd.balcons.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  Aucun balcon enregistré
                </div>
              )}
            </div>
          </div>
        )}

        {/* === MULTI-PHASE / MULTI-PLAN : Par phases === */}
        {(cmd.typeCommande === "MULTI_PHASE" ||
          cmd.typeCommande === "MULTIPLAN") &&
          phases && (
            <div className="p-5 space-y-5">
              <h3 className="font-bold text-slate-800 text-lg">
                Phases du projet ({phases.length})
              </h3>

              {/* Timeline horizontale */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {phases.map((ph, i) => {
                  const completedInPhase = ph.balcons.filter(
                    (b) => b.installationTerminee
                  ).length;
                  const totalInPhase = ph.balcons.length;
                  const phPct =
                    totalInPhase > 0
                      ? Math.round((completedInPhase / totalInPhase) * 100)
                      : 0;
                  const isComplete = phPct === 100;
                  const isEnCours =
                    completedInPhase > 0 && completedInPhase < totalInPhase;

                  return (
                    <div key={ph.phase} className="flex items-center">
                      <div
                        className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 text-center min-w-[130px] ${
                          isComplete
                            ? "border-emerald-400 bg-emerald-50"
                            : isEnCours
                              ? "border-blue-400 bg-blue-50"
                              : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-500">
                          Phase {ph.phase || "—"}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isComplete
                              ? "bg-emerald-100 text-emerald-800"
                              : isEnCours
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {isComplete
                            ? "Complétée"
                            : isEnCours
                              ? "En cours"
                              : "Planifiée"}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {completedInPhase}/{totalInPhase}
                        </p>
                      </div>
                      {i < phases.length - 1 && (
                        <div
                          className={`w-8 h-0.5 flex-shrink-0 ${
                            isComplete ? "bg-emerald-400" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Détail par phase */}
              {phases.map((ph) => {
                const completedInPhase = ph.balcons.filter(
                  (b) => b.installationTerminee
                ).length;
                const totalInPhase = ph.balcons.length;
                const phPct =
                  totalInPhase > 0
                    ? Math.round((completedInPhase / totalInPhase) * 100)
                    : 0;
                const isComplete = phPct === 100;
                const isEnCours =
                  completedInPhase > 0 && completedInPhase < totalInPhase;

                return (
                  <div
                    key={ph.phase}
                    className={`rounded-xl border-2 overflow-hidden ${
                      isComplete
                        ? "border-emerald-200"
                        : isEnCours
                          ? "border-blue-200"
                          : "border-slate-200"
                    }`}
                  >
                    <div
                      className={`p-4 ${
                        isComplete
                          ? "bg-emerald-50"
                          : isEnCours
                            ? "bg-blue-50"
                            : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800">
                              Phase {ph.phase || "Principale"}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isComplete
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isEnCours
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {isComplete
                                ? "Complétée"
                                : isEnCours
                                  ? "En cours"
                                  : "Planifiée"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {ph.balcons.reduce(
                              (s, b) => s + b.piedsLineaires,
                              0
                            )}{" "}
                            pieds lin. •{" "}
                            {ph.balcons.reduce((s, b) => s + b.poteaux, 0)}{" "}
                            poteaux
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-800">
                            {completedInPhase}/{totalInPhase}
                          </p>
                          <p className="text-xs text-slate-500">{phPct}%</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <ProgressBar
                          pct={phPct}
                          height="h-2"
                          couleurBarre={
                            isComplete ? "bg-emerald-500" : "bg-blue-500"
                          }
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {ph.balcons.map((bal) => (
                        <LigneBalcon key={bal.id} bal={bal} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* Bouton fermer / ouvrir page complète */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={() =>
              router.push(`/dashboard/multilogements/${cmd.id}`)
            }
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Icon name="trend" size={16} />
            Ouvrir page complète
          </button>
          <button
            onClick={() => setSelectedCmd(null)}
            className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  };

  // ─── Ligne Balcon individuelle ─────────────────────────
  const LigneBalcon = ({ bal }: { bal: any }) => {
    const [expanded, setExpanded] = useState(false);
    const etapes = getEtapesBalcon(bal);

    return (
      <div>
        <div
          className={`flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-l-4 transition-colors ${
            bal.installationTerminee
              ? "border-l-emerald-500 bg-emerald-50/30"
              : bal.envoyeProduction === "COMPLETE" ||
                  bal.termine === "COMPLETE"
                ? "border-l-blue-500"
                : "border-l-slate-300"
          }`}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                bal.installationTerminee
                  ? "bg-emerald-500"
                  : bal.envoyeProduction === "COMPLETE"
                    ? "bg-blue-500"
                    : "bg-slate-300"
              }`}
            />
            <div className="min-w-0">
              <p className="font-medium text-slate-800 truncate">{bal.nom}</p>
              <p className="text-xs text-slate-400">
                {bal.piedsLineaires} pi. lin. • {bal.poteaux} poteaux
                {bal.numeroPhase ? ` • Phase ${bal.numeroPhase}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mini-badges étapes */}
            <div className="hidden sm:flex gap-0.5">
              {etapes.map((e) => {
                const info = getCodeProdLabel(e.code);
                return (
                  <span
                    key={e.label}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold ${info.color}`}
                    title={`${e.label}: ${info.label}`}
                  >
                    {info.label === "—" ? "" : info.label}
                  </span>
                );
              })}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                bal.installationTerminee
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {bal.installationTerminee ? "Complété" : "En cours"}
            </span>
            <Icon
              name="right"
              size={14}
            />
          </div>
        </div>

        {/* Détail étendu du balcon */}
        {expanded && (
          <div className="px-5 py-4 bg-slate-50 border-l-4 border-l-amber-400">
            <h5 className="text-sm font-semibold text-slate-600 mb-3">
              Évolution des étapes — {bal.nom}
            </h5>

            {/* Pipeline visuel */}
            <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-1">
              {etapes.map((e, i) => {
                const info = getCodeProdLabel(e.code);
                const isComplete = e.code === "COMPLETE";
                return (
                  <div key={e.label} className="flex items-center">
                    <div
                      className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[80px] border-2 ${
                        isComplete
                          ? "border-emerald-400 bg-emerald-50"
                          : e.code
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-500 mb-1">
                        {e.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${info.color}`}
                      >
                        {info.label}
                      </span>
                    </div>
                    {i < etapes.length - 1 && (
                      <div
                        className={`w-4 h-0.5 flex-shrink-0 ${
                          isComplete ? "bg-emerald-400" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Infos complémentaires */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2 border border-slate-200">
                <p className="text-slate-400">Pieds linéaires</p>
                <p className="font-bold text-slate-800">
                  {bal.piedsLineaires}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-200">
                <p className="text-slate-400">Poteaux</p>
                <p className="font-bold text-slate-800">{bal.poteaux}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-200">
                <p className="text-slate-400">Date prévue</p>
                <p className="font-bold text-slate-800">
                  {formaterDateCourte(bal.datePrevue)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-200">
                <p className="text-slate-400">Plan approuvé</p>
                <p className="font-bold text-slate-800">
                  {formaterDateCourte(bal.planApprobationEnvoyeLe)}
                </p>
              </div>
            </div>
            {bal.notes && (
              <div className="mt-2 bg-amber-50 rounded-lg p-2 border border-amber-200 text-xs text-slate-700">
                {bal.notes}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // =============================================================
  // RENDU PRINCIPAL
  // =============================================================
  return (
    <div className="space-y-4">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-400/20 rounded-lg">
            <Icon name="building" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Multi-logements</h1>
            <p className="text-slate-400 text-sm">
              Commandes commerciales, multi-phases et multi-plans
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-white text-sm flex-wrap">
          <div className="text-right">
            <p className="text-slate-400">Commandes</p>
            <p className="text-2xl font-bold text-amber-400">
              {stats.totalCommandes}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">Balcons</p>
            <p className="text-2xl font-bold text-blue-400">
              {stats.balconsCompletes}/{stats.totalBalcons}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">Pieds linéaires</p>
            <p className="text-2xl font-bold text-slate-300">
              {stats.totalPiedsLineaires.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Onglets Actifs / Historique ──────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setOnglet("actifs")}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
              onglet === "actifs"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600"
            }`}
          >
            🏗️ Commandes actives ({countActifs})
          </button>
          <button
            onClick={() => setOnglet("historique")}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
              onglet === "historique"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600"
            }`}
          >
            📋 Historique ({countHistorique})
          </button>
        </div>
      </div>

      {/* ─── Filtres ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-lg">
          {[
            { val: "tous", label: "Tous", count: commandes.length },
            {
              val: "COMMERCIAL",
              label: "Commercial",
              count: stats.commandesCommercial,
              activeClass: "bg-blue-500 text-white",
            },
            {
              val: "MULTI_PHASE",
              label: "Multi-phase",
              count: stats.commandesMultiPhase,
              activeClass: "bg-purple-500 text-white",
            },
            {
              val: "MULTIPLAN",
              label: "Multi-plan",
              count: stats.commandesMultiPlan,
              activeClass: "bg-teal-500 text-white",
            },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFiltreType(f.val)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                filtreType === f.val
                  ? f.activeClass || "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Icon name="search" size={16} />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Rechercher commande, client..."
          />
        </div>
        <button
          onClick={fetchCommandes}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          title="Rafraîchir"
        >
          <Icon name="refresh" size={18} />
        </button>
      </div>

      {/* ─── Erreur ──────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <Icon name="alert" size={20} />
          <div>
            <p className="font-semibold text-red-800">Erreur de chargement</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={fetchCommandes}
            className="ml-auto px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ─── Loading ─────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ─── Historique banner ────────────────────────────── */}
      {onglet === "historique" && !loading && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-center gap-3">
          <Icon name="check" size={24} />
          <div>
            <p className="font-semibold text-emerald-800">
              Commandes complétées
            </p>
            <p className="text-sm text-emerald-600">
              {countHistorique} commande(s) terminée(s) ou annulée(s)
            </p>
          </div>
        </div>
      )}

      {/* ─── Liste des commandes ─────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {commandesFiltrees.map((cmd) => (
            <React.Fragment key={cmd.id}>
              {selectedCmd?.id === cmd.id ? (
                <PanneauDetail cmd={cmd} />
              ) : (
                <CarteCommande cmd={cmd} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {!loading && commandesFiltrees.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-slate-600 font-medium">Aucune commande trouvée</p>
          <p className="text-sm text-slate-400 mt-1">
            {recherche
              ? "Essayez de modifier votre recherche"
              : "Aucune commande de ce type n'est enregistrée"}
          </p>
        </div>
      )}
    </div>
  );
}