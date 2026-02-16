"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Wrench, Calendar, AlertTriangle, Users, TrendingUp,
  Package, Truck, Clock, CheckCircle2, XCircle, ArrowUpRight,
  ArrowRight, Activity, DollarSign, RefreshCw, Loader2, MapPin,
  Phone, Building2, Layers, ChevronRight, Zap, Target, BarChart3,
  Eye, Plus, Bell, Sparkles
} from "lucide-react";

// Types
interface Client { nom: string; telephone?: string; personne_Contact?: string; type?: string; }
interface Commande {
  id: string; numero: string; adresse: string; service: string;
  client: Client; representant?: { nom: string };
  dateEntree: string; datePrevue?: string; prixTotal: number;
  typeCommande: string; statut: string;
}
interface Equipe { nom: string; couleur: string; }
interface Intervention {
  id: string; type: string; datePrevue: string; heureDebut?: string;
  heureFin?: string; statut: string;
  commande: { numero: string; adresse: string; client: Client };
  equipe?: Equipe;
}
interface DashboardData {
  stats: {
    commandes: {
      total: number; actives: number; enAttente: number;
      completees: number; enProduction: number; enRetard: number;
    };
    parType: Record<string, number>;
    parService: Record<string, number>;
    clients: { total: number; nouveaux: number };
    reprises: number;
    chiffreAffaires: number;
  };
  interventions: {
    aujourdhui: Intervention[];
    prochaines: Intervention[];
  };
  commandesRecentes: Commande[];
  alertes: { type: string; title: string; description: string; link: string }[];
}

// ===== COULEURS GARDEX =====
const GARDEX_GOLD = "#D4A84B";
const GARDEX_GOLD_LIGHT = "#E8C97D";
const GARDEX_GOLD_DARK = "#B8913A";

// ===== COULEURS PAR TYPE D'INTERVENTION (CORRECTES) =====
// Installation = ROUGE, Cueillette = JAUNE, Livraison = BLEU, Transport = VERT
const SERVICE_COLORS: Record<string, { 
  bg: string; bgHover: string; text: string; border: string; 
  gradient: string; gradientHover: string; light: string; icon: React.ReactNode 
}> = {
  INSTALLATION: {
    bg: "bg-red-500",
    bgHover: "hover:bg-red-600",
    text: "text-red-600",
    border: "border-red-500",
    gradient: "from-red-500 to-red-600",
    gradientHover: "from-red-600 to-red-700",
    light: "bg-red-50 dark:bg-red-900/20",
    icon: <Wrench size={18} />,
  },
  CUEILLETTE: {
    bg: "bg-yellow-500",
    bgHover: "hover:bg-yellow-600",
    text: "text-yellow-600",
    border: "border-yellow-500",
    gradient: "from-yellow-500 to-yellow-600",
    gradientHover: "from-yellow-600 to-yellow-700",
    light: "bg-yellow-50 dark:bg-yellow-900/20",
    icon: <Package size={18} />,
  },
  LIVRAISON: {
    bg: "bg-blue-500",
    bgHover: "hover:bg-blue-600",
    text: "text-blue-600",
    border: "border-blue-500",
    gradient: "from-blue-500 to-blue-600",
    gradientHover: "from-blue-600 to-blue-700",
    light: "bg-blue-50 dark:bg-blue-900/20",
    icon: <Truck size={18} />,
  },
  TRANSPORT: {
    bg: "bg-green-500",
    bgHover: "hover:bg-green-600",
    text: "text-green-600",
    border: "border-green-500",
    gradient: "from-green-500 to-green-600",
    gradientHover: "from-green-600 to-green-700",
    light: "bg-green-50 dark:bg-green-900/20",
    icon: <Truck size={18} />,
  },
  MESURE: {
    bg: "bg-purple-500",
    bgHover: "hover:bg-purple-600",
    text: "text-purple-600",
    border: "border-purple-500",
    gradient: "from-purple-500 to-purple-600",
    gradientHover: "from-purple-600 to-purple-700",
    light: "bg-purple-50 dark:bg-purple-900/20",
    icon: <Target size={18} />,
  },
};

