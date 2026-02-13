"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Filter, Package, Truck, Wrench, Clock, AlertTriangle,
  ChevronDown, MoreHorizontal, Eye, Edit, Trash2, Calendar, Building2,
  CheckCircle2, XCircle, Loader2, TrendingUp, Box, Ruler, Layers
} from "lucide-react";

// Types
interface Client { id: string; nom: string; type: string; telephone: string; personne_Contact: string; }
interface Representant { id: string; nom: string; }
interface Balcon { id: string; nom: string; numeroPhase: number; piedsLineaires: number; poteaux: number; }
interface Commande {
  id: string; numero: string; reference: string | null;
  typeCommande: string; service: string; statut: string; activite: string;
  adresse: string; client: Client; representant: Representant | null;
  dateEntree: string; datePrevue: string | null; dateProduction: string | null;
  prixTotal: number; prixVenteMateriaux: number; prixVenteInstallation: number;
  enProduction: boolean; reprise: boolean;
  piedsLineairesRampes: number; nombrePoteaux: number;
  mesure: string | null; plan: string | null; envoyeProduction: string | null;
  productionTerminee: string | null; termine: string | null;
  achatFibre: string | null; achatLimons: string | null; achatVerres: string | null;
  balcons: Balcon[]; _count: { interventions: number; reprises: number };
}
interface Stats {
  total: number;
  parStatut: Record<string, number>;
  parType: Record<string, number>;
  parService: Record<string, number>;
  enProduction: number;
  enRetard: number;
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
  INSTALLATION: { label: "Installation", color: "bg-blue-500", icon: <Wrench size={14} /> },
  LIVRAISON: { label: "Livraison", color: "bg-green-500", icon: <Truck size={14} /> },
  CUEILLETTE: { label: "Cueillette", color: "bg-yellow-500", icon: <Package size={14} /> },
  TRANSPORT: { label: "Transport", color: "bg-purple-500", icon: <Truck size={14} /> },
  MESURE: { label: "Mesure", color: "bg-orange-500", icon: <Ruler size={14} /> },
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  ACTIVE: { label: "Active", color: "text-green-700", bgColor: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 size={14} /> },
  EN_ATTENTE: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", icon: <Clock size={14} /> },
  COMPLETEE: { label: "Complétée", color: "text-blue-700", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: <CheckCircle2 size={14} /> },
  ANNULEE: { label: "Annulée", color: "text-red-700", bgColor: "bg-red-100 dark:bg-red-900/30", icon: <XCircle size={14} /> },
};

// Fonction pour formater les dates
const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" });
};

const formatSemaine = (date: string | null) => {
  if (!date) return "—";
  const d = new Date(date);
  const week = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  return `S${week}`;
};

// Composant pour afficher un symbole de code
const CodeSymbol = ({ code, type = "production" }: { code: string | null; type?: "production" | "achat" }) => {
  if (!code) return <span className="text-gray-400">—</span>;
  const symbols = type === "achat" ? ACHAT_SYMBOLS : CODE_SYMBOLS;
  const config = symbols[code];
  if (!config) return <span className="text-gray-400">{code}</span>;
  return <span className={`font-bold ${config.color}`}>{config.symbol}</span>;
};

