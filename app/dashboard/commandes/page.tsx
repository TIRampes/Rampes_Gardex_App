"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Filter, Package, Truck, Wrench, Clock, AlertTriangle,
  MoreHorizontal, Eye, Edit, Trash2, Calendar, Building2,
  CheckCircle2, XCircle, Loader2, TrendingUp, Box, Ruler, Layers,
  MessageCircle, User, Users, FilterX, Settings, Save, X, Lock
} from "lucide-react";
import { useConfig } from "@/app/context/ConfigContext";

// Types
interface Client { id: string; nom: string; type: string; telephone: string; personne_Contact: string; }
interface Representant { id: string; nom: string; }
interface Balcon { id: string; nom: string; numeroPhase: number; piedsLineaires: number; poteaux: number; }
interface StructureAchat { id: string; nom: string; statutAchat: string; }
interface Commande {
  id: string; numero: string; reference: string | null;
  typeCommande: string; service: string; statut: string;
  adresse: string; client: Client; representant: Representant | null;
  dateEntree: string; datePrevue: string | null; dateProduction: string | null;
  datePriseMesure: string | null; dateLivraison: string | null;
  prixTotal: number; prixVenteMateriaux: number; prixVenteInstallation: number;
  enProduction: boolean; reprise: boolean;
  piedsLineairesRampes: number; nombrePoteaux: number;
  mesure: string | null; plan: string | null; envoyeProduction: string | null;
  productionTerminee: string | null; termine: string | null;
  statutLivraison: string; installation: string | null;
  achatFibre: string | null; achatLimons: string | null; achatVerres: string | null;
  achatColonnes: string | null; achatPeinture: string | null; achatAttaches: string | null;
  achatPlancherAluminium: string | null;
  dateReceptionFibre: string | null; dateReceptionLimons: string | null;
  dateReceptionVerre: string | null;
  quantiteNonRecueFibre: number | null; quantiteNonRecueLimons: number | null;
  quantiteNonRecueVerres: number | null;
  commentaire: string | null; couleur: string | null;
  balcons: Balcon[]; structuresAchat: StructureAchat[];
  _count: { interventions: number; reprises: number; achats: number };
}
interface Stats {
  total: number;
  parStatut: Record<string, number>;
  parType: Record<string, number>;
  parService: Record<string, number>;
  parRepresentant: Record<string, number>;
  parClient: Record<string, number>;
  enProduction: number;
  enRetard: number;
  actives: number;
  completees: number;
  avecCommentaires: number;
  reprises: number;
}

// Mappings
const CODE_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  COMPLETE: { symbol: "✓", color: "text-green-600" },
  ATTENTE_CLIENT: { symbol: "At.C", color: "text-orange-600" },
  NON_APPLICABLE: { symbol: "N/A", color: "text-gray-500" },
  PARTIEL: { symbol: "P", color: "text-blue-600" },
  DOSSIER_MESUREUR: { symbol: "D", color: "text-purple-600" },
  MODIFICATION: { symbol: "M", color: "text-yellow-600" },
  ATTENTE_CAROL_CONFIRM: { symbol: "C-C", color: "text-pink-600" },
  ATTENTE_CAROL_MESURE: { symbol: "C-RM", color: "text-pink-600" },
  BACK_ORDER: { symbol: "B/O", color: "text-red-600" },
  ATTENTE_REPRESENTANT: { symbol: "At.Rep", color: "text-indigo-600" },
};

const ACHAT_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  A_FAIRE: { symbol: "①", color: "text-gray-600" },
  FAIT: { symbol: "✓", color: "text-green-600" },
  RECEPTIONNE: { symbol: "R", color: "text-blue-600" },
  PRET_A_RAMASSER: { symbol: "P", color: "text-purple-600" },
  BACK_ORDER: { symbol: "B/O", color: "text-red-600" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  STANDARD: { label: "Standard", color: "text-blue-700", bgColor: "bg-blue-50 dark:bg-blue-900/30" },
  COMMERCIAL: { label: "Commercial", color: "text-purple-700", bgColor: "bg-purple-50 dark:bg-purple-900/30" },
  MULTI_PHASE: { label: "Multi-Phase", color: "text-orange-700", bgColor: "bg-orange-50 dark:bg-orange-900/30" },
  MULTIPLAN: { label: "Multiplan", color: "text-emerald-700", bgColor: "bg-emerald-50 dark:bg-emerald-900/30" },
};