const SERVICE_LABELS: Record<string, string> = {
  INSTALLATION: "Installation",
  CUEILLETTE: "Cueillette",
  LIVRAISON: "Livraison",
  TRANSPORT: "Transport",
  MESURE: "Mesure",
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboard = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Rafraîchir toutes les 30 secondes
    const dataInterval = setInterval(() => fetchDashboard(), 30000);
    // Mettre à jour l'heure toutes les secondes
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-CA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state avec animation premium
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div 
              className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${GARDEX_GOLD} transparent transparent transparent` }}
            />
            <div 
              className="absolute inset-2 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${GARDEX_GOLD}20, ${GARDEX_GOLD}40)` }}
            >
              <Sparkles size={24} style={{ color: GARDEX_GOLD }} />
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Chargement...</p>
            <p className="text-sm text-gray-500">Récupération des données</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Impossible de charger les données</p>
          <button 
            onClick={() => fetchDashboard()} 
            className="px-6 py-2 rounded-xl font-medium text-white"
            style={{ background: `linear-gradient(135deg, ${GARDEX_GOLD}, ${GARDEX_GOLD_DARK})` }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { stats, interventions, commandesRecentes, alertes } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* ===== HEADER PREMIUM ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${GARDEX_GOLD}, ${GARDEX_GOLD_DARK})` }}
          >
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Tableau de bord
            </h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>{currentTime.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" })}</span>
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              <span className="font-mono">{formatTime(currentTime)}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/commandes/nouveau")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white shadow-lg hover:shadow-xl transition-all"
            style={{ background: `linear-gradient(135deg, ${GARDEX_GOLD}, ${GARDEX_GOLD_DARK})` }}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouvelle commande</span>
          </button>
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <RefreshCw size={18} className={`text-gray-600 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ===== ALERTES ===== */}
      {alertes.length > 0 && (
        <div className="space-y-2">
          {alertes.map((alerte, i) => (
            <div
              key={i}
              onClick={() => router.push(alerte.link)}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg border ${
                alerte.type === "error" 
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100" 
                  : alerte.type === "warning"
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                alerte.type === "error" ? "bg-red-100 dark:bg-red-800" : 
                alerte.type === "warning" ? "bg-amber-100 dark:bg-amber-800" : "bg-blue-100 dark:bg-blue-800"
              }`}>
                <Bell size={20} className={
                  alerte.type === "error" ? "text-red-600" : 
                  alerte.type === "warning" ? "text-amber-600" : "text-blue-600"
                } />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${
                  alerte.type === "error" ? "text-red-700" : 
                  alerte.type === "warning" ? "text-amber-700" : "text-blue-700"
                }`}>
                  {alerte.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{alerte.description}</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          ))}
        </div>
      )}

      {/* ===== STATS PRINCIPALES ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText />}
          label="Commandes actives"
          value={stats.commandes.actives}
          subValue={`${stats.commandes.total} total`}
          trend={stats.commandes.actives > 0 ? "up" : "neutral"}
          color="gold"
          onClick={() => router.push("/dashboard/commandes?statut=ACTIVE")}
        />
        <StatCard
          icon={<Wrench />}
          label="Aujourd'hui"
          value={interventions.aujourdhui.length}
          subValue="interventions"
          trend={interventions.aujourdhui.length > 0 ? "up" : "neutral"}
          color="red"
          onClick={() => router.push("/dashboard/planification")}
        />
        <StatCard
          icon={<Activity />}
          label="En production"
          value={stats.commandes.enProduction}
          subValue="en cours"
          trend="neutral"
          color="green"
          onClick={() => router.push("/dashboard/production")}
        />
        <StatCard
          icon={<Users />}
          label="Clients"
          value={stats.clients.total}
          subValue={`+${stats.clients.nouveaux} ce mois`}
          trend={stats.clients.nouveaux > 0 ? "up" : "neutral"}
          color="blue"
          onClick={() => router.push("/dashboard/clients")}
        />
      </div>

      {/* ===== CHIFFRE D'AFFAIRES PREMIUM ===== */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${GARDEX_GOLD}, ${GARDEX_GOLD_DARK})` }}
      >
        {/* Décorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-white/80" />
              <p className="text-white/80 font-medium uppercase text-sm tracking-wide">Chiffre d'affaires du mois</p>
            </div>
            <p className="text-4xl sm:text-5xl font-bold tracking-tight">
              {formatCurrency(stats.chiffreAffaires)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-sm">
                <TrendingUp size={14} />
                <span>En cours</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-6 sm:gap-8">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold">{stats.commandes.completees}</p>
              <p className="text-white/70 text-sm mt-1">Complétées</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold">{stats.commandes.enAttente}</p>
              <p className="text-white/70 text-sm mt-1">En attente</p>
            </div>
            <div className="w-px bg-white/20 hidden sm:block" />
            <div className="text-center hidden sm:block">
              <p className="text-3xl sm:text-4xl font-bold">{stats.reprises}</p>
              <p className="text-white/70 text-sm mt-1">Reprises</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SERVICES PAR COULEUR ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {["INSTALLATION", "CUEILLETTE", "LIVRAISON", "TRANSPORT"].map((service) => {
          const config = SERVICE_COLORS[service];
          const count = stats.parService[service] || 0;
          return (
            <div
              key={service}
              onClick={() => router.push(`/dashboard/commandes?service=${service}`)}
              className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${config.gradient}`}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    {config.icon}
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold">{count}</span>
                </div>
                <p className="font-semibold text-white/90">{SERVICE_LABELS[service]}</p>
                <p className="text-xs text-white/60 mt-0.5">commandes actives</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== GRILLE PRINCIPALE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interventions du jour */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: `linear-gradient(135deg, ${GARDEX_GOLD}15, ${GARDEX_GOLD}30)` }}
              >
                <Calendar size={22} style={{ color: GARDEX_GOLD }} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Interventions aujourd'hui</h2>
                <p className="text-sm text-gray-500">{interventions.aujourdhui.length} planifiée{interventions.aujourdhui.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <button 
              onClick={() => router.push("/dashboard/planification")}
              className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: GARDEX_GOLD }}
            >
              Voir tout <ArrowRight size={16} />
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {interventions.aujourdhui.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Aucune intervention prévue aujourd'hui</p>
                <p className="text-sm text-gray-400 mt-1">Profitez de cette journée calme !</p>
              </div>
            ) : (
              interventions.aujourdhui.map((intervention) => {
                const config = SERVICE_COLORS[intervention.type] || SERVICE_COLORS.INSTALLATION;
                return (
                  <div
                    key={intervention.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all group"
                    onClick={() => router.push(`/dashboard/interventions/${intervention.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-br ${config.gradient}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {intervention.commande.client.nom}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${config.bg}`}>
                            {SERVICE_LABELS[intervention.type]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                          <MapPin size={14} className="flex-shrink-0" />
                          <span className="truncate">{intervention.commande.adresse}</span>
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            📋 {intervention.commande.numero}
                          </span>
                          {intervention.equipe && (
                            <span className="flex items-center gap-1.5 text-sm">
                              <span className={`w-2.5 h-2.5 rounded-full ${intervention.equipe.couleur}`} />
                              <span className="text-gray-600 dark:text-gray-400">{intervention.equipe.nom}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900 dark:text-white text-lg">
                          {intervention.heureDebut || "—"}
                        </p>
                        {intervention.heureFin && (
                          <p className="text-sm text-gray-500">→ {intervention.heureFin}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Prochaines interventions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={18} style={{ color: GARDEX_GOLD }} />
                Prochaines interventions
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
              {interventions.prochaines.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Aucune intervention à venir
                </div>
              ) : (
                interventions.prochaines.slice(0, 5).map((intervention) => {
                  const config = SERVICE_COLORS[intervention.type] || SERVICE_COLORS.INSTALLATION;
                  return (
                    <div
                      key={intervention.id}
                      className="p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center gap-3 transition-colors"
                      onClick={() => router.push(`/dashboard/interventions/${intervention.id}`)}
                    >
                      <div className={`w-1.5 h-12 rounded-full ${config.bg}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {intervention.commande.client.nom}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(intervention.datePrevue)}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white ${config.bg}`}>
                        {SERVICE_LABELS[intervention.type]?.slice(0, 5)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Résumé rapide */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 size={18} style={{ color: GARDEX_GOLD }} />
              Résumé du mois
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Complétées</span>
                </div>
                <span className="text-xl font-bold text-green-600">{stats.commandes.completees}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">En attente</span>
                </div>
                <span className="text-xl font-bold text-amber-600">{stats.commandes.enAttente}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reprises</span>
                </div>
                <span className="text-xl font-bold text-red-600">{stats.reprises}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== COMMANDES RÉCENTES ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: `linear-gradient(135deg, ${GARDEX_GOLD}15, ${GARDEX_GOLD}30)` }}
            >
              <FileText size={22} style={{ color: GARDEX_GOLD }} />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white">Commandes récentes</h2>
          </div>
          <button 
            onClick={() => router.push("/dashboard/commandes")}
            className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: GARDEX_GOLD }}
          >
            Toutes <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Commande</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Service</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {commandesRecentes.map((commande) => {
                const serviceConfig = SERVICE_COLORS[commande.service] || SERVICE_COLORS.INSTALLATION;
                return (
                  <tr
                    key={commande.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                    onClick={() => router.push(`/dashboard/commandes/${commande.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-10 rounded-full ${serviceConfig.bg} group-hover:scale-110 transition-transform`} />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{commande.numero}</p>
                          <p className="text-xs text-gray-500 sm:hidden mt-0.5">{commande.client.nom}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="font-medium text-gray-900 dark:text-white">{commande.client.nom}</p>
                      <p className="text-xs text-gray-500">{commande.client.type}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${serviceConfig.bg}`}>
                        {serviceConfig.icon}
                        {SERVICE_LABELS[commande.service]}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-gray-600 dark:text-gray-400">{formatDate(commande.dateEntree)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-bold text-lg" style={{ color: GARDEX_GOLD }}>
                        {formatCurrency(Number(commande.prixTotal))}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== TYPES DE COMMANDE ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { type: "STANDARD", label: "Standard", icon: <FileText size={22} />, gradient: "from-blue-500 to-blue-600", light: "bg-blue-50" },
          { type: "COMMERCIAL", label: "Commercial", icon: <Building2 size={22} />, gradient: "from-purple-500 to-purple-600", light: "bg-purple-50" },
          { type: "MULTI_PHASE", label: "Multi-Phase", icon: <Layers size={22} />, gradient: "from-orange-500 to-orange-600", light: "bg-orange-50" },
          { type: "MULTIPLAN", label: "Multiplan", icon: <Target size={22} />, gradient: "from-emerald-500 to-emerald-600", light: "bg-emerald-50" },
        ].map((item) => (
          <div
            key={item.type}
            onClick={() => router.push(`/dashboard/commandes?type=${item.type}`)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.parType[item.type] || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== COMPOSANT STAT CARD =====
function StatCard({ icon, label, value, subValue, trend, color, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue: string;
  trend: "up" | "down" | "neutral";
  color: "gold" | "red" | "green" | "blue";
  onClick: () => void;
}) {
  const gradients = {
    gold: `linear-gradient(135deg, ${GARDEX_GOLD}, ${GARDEX_GOLD_DARK})`,
    red: "linear-gradient(135deg, #EF4444, #DC2626)",
    green: "linear-gradient(135deg, #22C55E, #16A34A)",
    blue: "linear-gradient(135deg, #3B82F6, #2563EB)",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div
          className="p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
          style={{ background: gradients[color] }}
        >
          {icon}
        </div>
        <ArrowUpRight 
          size={20} 
          className={`transition-all ${
            trend === "up" ? "text-green-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" : 
            trend === "down" ? "text-red-500 rotate-90" : "text-gray-300"
          }`}
        />
      </div>
      <div className="mt-4">
        <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>
      </div>
    </div>
  );
}