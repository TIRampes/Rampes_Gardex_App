// ============================================================
// components/CommandeDetailClient.tsx
// Page détail complète d'une commande multi-logements
// ============================================================
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CommandeMulti, CommandeMultiDetailResponse } from "@/app/api/multilogements/schema";


// ─── Icônes ─────────────────────────────────────────────────
const Icon = ({ name, size = 20 }: { name: string; size?: number }) => {
  const paths: Record<string, React.ReactNode> = {
    left: <path d="M15 19l-7-7 7-7" />,
    right: <path d="M9 5l7 7-7 7" />,
    building: (
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    calendar: (
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    clock: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    check: <path d="M5 13l4 4L19 7" />,
    alert: (
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
    users: (
      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    ),
    map: (
      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    ),
    factory: (
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    cart: (
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    trend: <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    refresh: (
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

const getTypeLabel = (t: string) => {
  switch (t) {
    case "COMMERCIAL": return "Commercial";
    case "MULTI_PHASE": return "Multi-phase";
    case "MULTIPLAN": return "Multi-plan";
    default: return t;
  }
};

const getTypeBadgeColor = (t: string) => {
  switch (t) {
    case "COMMERCIAL": return "bg-blue-500 text-white";
    case "MULTI_PHASE": return "bg-purple-500 text-white";
    case "MULTIPLAN": return "bg-teal-500 text-white";
    default: return "bg-slate-500 text-white";
  }
};

const getStatutLabel = (s: string) => {
  switch (s) {
    case "ACTIVE": return "Active";
    case "EN_ATTENTE": return "En attente";
    case "COMPLETEE": return "Complétée";
    case "ANNULEE": return "Annulée";
    default: return s;
  }
};

const getStatutCouleur = (s: string) => {
  switch (s) {
    case "ACTIVE": return "bg-blue-100 text-blue-800";
    case "EN_ATTENTE": return "bg-amber-100 text-amber-800";
    case "COMPLETEE": return "bg-emerald-100 text-emerald-800";
    case "ANNULEE": return "bg-red-100 text-red-800";
    default: return "bg-slate-100 text-slate-700";
  }
};

const getCodeProdLabel = (code: string | null | undefined) => {
  if (!code) return { label: "—", color: "bg-slate-100 text-slate-500", desc: "Non défini" };
  const map: Record<string, { label: string; color: string; desc: string }> = {
    COMPLETE: { label: "√", color: "bg-emerald-500 text-white", desc: "Complété" },
    ATTENTE_CLIENT: { label: "At.C", color: "bg-yellow-100 text-yellow-700", desc: "Attente client" },
    NON_APPLICABLE: { label: "N/A", color: "bg-slate-200 text-slate-600", desc: "Non applicable" },
    PARTIEL: { label: "P", color: "bg-blue-100 text-blue-700", desc: "Partiel" },
    DOSSIER_MESUREUR: { label: "D", color: "bg-indigo-100 text-indigo-700", desc: "Dossier mesureur" },
    MODIFICATION: { label: "M", color: "bg-orange-100 text-orange-700", desc: "Modification" },
    ATTENTE_CAROL_CONFIRM: { label: "C-C", color: "bg-pink-100 text-pink-700", desc: "Attente Carol (confirm)" },
    ATTENTE_CAROL_MESURE: { label: "C-RM", color: "bg-rose-100 text-rose-700", desc: "Attente Carol (mesure)" },
    BACK_ORDER: { label: "B/O", color: "bg-amber-100 text-amber-700", desc: "Back order" },
    ATTENTE_REPRESENTANT: { label: "At. Rep", color: "bg-cyan-100 text-cyan-700", desc: "Attente représentant" },
  };
  return map[code] || { label: code, color: "bg-slate-100 text-slate-500", desc: code };
};

const getStatutAchatLabel = (code: string | null | undefined) => {
  if (!code) return { label: "—", color: "bg-slate-100 text-slate-500" };
  const map: Record<string, { label: string; color: string }> = {
    A_FAIRE: { label: "①", color: "bg-orange-100 text-orange-700" },
    FAIT: { label: "√", color: "bg-blue-100 text-blue-700" },
    RECEPTIONNE: { label: "R", color: "bg-green-500 text-white" },
    PRET_A_RAMASSER: { label: "P", color: "bg-purple-100 text-purple-700" },
    BACK_ORDER: { label: "B/O", color: "bg-amber-100 text-amber-700" },
  };
  return map[code] || { label: code, color: "bg-slate-100 text-slate-500" };
};

// =============================================================
// COMPOSANT PRINCIPAL
// =============================================================
export default function CommandeDetailClient({
  commandeId,
}: {
  commandeId: string;
}) {
  const router = useRouter();
  const [commande, setCommande] = useState<CommandeMulti | null>(null);
  const [progression, setProgression] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "balcons" | "production" | "achats"
  >("balcons");
  const [expandedBalcons, setExpandedBalcons] = useState<Set<string>>(
    new Set()
  );

 useEffect(() => {
  if (!commandeId) return;

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/multilogements/${commandeId}`);

      if (!res.ok) {
        throw new Error("Commande introuvable");
      }

      const data: CommandeMultiDetailResponse = await res.json();

      setCommande(data.commande);
      setProgression(data.progression);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  fetchDetail();
}, [commandeId]);

  const toggleBalcon = (id: string) => {
    setExpandedBalcons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (commande) {
      setExpandedBalcons(new Set(commande.balcons.map((b) => b.id)));
    }
  };
  const collapseAll = () => setExpandedBalcons(new Set());

  // ─── Loading state ────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-slate-800 rounded-2xl p-6 h-40" />
        <div className="bg-white rounded-2xl p-6 h-32 border border-slate-100" />
        <div className="bg-white rounded-2xl p-6 h-64 border border-slate-100" />
      </div>
    );
  }

  if (error || !commande) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/dashboard/multilogements")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
        >
          <Icon name="left" size={20} />
          <span className="font-medium">Retour aux commandes</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-800 font-semibold text-lg">{error || "Commande introuvable"}</p>
          <button
            onClick={() => router.push("/dashboard/multilogements")}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const prog = progression || {
    totalBalcons: commande.balcons.length,
    balconsTermines: commande.balcons.filter((b) => b.installationTerminee).length,
    pourcentage: 0,
  };
  if (prog.pourcentage === 0 && prog.totalBalcons > 0) {
    prog.pourcentage = Math.round(
      (prog.balconsTermines / prog.totalBalcons) * 100
    );
  }

  // Regrouper par phase
  const phases = new Map<number, typeof commande.balcons>();
  for (const b of commande.balcons) {
    const p = b.numeroPhase ?? 0;
    if (!phases.has(p)) phases.set(p, []);
    phases.get(p)!.push(b);
  }
  const phasesArray = Array.from(phases.entries())
    .sort(([a], [b]) => a - b)
    .map(([num, balcons]) => ({ num, balcons }));

  // Achats
  const achats = [
    { label: "Fibre", statut: commande.achatFibre },
    { label: "Limons", statut: commande.achatLimons },
    { label: "Verres", statut: commande.achatVerres },
    { label: "Colonnes", statut: commande.achatColonnes },
    { label: "Peinture", statut: commande.achatPeinture },
    { label: "Attaches", statut: commande.achatAttaches },
    { label: "Plancher alu.", statut: commande.achatPlancherAluminium },
  ];

  const etapesGlobales = [
    { label: "Mesure", code: commande.mesure },
    { label: "Plan", code: commande.plan },
    { label: "Envoyé prod.", code: commande.envoyeProduction },
    { label: "Prod. terminée", code: commande.productionTerminee },
    { label: "Terminé", code: commande.termine },
    { label: "Installation", code: commande.installation },
  ];

  // =============================================================
  // RENDU
  // =============================================================
  return (
    <div className="space-y-4">
      {/* ─── Bouton retour ───────────────────────────────── */}
      <button
        onClick={() => router.push("/dashboard/multilogements")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <Icon name="left" size={20} />
        <span className="font-medium">Retour aux commandes</span>
      </button>

      {/* ─── Header ──────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-2xl p-5 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${getTypeBadgeColor(commande.typeCommande)}`}>
                {getTypeLabel(commande.typeCommande)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatutCouleur(commande.statut)}`}>
                {getStatutLabel(commande.statut)}
              </span>
              <span className="text-slate-300 text-sm">#{commande.numero}</span>
            </div>
            <h1 className="text-2xl font-bold">{commande.client.nom}</h1>
            <p className="text-slate-300 text-sm mt-0.5">
              {commande.reference || commande.adresse}
              {commande.client.ville ? ` • ${commande.client.ville}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold text-amber-400">{prog.pourcentage}%</p>
            <p className="text-slate-400 text-sm">{prog.balconsTermines}/{prog.totalBalcons} balcons complétés</p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar pct={prog.pourcentage} height="h-4" />
        </div>
      </div>

      {/* ─── Infos sommaires ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Pieds linéaires", value: commande.balcons.reduce((s, b) => s + b.piedsLineaires, 0).toLocaleString(), icon: "trend" },
          { label: "Poteaux", value: commande.balcons.reduce((s, b) => s + b.poteaux, 0).toString(), icon: "factory" },
          { label: "Représentant", value: commande.representant?.nom || "—", icon: "users" },
          { label: "Date entrée", value: formaterDate(commande.dateEntree), icon: "calendar" },
          { label: "Date prévue", value: formaterDate(commande.datePrevue), icon: "clock" },
          {
            label: "Prix total",
            value: Number(commande.prixTotal).toLocaleString("fr-CA", {
              style: "currency",
              currency: "CAD",
            }),
            icon: "cart",
          },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Icon name={item.icon} size={14} />
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
            <p className="text-lg font-bold text-slate-800 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Pipeline global ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3">Progression globale de la commande</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {etapesGlobales.map((e, i) => {
            const info = getCodeProdLabel(e.code);
            const isComplete = e.code === "COMPLETE";
            return (
              <div key={e.label} className="flex items-center">
                <div className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 min-w-[100px] ${
                  isComplete ? "border-emerald-400 bg-emerald-50" : e.code ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50"
                }`}>
                  <span className="text-[10px] font-semibold text-slate-500 mb-1">{e.label}</span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${info.color}`}>{info.label}</span>
                  <span className="text-[10px] text-slate-400 mt-1">{info.desc}</span>
                </div>
                {i < etapesGlobales.length - 1 && (
                  <div className={`w-6 h-0.5 flex-shrink-0 ${isComplete ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Onglets Balcons / Production / Achats ────────── */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: "balcons" as const, label: `🏢 Balcons / Plans (${commande.balcons.length})` },
          { key: "production" as const, label: "🔧 Codes production" },
          { key: "achats" as const, label: "🛒 Achats" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
              activeTab === tab.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Balcons ────────────────────────────────── */}
      {activeTab === "balcons" && (
        <div className="space-y-4">
          {/* Contrôles */}
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Tout déplier
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Tout replier
            </button>
          </div>

          {/* COMMERCIAL : liste plate */}
          {commande.typeCommande === "COMMERCIAL" && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {commande.balcons.map((bal) => (
                  <BalconRow
                    key={bal.id}
                    bal={bal}
                    expanded={expandedBalcons.has(bal.id)}
                    onToggle={() => toggleBalcon(bal.id)}
                  />
                ))}
                {commande.balcons.length === 0 && (
                  <div className="p-8 text-center text-slate-400">Aucun balcon enregistré</div>
                )}
              </div>
            </div>
          )}

          {/* MULTI-PHASE / MULTI-PLAN : par phases */}
          {(commande.typeCommande === "MULTI_PHASE" || commande.typeCommande === "MULTIPLAN") && (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {phasesArray.map((ph, i) => {
                  const completed = ph.balcons.filter((b) => b.installationTerminee).length;
                  const total = ph.balcons.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  const isComplete = pct === 100;
                  const isEnCours = completed > 0 && !isComplete;
                  return (
                    <div key={ph.num} className="flex items-center">
                      <div className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 text-center min-w-[130px] ${
                        isComplete ? "border-emerald-400 bg-emerald-50" : isEnCours ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50"
                      }`}>
                        <p className="text-xs font-bold text-slate-500">Phase {ph.num || "—"}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isComplete ? "bg-emerald-100 text-emerald-800" : isEnCours ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {isComplete ? "Complétée" : isEnCours ? "En cours" : "Planifiée"}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">{completed}/{total}</p>
                      </div>
                      {i < phasesArray.length - 1 && (
                        <div className={`w-8 h-0.5 flex-shrink-0 ${isComplete ? "bg-emerald-400" : "bg-slate-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Détail par phase */}
              {phasesArray.map((ph) => {
                const completed = ph.balcons.filter((b) => b.installationTerminee).length;
                const total = ph.balcons.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isComplete = pct === 100;
                const isEnCours = completed > 0 && !isComplete;

                return (
                  <div key={ph.num} className={`rounded-xl border-2 overflow-hidden ${
                    isComplete ? "border-emerald-200" : isEnCours ? "border-blue-200" : "border-slate-200"
                  }`}>
                    <div className={`p-4 ${
                      isComplete ? "bg-emerald-50" : isEnCours ? "bg-blue-50" : "bg-slate-50"
                    }`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800">Phase {ph.num || "Principale"}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isComplete ? "bg-emerald-100 text-emerald-800" : isEnCours ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {isComplete ? "Complétée" : isEnCours ? "En cours" : "Planifiée"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {ph.balcons.reduce((s, b) => s + b.piedsLineaires, 0)} pieds lin. •{" "}
                            {ph.balcons.reduce((s, b) => s + b.poteaux, 0)} poteaux
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-800">{completed}/{total}</p>
                          <p className="text-xs text-slate-500">{pct}%</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <ProgressBar pct={pct} height="h-2" couleurBarre={isComplete ? "bg-emerald-500" : "bg-blue-500"} />
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {ph.balcons.map((bal) => (
                        <BalconRow
                          key={bal.id}
                          bal={bal}
                          expanded={expandedBalcons.has(bal.id)}
                          onToggle={() => toggleBalcon(bal.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Production ─────────────────────────────── */}
      {activeTab === "production" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Codes de production par balcon</h3>
            <p className="text-xs text-slate-400 mt-1">Vue d'ensemble de toutes les étapes de production</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Balcon</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">Phase</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">Mesure</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">Plan</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">Production</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">Terminé</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">Installation</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">Pieds lin.</th>
                </tr>
              </thead>
              <tbody>
                {commande.balcons.map((bal) => (
                  <tr key={bal.id} className={`border-b border-slate-100 hover:bg-slate-50 ${bal.installationTerminee ? "bg-emerald-50/30" : ""}`}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{bal.nom}</td>
                    <td className="text-center px-3 py-2.5 text-slate-500">{bal.numeroPhase ?? "—"}</td>
                    {["mesure", "plan", "envoyeProduction", "termine", "installation"].map((key) => {
                      const info = getCodeProdLabel((bal as any)[key]);
                      return (
                        <td key={key} className="text-center px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${info.color}`}>{info.label}</span>
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-2.5 font-semibold">{bal.piedsLineaires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: Achats ─────────────────────────────────── */}
      {activeTab === "achats" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">Statut des achats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {achats.map((a) => {
              const info = getStatutAchatLabel(a.statut);
              return (
                <div key={a.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-2">{a.label}</p>
                  <span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold ${info.color}`}>
                    {info.label}
                  </span>
                </div>
              );
            })}
          </div>
          {commande.commentaire && (
            <div className="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-600 font-semibold mb-1">Commentaire</p>
              <p className="text-sm text-slate-700">{commande.commentaire}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sous-composant : ligne de balcon avec détail dépliable ──
function BalconRow({
  bal,
  expanded,
  onToggle,
}: {
  bal: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const etapes = [
    { label: "Mesure", code: bal.mesure },
    { label: "Plan", code: bal.plan },
    { label: "Production", code: bal.envoyeProduction },
    { label: "Terminé", code: bal.termine },
    { label: "Installation", code: bal.installation },
  ];

  const formaterDate = (d: string | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString("fr-CA", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div>
      <div
        className={`flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-l-4 transition-colors ${
          bal.installationTerminee
            ? "border-l-emerald-500 bg-emerald-50/30"
            : bal.envoyeProduction === "COMPLETE"
              ? "border-l-blue-500"
              : "border-l-slate-300"
        }`}
        onClick={onToggle}
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Détail étendu */}
      {expanded && (
        <div className="px-5 py-4 bg-slate-50 border-l-4 border-l-amber-400 space-y-3">
          <h5 className="text-sm font-semibold text-slate-600">
            Évolution des étapes — {bal.nom}
          </h5>

          {/* Pipeline visuel */}
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {etapes.map((e, i) => {
              const info = getCodeProdLabel(e.code);
              const isComplete = e.code === "COMPLETE";
              return (
                <div key={e.label} className="flex items-center">
                  <div
                    className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[85px] border-2 ${
                      isComplete
                        ? "border-emerald-400 bg-emerald-50"
                        : e.code
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-slate-500 mb-1">{e.label}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${info.color}`}>{info.label}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{info.desc}</span>
                  </div>
                  {i < etapes.length - 1 && (
                    <div className={`w-4 h-0.5 flex-shrink-0 ${isComplete ? "bg-emerald-400" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Données supplémentaires */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white rounded-lg p-2 border border-slate-200">
              <p className="text-slate-400">Pieds linéaires</p>
              <p className="font-bold text-slate-800">{bal.piedsLineaires}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-200">
              <p className="text-slate-400">Poteaux</p>
              <p className="font-bold text-slate-800">{bal.poteaux}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-200">
              <p className="text-slate-400">Date prévue</p>
              <p className="font-bold text-slate-800">{formaterDate(bal.datePrevue)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-200">
              <p className="text-slate-400">Plan approuvé le</p>
              <p className="font-bold text-slate-800">{formaterDate(bal.planApprobationEnvoyeLe)}</p>
            </div>
          </div>

          {bal.notes && (
            <div className="bg-amber-50 rounded-lg p-2 border border-amber-200 text-xs text-slate-700">
              <span className="font-semibold text-amber-700">Note : </span>{bal.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}