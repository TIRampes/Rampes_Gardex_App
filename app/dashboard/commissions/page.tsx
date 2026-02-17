"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, ChevronDown, Loader2, 
  DollarSign, Percent, Calendar, User, Building2,
  CheckCircle, XCircle, AlertCircle, Clock,
  FileText, Download, TrendingUp, Home,
  ChevronLeft, ChevronRight
} from "lucide-react";

// Types
interface Commission {
  id: string;
  commandeId: string;
  commande: {
    numero: string;
    client: {
      nom: string;
    };
  };
  representant: {
    id: string;
    nom: string;
  };
  montantSoumission: number;
  pourcentage: number;
  montantCommission: number;
  statut: "EN_ATTENTE" | "CALCULEE" | "PAYEE" | "ANNULEE";
  paye: boolean;
  datePaiement?: string;
  numeroFacture?: string;
  depotGarantie?: number;
  motifDeficience?: string;
  dateSoumission: string;
}

interface Representant {
  id: string;
  nom: string;
}

interface Statistiques {
  totalCommissions: number;
  montantTotal: number;
  montantPaye: number;
  montantEnAttente: number;
  commissionsPayees: number;
  commissionsEnAttente: number;
}

const statutConfig = {
  EN_ATTENTE: { 
    label: "En attente", 
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    icon: Clock,
    bg: "from-yellow-500 to-yellow-600"
  },
  CALCULEE: { 
    label: "Calculée", 
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: TrendingUp,
    bg: "from-blue-500 to-blue-600"
  },
  PAYEE: { 
    label: "Payée", 
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle,
    bg: "from-green-500 to-green-600"
  },
  ANNULEE: { 
    label: "Annulée", 
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
    bg: "from-red-500 to-red-600"
  },
};