const SERVICE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  INSTALLATION: { label: "Installation", color: "bg-red-500", icon: <Wrench size={14} /> },
  LIVRAISON: { label: "Livraison", color: "bg-blue-500", icon: <Truck size={14} /> },
  CUEILLETTE: { label: "Cueillette", color: "bg-yellow-500", icon: <Package size={14} /> },
  TRANSPORT: { label: "Transport", color: "bg-green-500", icon: <Truck size={14} /> },
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  ACTIVE: { label: "Active", color: "text-green-700", bgColor: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 size={14} /> },
  EN_ATTENTE: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", icon: <Clock size={14} /> },
  COMPLETEE: { label: "Complétée", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: <CheckCircle2 size={14} /> },
  ANNULEE: { label: "Annulée", color: "text-red-700", bgColor: "bg-red-100 dark:bg-red-900/30", icon: <XCircle size={14} /> },
};

// Formatage
const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-CA", { day: "2-digit", month: "short" });
};

const formatSemaine = (date: string | null) => {
  if (!date) return "—";
  const d = new Date(date);
  const week = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  return `S${week}`;
};

const CodeSymbol = ({ code, type = "production" }: { code: string | null; type?: "production" | "achat" }) => {
  if (!code) return <span className="text-gray-400">—</span>;
  const symbols = type === "achat" ? ACHAT_SYMBOLS : CODE_SYMBOLS;
  const config = symbols[code];
  if (!config) return <span className="text-gray-400">{code}</span>;
  return <span className={`font-bold ${config.color}`}>{config.symbol}</span>;
};

const CouleurBadge = ({ couleur }: { couleur: string | null }) => {
  if (!couleur) return <span className="text-gray-400">—</span>;
  const couleursMap: Record<string, { bg: string; text: string; label: string }> = {
    NOIR: { bg: "bg-gray-900", text: "text-white", label: "Noir" },
    BLANC: { bg: "bg-gray-100", text: "text-gray-900", label: "Blanc" },
    BRUN_COMMERCIALE: { bg: "bg-amber-800", text: "text-white", label: "Brun commerciale" },
    GRIS_CHARBON: { bg: "bg-gray-700", text: "text-white", label: "Gris charbon" },
    ARGILE: { bg: "bg-amber-200", text: "text-amber-900", label: "Argile" },
    SPECIALE: { bg: "bg-purple-600", text: "text-white", label: "Spéciale" },
    GRIS_METALLIQUE: { bg: "bg-gray-400", text: "text-gray-900", label: "Gris métallique" },
    AUTRE: { bg: "bg-blue-400", text: "text-white", label: "Autre" },
  };
  const config = couleursMap[couleur] || { bg: "bg-gray-300", text: "text-gray-900", label: couleur };
  return <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>;
};

