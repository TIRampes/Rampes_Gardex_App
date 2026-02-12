"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, Filter, MoreHorizontal, Edit, Trash2, Eye,
  Building2, User, Users, Award, Phone, MapPin,
  ChevronDown, Loader2
} from "lucide-react";
import DeleteConfirmModal from "@/app/components/clients/DeleteConfirmModal";

// Types
interface Client {
  id: string;
  nom: string;
  type: "ENTREPRENEUR" | "RESIDENTIEL" | "DISTRIBUTEUR" | "AMBASSADEUR";
  adresse: string;
  ville?: string | null;
  telephone: string;
  personne_Contact: string;
  emails: string[];
  _count?: { commandes: number };
}

const typeConfig = {
  ENTREPRENEUR: { label: "Entrepreneur", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", dotColor: "bg-blue-500" },
  RESIDENTIEL: { label: "Résidentiel", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", dotColor: "bg-emerald-500" },
  DISTRIBUTEUR: { label: "Distributeur", color: "bg-purple-500/10 text-purple-600 border-purple-500/30", dotColor: "bg-purple-500" },
  AMBASSADEUR: { label: "Ambassadeur", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", dotColor: "bg-amber-500" },
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterVille, setFilterVille] = useState<string>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showVilleMenu, setShowVilleMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extraire les villes uniques pour le filtre
  const villes = [...new Set(clients.map(c => c.ville).filter(Boolean))] as string[];

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.personne_Contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.telephone.includes(searchQuery) ||
      (client.ville && client.ville.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || client.type === filterType;
    const matchesVille = filterVille === "all" || client.ville === filterVille;
    return matchesSearch && matchesType && matchesVille;
  });

  const stats = {
    total: clients.length,
    entrepreneurs: clients.filter(c => c.type === "ENTREPRENEUR").length,
    residentiels: clients.filter(c => c.type === "RESIDENTIEL").length,
    ambassadeurs: clients.filter(c => c.type === "AMBASSADEUR").length,
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClients();
        setShowDeleteModal(false);
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Gestion des clients</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez votre base de clients</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/clients/nouveau")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
        >
          <Plus size={20} />
          <span>Ajouter client</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total clients" value={stats.total} icon={Users} color="from-gray-600 to-gray-700" />
        <StatCard title="Entrepreneurs" value={stats.entrepreneurs} icon={Building2} color="from-blue-500 to-blue-600" />
        <StatCard title="Résidentiels" value={stats.residentiels} icon={User} color="from-emerald-500 to-emerald-600" />
        <StatCard title="Ambassadeurs" value={stats.ambassadeurs} icon={Award} color="from-amber-500 to-amber-600" />
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, ville, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Filter Type */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
            >
              <Filter size={18} />
              <span>{filterType === "all" ? "Tous les types" : typeConfig[filterType as keyof typeof typeConfig]?.label}</span>
              <ChevronDown size={16} />
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  <button onClick={() => { setFilterType("all"); setShowFilterMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                    Tous les types
                  </button>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <button key={key} onClick={() => { setFilterType(key); setShowFilterMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-white">
                      <span className={`w-3 h-3 rounded-full ${config.dotColor}`} />
                      {config.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filter Ville */}
          {villes.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowVilleMenu(!showVilleMenu)}
                className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
              >
                <MapPin size={18} />
                <span>{filterVille === "all" ? "Toutes les villes" : filterVille}</span>
                <ChevronDown size={16} />
              </button>
              {showVilleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowVilleMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto">
                    <button onClick={() => { setFilterVille("all"); setShowVilleMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                      Toutes les villes
                    </button>
                    {villes.map((ville) => (
                      <button key={ville} onClick={() => { setFilterVille(ville); setShowVilleMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                        {ville}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Ville</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Téléphone</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}>
                          {client.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{client.nom}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 truncate max-w-[200px]"><MapPin size={12} />{client.adresse}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${typeConfig[client.type].color}`}>
                        <span className={`w-2 h-2 rounded-full ${typeConfig[client.type].dotColor}`} />
                        {typeConfig[client.type].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-900 dark:text-white">{client.personne_Contact}</td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-600 dark:text-gray-300">{client.ville || "—"}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Phone size={14} />{client.telephone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button onClick={() => setActiveActionMenu(activeActionMenu === client.id ? null : client.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                          <MoreHorizontal size={20} />
                        </button>
                        {activeActionMenu === client.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveActionMenu(null)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                              <button onClick={() => { router.push(`/dashboard/clients/${client.id}`); setActiveActionMenu(null); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <Eye size={18} />Voir détails
                              </button>
                              <button onClick={() => { router.push(`/dashboard/clients/${client.id}/edit`); setActiveActionMenu(null); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <Edit size={18} />Modifier
                              </button>
                              <button onClick={() => { setSelectedClient(client); setShowDeleteModal(true); setActiveActionMenu(null); }} className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600">
                                <Trash2 size={18} />Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteModal && selectedClient && (
        <DeleteConfirmModal clientName={selectedClient.nom} onClose={() => { setShowDeleteModal(false); setSelectedClient(null); }} onConfirm={handleDeleteConfirm} />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}