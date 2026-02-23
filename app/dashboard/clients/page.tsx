"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, Filter, MoreHorizontal, Edit, Trash2, Eye,
  Building2, User, Users, Award, Phone, MapPin,
  ChevronDown, Loader2, Home
} from "lucide-react";
import DeleteConfirmModal from "@/app/components/clients/DeleteConfirmModal";
import { determinerZoneResidentielle } from "@/lib/zoneUtils";

// Types
interface Client {
  id: string;
  nom: string;
  type: "ENTREPRENEUR" | "RESIDENTIEL" | "DISTRIBUTEUR" | "AMBASSADEUR";
  zoneResidentielle?: "RIVE_NORD" | "RIVE_SUD" | null;
  adresse: string;
  ville?: string | null;
  codePostal?: string | null;
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
  const [filterZone, setFilterZone] = useState<string>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showVilleMenu, setShowVilleMenu] = useState(false);
  const [showZoneMenu, setShowZoneMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        const clientsAvecZone = data.map((client: Client) => {
          if (client.type === "RESIDENTIEL") {
            const zone = determinerZoneResidentielle(client.ville, client.codePostal);
            if (zone && client.zoneResidentielle !== zone) {
              fetch(`/api/clients/${client.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zoneResidentielle: zone })
              }).catch(error => console.error(`❌ Erreur mise à jour ${client.nom}:`, error));
            }
            return { ...client, zoneResidentielle: zone || client.zoneResidentielle };
          }
          return client;
        });
        setClients(clientsAvecZone);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const villes = [...new Set(clients.map(c => c.ville).filter(Boolean))] as string[];

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.personne_Contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.telephone.includes(searchQuery) ||
      (client.ville && client.ville.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || client.type === filterType;
    const matchesVille = filterVille === "all" || client.ville === filterVille;
    const matchesZone = filterZone === "all" || client.zoneResidentielle === filterZone;
    return matchesSearch && matchesType && matchesVille && matchesZone;
  });

  const stats = {
    total: clients.length,
    entrepreneurs: clients.filter(c => c.type === "ENTREPRENEUR").length,
    residentiels: clients.filter(c => c.type === "RESIDENTIEL").length,
    distributeurs: clients.filter(c => c.type === "DISTRIBUTEUR").length,
    ambassadeurs: clients.filter(c => c.type === "AMBASSADEUR").length,
  };

  const statsResidentiel = {
    riveNord: clients.filter(c => c.type === "RESIDENTIEL" && c.zoneResidentielle === "RIVE_NORD").length,
    riveSud: clients.filter(c => c.type === "RESIDENTIEL" && c.zoneResidentielle === "RIVE_SUD").length,
    sansZone: clients.filter(c => c.type === "RESIDENTIEL" && !c.zoneResidentielle).length,
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClients();
        setShowDeleteModal(false);
        setSelectedClient(null);
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Gestion des clients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez votre base de clients</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/clients/nouveau")}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Ajouter client</span>
        </button>
      </div>

      {/* Stats - style comme commandes */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-4">
        <StatCard
          title={<><span className="hidden xs:inline">Total clients</span><span className="xs:hidden">Total</span></>}
          value={stats.total}
          icon={Users}
          color="gray"
        />
        <StatCard
          title={<><span className="hidden xs:inline">Entrepreneurs</span><span className="xs:hidden">Entrep.</span></>}
          value={stats.entrepreneurs}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title={<><span className="hidden xs:inline">Résidentiels</span><span className="xs:hidden">Résid.</span></>}
          value={stats.residentiels}
          icon={User}
          color="emerald"
        />
        <StatCard
          title={<><span className="hidden xs:inline">Rive Nord</span><span className="xs:hidden">N</span></>}
          value={statsResidentiel.riveNord}
          icon={Home}
          color="blueLight"
          subtitle={stats.residentiels > 0 ? `${Math.round((statsResidentiel.riveNord / stats.residentiels) * 100)}%` : undefined}
        />
        <StatCard
          title={<><span className="hidden xs:inline">Rive Sud</span><span className="xs:hidden">S</span></>}
          value={statsResidentiel.riveSud}
          icon={Home}
          color="greenLight"
          subtitle={stats.residentiels > 0 ? `${Math.round((statsResidentiel.riveSud / stats.residentiels) * 100)}%` : undefined}
        />
        <StatCard
          title={<><span className="hidden xs:inline">Distributeurs</span><span className="xs:hidden">Dist.</span></>}
          value={stats.distributeurs}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title={<><span className="hidden xs:inline">Ambassadeurs</span><span className="xs:hidden">Amb.</span></>}
          value={stats.ambassadeurs}
          icon={Award}
          color="orange"
        />
      </div>

      {/* Search & Filters (inchangé) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, ville, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-sm text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Filter Type */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">
                {filterType === "all" ? "Tous les types" : typeConfig[filterType as keyof typeof typeConfig]?.label}
              </span>
              <span className="sm:hidden">Type</span>
              <ChevronDown size={14} />
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  <button onClick={() => { setFilterType("all"); setShowFilterMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white">
                    Tous les types
                  </button>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <button key={key} onClick={() => { setFilterType(key); setShowFilterMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                      {config.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filter Zone */}
          <div className="relative">
            <button
              onClick={() => setShowZoneMenu(!showZoneMenu)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300"
            >
              <Home size={16} />
              <span className="hidden sm:inline">
                {filterZone === "all" ? "Toutes les zones" : 
                 filterZone === "RIVE_NORD" ? "Rive Nord" : "Rive Sud"}
              </span>
              <span className="sm:hidden">Zone</span>
              <ChevronDown size={14} />
            </button>
            {showZoneMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowZoneMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  <button onClick={() => { setFilterZone("all"); setShowZoneMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white">
                    Toutes les zones
                  </button>
                  <button onClick={() => { setFilterZone("RIVE_NORD"); setShowZoneMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Rive Nord
                  </button>
                  <button onClick={() => { setFilterZone("RIVE_SUD"); setShowZoneMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Rive Sud
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Filter Ville */}
          {villes.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowVilleMenu(!showVilleMenu)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300"
              >
                <MapPin size={16} />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {filterVille === "all" ? "Toutes les villes" : filterVille}
                </span>
                <span className="sm:hidden">Ville</span>
                <ChevronDown size={14} />
              </button>
              {showVilleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowVilleMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
                    <button onClick={() => { setFilterVille("all"); setShowVilleMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white">
                      Toutes les villes
                    </button>
                    {villes.map((ville) => (
                      <button key={ville} onClick={() => { setFilterVille(ville); setShowVilleMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white truncate">
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

      {/* Table (inchangée) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Zone</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Contact</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Ville</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Téléphone</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group" onClick={() => router.push(`/dashboard/clients/${client.id}`)}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-md" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}>
                          {client.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{client.nom}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-[150px] sm:max-w-[200px]"><MapPin size={10} className="sm:w-3 sm:h-3" />{client.adresse}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border ${typeConfig[client.type].color}`}>
                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${typeConfig[client.type].dotColor}`} />
                        <span className="hidden sm:inline">{typeConfig[client.type].label}</span>
                        <span className="sm:hidden">
                          {client.type === "ENTREPRENEUR" ? "E" : 
                           client.type === "RESIDENTIEL" ? "R" :
                           client.type === "DISTRIBUTEUR" ? "D" : "A"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {client.type === "RESIDENTIEL" ? (
                        client.zoneResidentielle ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
                            client.zoneResidentielle === "RIVE_NORD" 
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          }`}>
                            <Home size={12} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">
                              {client.zoneResidentielle === "RIVE_NORD" ? "Rive Nord" : "Rive Sud"}
                            </span>
                            <span className="sm:hidden">
                              {client.zoneResidentielle === "RIVE_NORD" ? "N" : "S"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs flex items-center gap-1">
                            <Home size={12} className="opacity-50" />
                            <span className="hidden sm:inline">À détecter</span>
                            <span className="sm:hidden">—</span>
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell text-sm text-gray-900 dark:text-white">{client.personne_Contact}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden lg:table-cell text-sm text-gray-600 dark:text-gray-300">{client.ville || "—"}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                        <Phone size={14} />{client.telephone}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button onClick={() => setActiveActionMenu(activeActionMenu === client.id ? null : client.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                          <MoreHorizontal size={16} className="sm:w-5 sm:h-5" />
                        </button>
                        {activeActionMenu === client.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveActionMenu(null)} />
                            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                              <button onClick={() => { router.push(`/dashboard/clients/${client.id}`); setActiveActionMenu(null); }} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 text-sm text-gray-700 dark:text-gray-300">
                                <Eye size={14} className="sm:w-4 sm:h-4" />Voir
                              </button>
                              <button onClick={() => { router.push(`/dashboard/clients/${client.id}/edit`); setActiveActionMenu(null); }} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 text-sm text-gray-700 dark:text-gray-300">
                                <Edit size={14} className="sm:w-4 sm:h-4" />Modifier
                              </button>
                              <button onClick={() => { setSelectedClient(client); setShowDeleteModal(true); setActiveActionMenu(null); }} className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 sm:gap-3 text-sm text-red-600">
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />Supprimer
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
        <DeleteConfirmModal 
          clientName={selectedClient.nom} 
          onClose={() => { setShowDeleteModal(false); setSelectedClient(null); }} 
          onConfirm={handleDeleteConfirm}
          hasCommandes={selectedClient._count?.commandes ? selectedClient._count.commandes > 0 : false}
          commandesCount={selectedClient._count?.commandes || 0}
        />
      )}
    </div>
  );
}

// Composant StatCard reprenant le style des commandes
function StatCard({ title, value, icon: Icon, color, subtitle }: { 
  title: React.ReactNode; 
  value: number; 
  icon: React.ElementType; 
  color: string; 
  subtitle?: string;
}) {
  const colors: Record<string, string> = {
    gray: "from-gray-600 to-gray-700",
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    blueLight: "from-blue-400 to-blue-500",
    greenLight: "from-green-400 to-green-500",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-3 sm:p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
          <Icon size={16} className="sm:w-5 sm:h-5" />
        </div>
        <span className="text-lg sm:text-2xl font-bold">{value}</span>
      </div>
      <div className="text-white/80 text-xs sm:text-sm mt-1 font-medium">{title}</div>
      {subtitle && (
        <div className="text-white/60 text-[10px] sm:text-xs mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}