export default function CommandesPage() {
  const router = useRouter();
  const { config, refreshConfig } = useConfig();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ statut: "", type: "", service: "", representantId: "", clientId: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Commande | null>(null);
  const [representants, setRepresentants] = useState<{ id: string; nom: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; nom: string }[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientMenu, setShowClientMenu] = useState(false);
  const clientContainerRef = useRef<HTMLDivElement>(null);

  // États pour le modal de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // États pour le modal de configuration
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    coutHeureInstallation: 160,
    facteurTempsInstallation: 0.7,
    facteurBarrotin: 1.25,
    facteurVerre: 1,
    facteurMur: 4,
    facteurMainDouble: 2.25,
    facteurGardexVision: 1,
    facteurGardexUrbaine: 2,
    facteurGardexOptimum: 0.75,
  });

  // Remplir le formulaire quand la config est chargée
  useEffect(() => {
    if (config) {
      setConfigForm({
        coutHeureInstallation: config.coutHeureInstallation,
        facteurTempsInstallation: config.facteurTempsInstallation,
        facteurBarrotin: config.facteursPiedsLineaires?.barrotin || 1.25,
        facteurVerre: config.facteursPiedsLineaires?.verre || 1,
        facteurMur: config.facteursPiedsLineaires?.mur || 4,
        facteurMainDouble: config.facteursPiedsLineaires?.mainDouble || 2.25,
        facteurGardexVision: config.facteursPiedsLineaires?.gardexVision || 1,
        facteurGardexUrbaine: config.facteursPiedsLineaires?.gardexUrbaine || 2,
        facteurGardexOptimum: config.facteursPiedsLineaires?.gardexOptimum || 0.75,
      });
    }
  }, [config]);

  useEffect(() => {
    fetchCommandes();
    fetchRepresentants();
    fetchClients();
  }, [search, filters]);

  // Mettre à jour clientSearch quand filters.clientId change (ex: reset)
  useEffect(() => {
    if (filters.clientId) {
      const client = clients.find(c => c.id === filters.clientId);
      if (client) setClientSearch(client.nom);
    } else {
      setClientSearch("");
    }
  }, [filters.clientId, clients]);

  // Fermer le menu client quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showClientMenu && clientContainerRef.current && !clientContainerRef.current.contains(event.target as Node)) {
        setShowClientMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showClientMenu]);

  const fetchCommandes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.statut) params.append("statut", filters.statut);
      if (filters.type) params.append("type", filters.type);
      if (filters.service) params.append("service", filters.service);
      if (filters.representantId) params.append("representantId", filters.representantId);
      if (filters.clientId) params.append("clientId", filters.clientId);
      
      const res = await fetch(`/api/commandes?${params.toString()}`);
      const data = await res.json();
      setCommandes(data.commandes || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepresentants = async () => {
    try {
      const res = await fetch("/api/representants");
      if (res.ok) setRepresentants(await res.json());
    } catch (error) {
      console.error("Erreur chargement représentants:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) setClients(await res.json());
    } catch (error) {
      console.error("Erreur chargement clients:", error);
    }
  };

  const handleDelete = async (commande: Commande) => {
    try {
      await fetch(`/api/commandes/${commande.id}`, { method: "DELETE" });
      setDeleteModal(null);
      fetchCommandes();
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const resetFilters = () => {
    setFilters({ statut: "", type: "", service: "", representantId: "", clientId: "" });
    setSearch("");
  };

  // Gestion du mot de passe
  const handlePasswordSubmit = () => {
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
    if (passwordInput === ADMIN_PASSWORD) {
      setPasswordError(false);
      setShowPasswordModal(false);
      setPasswordInput("");
      setShowConfigModal(true);
    } else {
      setPasswordError(true);
    }
  };

  const saveConfig = async () => {
    try {
      const facteurs = {
        barrotin: configForm.facteurBarrotin,
        verre: configForm.facteurVerre,
        mur: configForm.facteurMur,
        mainDouble: configForm.facteurMainDouble,
        gardexVision: configForm.facteurGardexVision,
        gardexUrbaine: configForm.facteurGardexUrbaine,
        gardexOptimum: configForm.facteurGardexOptimum,
      };
      await fetch("/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coutHeureInstallation: configForm.coutHeureInstallation,
          facteurTempsInstallation: configForm.facteurTempsInstallation,
          facteursPiedsLineaires: facteurs,
        }),
      });
      setShowConfigModal(false);
      await refreshConfig(); // met à jour le contexte global
    } catch (error) {
      console.error("Erreur sauvegarde config:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton paramètres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commandes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gestion et suivi</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </button>
          <button
            onClick={() => router.push("/dashboard/commandes/nouveau")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
          >
            <Plus size={20} />
            <span>Nouvelle commande</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={<Package size={20} />} label="Total" value={stats.total} color="blue" />
            <StatCard icon={<CheckCircle2 size={20} />} label="Actives" value={stats.actives} color="green" />
            <StatCard icon={<Clock size={20} />} label="En attente" value={stats.parStatut.EN_ATTENTE || 0} color="yellow" />
            <StatCard icon={<TrendingUp size={20} />} label="En production" value={stats.enProduction} color="purple" />
            <StatCard icon={<AlertTriangle size={20} />} label="En retard" value={stats.enRetard} color="red" />
            <StatCard icon={<CheckCircle2 size={20} />} label="Complétées" value={stats.completees} color="emerald" />
          </div>

          {/* Stats par service */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ServiceStat label="Installation" value={stats.parService.INSTALLATION || 0} color="red" />
            <ServiceStat label="Livraison" value={stats.parService.LIVRAISON || 0} color="blue" />
            <ServiceStat label="Cueillette" value={stats.parService.CUEILLETTE || 0} color="yellow" />
            <ServiceStat label="Transport" value={stats.parService.TRANSPORT || 0} color="green" />
          </div>
        </>
      )}

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par numéro, client, référence..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border transition-colors ${
              showFilters || Object.values(filters).some(v => v)
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
          >
            <Filter size={20} />
            <span>Filtres</span>
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className="w-5 h-5 bg-white text-[var(--color-primary)] rounded-full text-xs font-bold flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
          {Object.values(filters).some(v => v) && (
            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <FilterX size={20} />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        {/* Filtres déroulants */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_CONFIG).map(([key, c]) => (
                <option key={key} value={key}>{c.label}</option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="">Tous les types</option>
              {Object.entries(TYPE_CONFIG).map(([key, c]) => (
                <option key={key} value={key}>{c.label}</option>
              ))}
            </select>
            <select
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="">Tous les services</option>
              {Object.entries(SERVICE_CONFIG).map(([key, c]) => (
                <option key={key} value={key}>{c.label}</option>
              ))}
            </select>
            <select
              value={filters.representantId}
              onChange={(e) => setFilters({ ...filters, representantId: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="">Tous les représentants</option>
              {representants.map(r => (
                <option key={r.id} value={r.id}>{r.nom}</option>
              ))}
            </select>

            {/* Recherche client avec autocomplete */}
            <div className="relative client-search-container" ref={clientContainerRef}>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  if (e.target.value === "") {
                    setFilters({ ...filters, clientId: "" });
                  }
                }}
                onFocus={() => setShowClientMenu(true)}
                placeholder="Rechercher un client..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              {showClientMenu && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {clients
                    .filter(c => c.nom.toLowerCase().includes(clientSearch.toLowerCase()))
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setFilters({ ...filters, clientId: c.id });
                          setClientSearch(c.nom);
                          setShowClientMenu(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                      >
                        {c.nom}
                      </div>
                    ))}
                </div>
              )}
              {filters.clientId && (
                <button
                  onClick={() => {
                    setFilters({ ...filters, clientId: "" });
                    setClientSearch("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Liste des commandes en cartes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 overflow-auto max-h-[calc(100vh-280px)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : commandes.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {commandes.map((c) => {
              const isLate = c.datePrevue && new Date(c.datePrevue) < new Date() && c.statut === "ACTIVE";
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/dashboard/commandes/${c.id}`)}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer space-y-3"
                >
                  {/* En-tête avec numéro et indicateurs */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white">{c.numero}</span>
                      {c.reprise && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">R</span>}
                      {isLate && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">!</span>}
                      {c.commentaire && (
                        <span className="relative group">
                          <MessageCircle size={14} className="text-blue-500" />
                          <span className="absolute left-0 top-full mt-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap z-50">
                            {c.commentaire}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_CONFIG[c.typeCommande].bgColor} ${TYPE_CONFIG[c.typeCommande].color}`}>
                      {TYPE_CONFIG[c.typeCommande].label}
                    </span>
                  </div>

                  {/* Section Client */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</h3>
                    <div className="mt-1 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">{c.client.nom}</div>
                      <div className="text-gray-500 text-xs">{c.client.telephone}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Réf: <span className="font-mono">{c.reference || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section Représentant */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Représentant</h3>
                    <div className="mt-1 text-sm text-gray-900 dark:text-white">
                      {c.representant?.nom || "—"}
                    </div>
                  </div>

                  {/* Section Service */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-white text-xs ${SERVICE_CONFIG[c.service].color}`}>
                        {SERVICE_CONFIG[c.service].icon}
                        <span>{SERVICE_CONFIG[c.service].label}</span>
                      </span>
                      <CouleurBadge couleur={c.couleur} />
                    </div>
                  </div>

                  {/* Section Dates */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</h3>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Entrée:</span> {formatDate(c.dateEntree)}
                      </div>
                      <div>
                        <span className="text-gray-500">Prévue:</span> {formatDate(c.datePrevue)}
                        <span className="block text-gray-400">{formatSemaine(c.datePrevue)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Production:</span> {formatDate(c.dateProduction)}
                      </div>
                      <div>
                        <span className="text-gray-500">Mesure:</span> {formatDate(c.datePriseMesure)}
                      </div>
                    </div>
                  </div>

                  {/* Section Codes production */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Production</h3>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs">
                      <div><span className="text-gray-500">Mesure:</span> <CodeSymbol code={c.mesure} /></div>
                      <div><span className="text-gray-500">Plan:</span> <CodeSymbol code={c.plan} /></div>
                      <div><span className="text-gray-500">Prod.:</span> <CodeSymbol code={c.envoyeProduction} /></div>
                      <div><span className="text-gray-500">Term.:</span> <CodeSymbol code={c.termine} /></div>
                      <div><span className="text-gray-500">Install.:</span> <CodeSymbol code={c.installation} /></div>
                    </div>
                  </div>

                  {/* Section Achats */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Achats</h3>
                    <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Fibre:</span> <CodeSymbol code={c.achatFibre} type="achat" />
                        {c.quantiteNonRecueFibre ? <span className="ml-1 text-red-500">({c.quantiteNonRecueFibre})</span> : null}
                      </div>
                      <div>
                        <span className="text-gray-500">Limons:</span> <CodeSymbol code={c.achatLimons} type="achat" />
                        {c.quantiteNonRecueLimons ? <span className="ml-1 text-red-500">({c.quantiteNonRecueLimons})</span> : null}
                      </div>
                      <div>
                        <span className="text-gray-500">Verres:</span> <CodeSymbol code={c.achatVerres} type="achat" />
                        {c.quantiteNonRecueVerres ? <span className="ml-1 text-red-500">({c.quantiteNonRecueVerres})</span> : null}
                      </div>
                      <div>
                        <span className="text-gray-500">Colonnes:</span> <CodeSymbol code={c.achatColonnes} type="achat" />
                      </div>
                      <div>
                        <span className="text-gray-500">Peinture:</span> <CodeSymbol code={c.achatPeinture} type="achat" />
                      </div>
                      <div>
                        <span className="text-gray-500">Attaches:</span> <CodeSymbol code={c.achatAttaches} type="achat" />
                      </div>
                      <div className="col-span-3">
                        <span className="text-gray-500">Plancher Alu:</span> <CodeSymbol code={c.achatPlancherAluminium} type="achat" />
                      </div>
                    </div>
                  </div>

                  {/* Adresse et actions */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between items-center">
                    <div className="text-xs text-gray-500 truncate max-w-[200px]" title={c.adresse}>
                      {c.adresse}
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === c.id ? null : c.id); }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <MoreHorizontal size={16} className="text-gray-500" />
                      </button>
                      {actionMenu === c.id && (
                        <div className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden text-xs">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/commandes/${c.id}`); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <Eye size={14} /> Voir
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/commandes/${c.id}/edit`); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <Edit size={14} /> Modifier
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteModal(c); setActionMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-[var(--color-primary)]" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Accès restreint</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Veuillez entrer le mot de passe pour accéder aux paramètres.
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl mb-2"
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            />
            {passwordError && (
              <p className="text-sm text-red-600 mb-2">Mot de passe incorrect</p>
            )}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordInput(""); setPasswordError(false); }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Paramètres */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres</h3>
              <button onClick={() => setShowConfigModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coût heure installation ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={configForm.coutHeureInstallation}
                  onChange={e => setConfigForm({...configForm, coutHeureInstallation: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facteur temps installation</label>
                <input
                  type="number"
                  step="0.01"
                  value={configForm.facteurTempsInstallation}
                  onChange={e => setConfigForm({...configForm, facteurTempsInstallation: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Barrotin</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configForm.facteurBarrotin}
                    onChange={e => setConfigForm({...configForm, facteurBarrotin: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Verre</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configForm.facteurVerre}
                    onChange={e => setConfigForm({...configForm, facteurVerre: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mur</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configForm.facteurMur}
                    onChange={e => setConfigForm({...configForm, facteurMur: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Main double</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configForm.facteurMainDouble}
                    onChange={e => setConfigForm({...configForm, facteurMainDouble: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gardex Vision</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configForm.facteurGardexVision}
                    onChange={e => setConfigForm({...configForm, facteurGardexVision: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gardex Urbaine</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configForm.facteurGardexUrbaine}
                    onChange={e => setConfigForm({...configForm, facteurGardexUrbaine: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gardex Optimum</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configForm.facteurGardexOptimum}
                    onChange={e => setConfigForm({...configForm, facteurGardexOptimum: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
              >
                Annuler
              </button>
              <button
                onClick={saveConfig}
                className="flex-1 px-4 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Supprimer la commande ?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer la commande <strong>{deleteModal.numero}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteModal)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composants auxiliaires
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
    emerald: "from-emerald-500 to-emerald-600",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">{icon}</div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-white/80 text-sm mt-1 font-medium">{label}</p>
    </div>
  );
}

function ServiceStat({ label, value, color }: { label: string; value: number; color: string }) {
  const bgColorMap = {
    red: "bg-red-100 dark:bg-red-900/20",
    blue: "bg-blue-100 dark:bg-blue-900/20",
    yellow: "bg-yellow-100 dark:bg-yellow-900/20",
    green: "bg-green-100 dark:bg-green-900/20",
  };
  const borderColorMap = {
    red: "border-red-200 dark:border-red-800",
    blue: "border-blue-200 dark:border-blue-800",
    yellow: "border-yellow-200 dark:border-yellow-800",
    green: "border-green-200 dark:border-green-800",
  };
  return (
    <div className={`${bgColorMap[color as keyof typeof bgColorMap]} rounded-xl p-4 border ${borderColorMap[color as keyof typeof borderColorMap]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
    </div>
  );
}