export default function CommandesPage() {
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ statut: "", type: "", service: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Commande | null>(null);

  useEffect(() => { fetchCommandes(); }, [search, filters]);

  const fetchCommandes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.statut) params.append("statut", filters.statut);
      if (filters.type) params.append("type", filters.type);
      if (filters.service) params.append("service", filters.service);
      
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

  const handleDelete = async (commande: Commande) => {
    try {
      await fetch(`/api/commandes/${commande.id}`, { method: "DELETE" });
      setDeleteModal(null);
      fetchCommandes();
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Commandes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestion des commandes et suivi</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/commandes/nouveau")}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
        >
          <Plus size={20} />
          <span>Nouvelle commande</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard icon={<Package />} label="Total" value={stats.total} color="blue" />
          <StatCard icon={<CheckCircle2 />} label="Actives" value={stats.parStatut.ACTIVE || 0} color="green" />
          <StatCard icon={<Clock />} label="En attente" value={stats.parStatut.EN_ATTENTE || 0} color="yellow" />
          <StatCard icon={<TrendingUp />} label="En production" value={stats.enProduction} color="purple" />
          <StatCard icon={<AlertTriangle />} label="En retard" value={stats.enRetard} color="red" />
          <StatCard icon={<CheckCircle2 />} label="Complétées" value={stats.parStatut.COMPLETEE || 0} color="emerald" />
        </div>
      )}

      {/* Stats par Type */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <div key={key} className={`${config.bgColor} rounded-xl p-4 border border-transparent`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                <span className={`text-2xl font-bold ${config.color}`}>{stats.parType[key] || 0}</span>
              </div>
            </div>
          ))}
        </div>
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
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || filters.statut || filters.type || filters.service
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filtres</span>
            {(filters.statut || filters.type || filters.service) && (
              <span className="w-5 h-5 bg-white text-[var(--color-primary)] rounded-full text-xs font-bold flex items-center justify-center">
                {[filters.statut, filters.type, filters.service].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filtres déroulants */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="">Tous les types</option>
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filters.service}
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
            >
              <option value="">Tous les services</option>
              {Object.entries(SERVICE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Liste des commandes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Commande</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Service</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Mesure</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Plan</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Prod.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden xl:table-cell">Fibre</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden xl:table-cell">Limons</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden xl:table-cell">Verres</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Date prévue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {commandes.map((commande) => {
                  const typeConfig = TYPE_CONFIG[commande.typeCommande];
                  const serviceConfig = SERVICE_CONFIG[commande.service];
                  const statutConfig = STATUT_CONFIG[commande.statut];
                  const isLate = commande.datePrevue && new Date(commande.datePrevue) < new Date() && commande.statut === "ACTIVE";

                  return (
                    <tr
                      key={commande.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/commandes/${commande.id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white">{commande.numero}</span>
                            {commande.reprise && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">REPRISE</span>}
                            {isLate && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">RETARD</span>}
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit mt-1 ${typeConfig.bgColor} ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{commande.client.nom}</span>
                          <span className="text-xs text-gray-500">{commande.client.telephone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-medium ${serviceConfig.color}`}>
                          {serviceConfig.icon}
                          {serviceConfig.label}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center hidden lg:table-cell"><CodeSymbol code={commande.mesure} /></td>
                      <td className="px-4 py-4 text-center hidden lg:table-cell"><CodeSymbol code={commande.plan} /></td>
                      <td className="px-4 py-4 text-center hidden lg:table-cell"><CodeSymbol code={commande.envoyeProduction} /></td>
                      <td className="px-4 py-4 text-center hidden xl:table-cell"><CodeSymbol code={commande.achatFibre} type="achat" /></td>
                      <td className="px-4 py-4 text-center hidden xl:table-cell"><CodeSymbol code={commande.achatLimons} type="achat" /></td>
                      <td className="px-4 py-4 text-center hidden xl:table-cell"><CodeSymbol code={commande.achatVerres} type="achat" /></td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 dark:text-white">{formatDate(commande.datePrevue)}</span>
                          <span className="text-xs text-gray-500">{formatSemaine(commande.datePrevue)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${statutConfig.bgColor} ${statutConfig.color}`}>
                          {statutConfig.icon}
                          <span className="hidden sm:inline">{statutConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === commande.id ? null : commande.id); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <MoreHorizontal size={18} className="text-gray-500" />
                          </button>
                          {actionMenu === commande.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/commandes/${commande.id}`); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                <Eye size={16} />Voir détails
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/commandes/${commande.id}/edit`); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                <Edit size={16} />Modifier
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteModal(commande); setActionMenu(null); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                              >
                                <Trash2 size={16} />Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de suppression */}
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

// Composant StatCard
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
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-white/80 text-sm mt-2 font-medium">{label}</p>
    </div>
  );
}