export default function CommissionsPage() {
  const router = useRouter();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterRepresentant, setFilterRepresentant] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [showStatutMenu, setShowStatutMenu] = useState(false);
  const [showRepresentantMenu, setShowRepresentantMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchCommissions();
    fetchRepresentants();
  }, []);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/commissions");
      if (res.ok) {
        const data = await res.json();
        setCommissions(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepresentants = async () => {
    try {
      const res = await fetch("/api/representants");
      if (res.ok) {
        const data = await res.json();
        setRepresentants(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Calcul des statistiques
  const stats: Statistiques = {
    totalCommissions: commissions.length,
    montantTotal: commissions.reduce((acc, c) => acc + c.montantCommission, 0),
    montantPaye: commissions.filter(c => c.paye).reduce((acc, c) => acc + c.montantCommission, 0),
    montantEnAttente: commissions.filter(c => !c.paye && c.statut !== "ANNULEE").reduce((acc, c) => acc + c.montantCommission, 0),
    commissionsPayees: commissions.filter(c => c.paye).length,
    commissionsEnAttente: commissions.filter(c => !c.paye && c.statut !== "ANNULEE").length,
  };

  // Filtrage
  const filteredCommissions = commissions.filter((commission) => {
    const matchesSearch = 
      commission.commande.client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.commande.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commission.representant.nom.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatut = filterStatut === "all" || commission.statut === filterStatut;
    const matchesRepresentant = filterRepresentant === "all" || commission.representant.id === filterRepresentant;
    
    let matchesDate = true;
    if (dateDebut) {
      matchesDate = new Date(commission.dateSoumission) >= new Date(dateDebut);
    }
    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59);
      matchesDate = matchesDate && new Date(commission.dateSoumission) <= fin;
    }
    
    return matchesSearch && matchesStatut && matchesRepresentant && matchesDate;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCommissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCommissions.length / itemsPerPage);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des commissions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Suivez et gérez les commissions des représentants
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/commissions/nouveau")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
        >
          <FileText size={20} />
          <span>Nouvelle commission</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard 
          title="Total commissions" 
          value={stats.totalCommissions} 
          icon={DollarSign} 
          color="from-gray-600 to-gray-700"
        />
        <StatCard 
          title="Montant total" 
          value={formatCurrency(stats.montantTotal)} 
          icon={TrendingUp} 
          color="from-blue-500 to-blue-600"
          isCurrency
        />
        <StatCard 
          title="Payé" 
          value={formatCurrency(stats.montantPaye)} 
          icon={CheckCircle} 
          color="from-green-500 to-green-600"
          isCurrency
          subtitle={`${stats.commissionsPayees} commission(s)`}
        />
        <StatCard 
          title="En attente" 
          value={formatCurrency(stats.montantEnAttente)} 
          icon={Clock} 
          color="from-yellow-500 to-yellow-600"
          isCurrency
          subtitle={`${stats.commissionsEnAttente} commission(s)`}
        />
        <StatCard 
          title="Taux moyen" 
          value={commissions.length > 0 
            ? `${(commissions.reduce((acc, c) => acc + c.pourcentage, 0) / commissions.length).toFixed(1)}%` 
            : "0%"
          } 
          icon={Percent} 
          color="from-purple-500 to-purple-600"
        />
        <StatCard 
          title="Représentants" 
          value={representants.length} 
          icon={User} 
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par client, numéro, représentant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtre Statut */}
          <div className="relative">
            <button
              onClick={() => setShowStatutMenu(!showStatutMenu)}
              className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 min-w-[160px]"
            >
              <Filter size={18} />
              <span>
                {filterStatut === "all" ? "Tous les statuts" : statutConfig[filterStatut as keyof typeof statutConfig]?.label}
              </span>
              <ChevronDown size={16} className="ml-auto" />
            </button>
            {showStatutMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStatutMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  <button 
                    onClick={() => { setFilterStatut("all"); setShowStatutMenu(false); }} 
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    Tous les statuts
                  </button>
                  {Object.entries(statutConfig).map(([key, config]) => (
                    <button 
                      key={key} 
                      onClick={() => { setFilterStatut(key); setShowStatutMenu(false); }} 
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-white"
                    >
                      <span className={`w-3 h-3 rounded-full ${config.color.split(' ')[0]}`} />
                      {config.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filtre Représentant */}
          <div className="relative">
            <button
              onClick={() => setShowRepresentantMenu(!showRepresentantMenu)}
              className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 min-w-[160px]"
            >
              <User size={18} />
              <span>
                {filterRepresentant === "all" 
                  ? "Tous les représentants" 
                  : representants.find(r => r.id === filterRepresentant)?.nom}
              </span>
              <ChevronDown size={16} className="ml-auto" />
            </button>
            {showRepresentantMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRepresentantMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto">
                  <button 
                    onClick={() => { setFilterRepresentant("all"); setShowRepresentantMenu(false); }} 
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    Tous les représentants
                  </button>
                  {representants.map((rep) => (
                    <button 
                      key={rep.id} 
                      onClick={() => { setFilterRepresentant(rep.id); setShowRepresentantMenu(false); }} 
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {rep.nom}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filtres Date */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              placeholder="Date début"
            />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              placeholder="Date fin"
            />
          </div>
        </div>
      </div>

      {/* Tableau des commissions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : filteredCommissions.length === 0 ? (
          <div className="text-center py-20">
            <DollarSign className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune commission trouvée</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Projet</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Représentant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date soumission</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">%</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Commission</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Payé</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {currentItems.map((commission) => {
                    const StatutIcon = statutConfig[commission.statut].icon;
                    return (
                      <tr 
                        key={commission.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group"
                        onClick={() => router.push(`/dashboard/commissions/${commission.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-bold">
                              {commission.commande.numero.slice(0, 2)}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {commission.commande.numero}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                          {commission.commande.client.nom}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {commission.representant.nom}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {formatDate(commission.dateSoumission)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {formatCurrency(commission.montantSoumission)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                            <Percent size={12} />
                            {commission.pourcentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[var(--color-primary)]">
                          {formatCurrency(commission.montantCommission)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${statutConfig[commission.statut].color}`}>
                            <StatutIcon size={12} />
                            {statutConfig[commission.statut].label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {commission.paye ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle size={16} />
                              <span className="text-sm">Payé</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400">
                              <XCircle size={16} />
                              <span className="text-sm">Non payé</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/commissions/${commission.id}/edit`);
                            }}
                            className="px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Affichage {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredCommissions.length)} sur {filteredCommissions.length} commissions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Composant pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  isCurrency?: boolean;
}

function StatCard({ title, value, icon: Icon, color, subtitle, isCurrency }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold text-gray-900 dark:text-white mt-1 ${isCurrency ? 'font-mono' : ''}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}