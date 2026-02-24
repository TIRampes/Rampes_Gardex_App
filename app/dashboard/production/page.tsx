"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Factory, ChevronLeft, ChevronRight, Search, Loader2,
  RefreshCw, Eye, Package, CheckCircle,
  Layers, TrendingUp
} from "lucide-react";

// ============================================
// TYPES
// ============================================
interface Client { id: string; nom: string; telephone?: string; type: string; }
interface Representant { id: string; nom: string; }
interface Balcon { id: string; nom: string; piedsLineaires: number; poteaux: number; produit: boolean; installationTerminee: boolean; }

interface Commande {
  id: string; numero: string; reference?: string; typeCommande: string; service: string; statut: string;
  adresse: string; couleur?: string; reprise: boolean; commentaire?: string;
  client: Client; representant?: Representant; balcons: Balcon[];
  dateEntree: string; datePrevue?: string; dateProduction?: string; datePriseMesure?: string; semainePrevue?: string;
  prixTotal: number; piedsLineairesRampes: number; nombrePoteaux: number;
  mesure?: string; mesureDonneeLe?: string; plan?: string; envoyeProduction?: string;
  productionTerminee?: string; termine?: string; installation?: string; statutLivraison?: string; enProduction: boolean;
  achatFibre?: string; achatLimons?: string; achatVerres?: string; achatColonnes?: string;
  achatPeinture?: string; achatAttaches?: string; achatPlancherAluminium?: string;
}

interface Stats {
  total: number; enProduction: number; semaineEnCours: number;
  parEtape: {
    mesure: { complete: number; enAttente: number; partiel: number };
    plan: { complete: number; enAttente: number; partiel: number };
    envoyeProduction: { complete: number; enAttente: number };
    productionTerminee: { complete: number; partiel: number };
    termine: { complete: number };
    installation: { complete: number; partiel: number };
    livre: number;
  };
  parService: Record<string, number>;
  piedsLineairesTotaux: number; piedsLineairesSemaine: number;
}

interface Semaine { numero: number; annee: number; debut: string; fin: string; }

// ============================================
// CONSTANTES
// ============================================
const CODE_PRODUCTION = [
  { value: "", label: "—", symbol: "—", color: "text-gray-400", bg: "bg-gray-100" },
  { value: "COMPLETE", label: "Complété", symbol: "✓", color: "text-green-700", bg: "bg-green-100" },
  { value: "ATTENTE_CLIENT", label: "Att. Client", symbol: "At.C", color: "text-orange-700", bg: "bg-orange-100" },
  { value: "NON_APPLICABLE", label: "N/A", symbol: "N/A", color: "text-gray-600", bg: "bg-gray-200" },
  { value: "PARTIEL", label: "Partiel", symbol: "P", color: "text-blue-700", bg: "bg-blue-100" },
  { value: "DOSSIER_MESUREUR", label: "Dossier", symbol: "D", color: "text-purple-700", bg: "bg-purple-100" },
  { value: "MODIFICATION", label: "Modif.", symbol: "M", color: "text-yellow-700", bg: "bg-yellow-100" },
  { value: "ATTENTE_CAROL_CONFIRM", label: "Carol Conf.", symbol: "C-C", color: "text-pink-700", bg: "bg-pink-100" },
  { value: "ATTENTE_CAROL_MESURE", label: "Carol Mes.", symbol: "C-RM", color: "text-pink-700", bg: "bg-pink-100" },
  { value: "BACK_ORDER", label: "Back Order", symbol: "B/O", color: "text-red-700", bg: "bg-red-100" },
  { value: "ATTENTE_REPRESENTANT", label: "Att. Rep.", symbol: "At.Rep", color: "text-indigo-700", bg: "bg-indigo-100" },
];

const STATUT_LIVRAISON = [
  { value: "N_A", label: "N/A", symbol: "—", color: "text-gray-500", bg: "bg-gray-100" },
  { value: "LIVRE", label: "Livré", symbol: "✓", color: "text-green-700", bg: "bg-green-100" },
];

const STATUT_ACHAT = [
  { value: "", label: "—", symbol: "—", color: "text-gray-400", bg: "bg-gray-100" },
  { value: "A_FAIRE", label: "À faire", symbol: "①", color: "text-gray-700", bg: "bg-gray-200" },
  { value: "FAIT", label: "Fait", symbol: "✓", color: "text-green-700", bg: "bg-green-100" },
  { value: "RECEPTIONNE", label: "Reçu", symbol: "R", color: "text-blue-700", bg: "bg-blue-100" },
  { value: "PRET_A_RAMASSER", label: "Prêt", symbol: "P", color: "text-purple-700", bg: "bg-purple-100" },
  { value: "BACK_ORDER", label: "B/O", symbol: "B/O", color: "text-red-700", bg: "bg-red-100" },
];

const SERVICE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  INSTALLATION: { bg: "bg-red-500", text: "text-white", icon: "🔧" },
  LIVRAISON: { bg: "bg-blue-500", text: "text-white", icon: "🚚" },
  CUEILLETTE: { bg: "bg-yellow-500", text: "text-white", icon: "📦" },
  TRANSPORT: { bg: "bg-green-500", text: "text-white", icon: "🚛" },
};

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

// ============================================
// COMPOSANTS
// ============================================
function CodeBadge({ value, field, commandeId, onUpdate }: { value?: string; field: string; commandeId: string; onUpdate: (id: string, field: string, value: string) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const codeInfo = CODE_PRODUCTION.find(c => c.value === value) || CODE_PRODUCTION[0];

  const handleSelect = async (newValue: string) => {
    setUpdating(true);
    await onUpdate(commandeId, field, newValue);
    setUpdating(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} disabled={updating} className={`text-[0.625rem] px-1.5 py-0.5 rounded font-medium transition-all hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 ${codeInfo.bg} ${codeInfo.color} ${updating ? "opacity-50" : ""}`}>
        {updating ? "..." : codeInfo.symbol}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-32 max-h-64 overflow-y-auto">
            {CODE_PRODUCTION.map(code => (
              <button key={code.value} onClick={() => handleSelect(code.value)} className={`w-full px-3 py-1.5 text-left text-[0.75rem] hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${code.value === value ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                <span className={`${code.bg} ${code.color} px-1.5 py-0.5 rounded text-[0.625rem] font-medium`}>{code.symbol}</span>
                <span>{code.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LivraisonBadge({ value, commandeId, onUpdate }: { value?: string; commandeId: string; onUpdate: (id: string, field: string, value: string) => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const info = STATUT_LIVRAISON.find(s => s.value === value) || STATUT_LIVRAISON[0];

  const handleSelect = async (newValue: string) => {
    setUpdating(true);
    await onUpdate(commandeId, "statutLivraison", newValue);
    setUpdating(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} disabled={updating} className={`text-[0.625rem] px-1.5 py-0.5 rounded font-medium transition-all hover:ring-2 hover:ring-offset-1 hover:ring-blue-300 ${info.bg} ${info.color}`}>
        {updating ? "..." : info.symbol}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border py-1 min-w-24">
            {STATUT_LIVRAISON.map(s => (
              <button key={s.value} onClick={() => handleSelect(s.value)} className="w-full px-3 py-1.5 text-left text-[0.75rem] hover:bg-gray-100 flex items-center gap-2">
                <span className={`${s.bg} ${s.color} px-1.5 py-0.5 rounded text-[0.625rem]`}>{s.symbol}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AchatBadge({ value }: { value?: string }) {
  const info = STATUT_ACHAT.find(s => s.value === value) || STATUT_ACHAT[0];
  return <span className={`text-[0.5rem] px-1 py-0.5 rounded font-medium ${info.bg} ${info.color}`}>{info.symbol}</span>;
}

function StatCard({ title, value, subtitle, icon: Icon, color = "blue" }: { title: string; value: string | number; subtitle?: string; icon: typeof Factory; color?: string; }) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-600", text: "text-blue-700" },
    green: { bg: "bg-green-50 dark:bg-green-900/20", icon: "text-green-600", text: "text-green-700" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "text-purple-600", text: "text-purple-700" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`p-4 rounded-xl ${c.bg} border border-${color}-100`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[0.75rem] font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-[1.5rem] font-bold ${c.text} mt-1`}>{value}</p>
          {subtitle && <p className="text-[0.625rem] text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${c.bg}`}><Icon size={20} className={c.icon} /></div>
      </div>
    </div>
  );
}

function EtapeProgress({ stats }: { stats: Stats }) {
  const etapes = [
    { label: "Mesure", complete: stats.parEtape.mesure.complete, total: stats.total, color: "bg-blue-500" },
    { label: "Plan", complete: stats.parEtape.plan.complete, total: stats.total, color: "bg-indigo-500" },
    { label: "Envoyé", complete: stats.parEtape.envoyeProduction.complete, total: stats.total, color: "bg-purple-500" },
    { label: "Prod.", complete: stats.parEtape.productionTerminee.complete, total: stats.total, color: "bg-pink-500" },
    { label: "Terminé", complete: stats.parEtape.termine.complete, total: stats.total, color: "bg-orange-500" },
    { label: "Install.", complete: stats.parEtape.installation.complete, total: stats.total, color: "bg-red-500" },
    { label: "Livré", complete: stats.parEtape.livre, total: stats.total, color: "bg-green-500" },
  ];

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-[0.875rem] font-semibold mb-4 flex items-center gap-2"><Layers size={16} className="text-gray-500" />Progression des étapes</h3>
      <div className="space-y-3">
        {etapes.map((etape) => {
          const percent = etape.total > 0 ? Math.round((etape.complete / etape.total) * 100) : 0;
          return (
            <div key={etape.label} className="flex items-center gap-3">
              <div className="w-16 text-[0.625rem] font-medium text-gray-600">{etape.label}</div>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${etape.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
              </div>
              <div className="w-12 text-right text-[0.625rem] font-medium text-gray-500">{etape.complete}/{etape.total}</div>
              <div className="w-10 text-right text-[0.625rem] font-bold text-gray-700">{percent}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommandeRow({ commande, onUpdate, onView }: { commande: Commande; onUpdate: (id: string, field: string, value: string) => void; onView: (id: string) => void; }) {
  const serviceInfo = SERVICE_COLORS[commande.service] || SERVICE_COLORS.INSTALLATION;
  
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
      <td className="px-2 py-2 sticky left-0 bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-10 rounded-full ${serviceInfo.bg}`} />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[0.75rem] text-gray-900 dark:text-white">{commande.numero}</span>
              {commande.reprise && <span className="px-1 py-0.5 text-[0.5rem] bg-orange-100 text-orange-700 rounded">R</span>}
              {commande.enProduction && <span className="px-1 py-0.5 text-[0.5rem] bg-green-100 text-green-700 rounded">⚡</span>}
            </div>
            <div className="text-[0.625rem] text-gray-500 truncate max-w-24">{commande.client.nom}</div>
          </div>
        </div>
      </td>
      <td className="px-2 py-2 text-center">
        <div className="text-[0.625rem] text-gray-600">{commande.datePrevue ? new Date(commande.datePrevue).toLocaleDateString("fr-CA", { day: "2-digit", month: "2-digit" }) : "—"}</div>
        {commande.semainePrevue && <div className="text-[0.5rem] text-gray-400">{commande.semainePrevue}</div>}
      </td>
      <td className="px-2 py-2 text-center">
        <div className="text-[0.75rem] font-semibold text-gray-900">{commande.piedsLineairesRampes || 0}</div>
        <div className="text-[0.5rem] text-gray-400">{commande.nombrePoteaux || 0} pot.</div>
      </td>
      <td className="px-2 py-2 text-center"><CodeBadge value={commande.mesure} field="mesure" commandeId={commande.id} onUpdate={onUpdate} /></td>
      <td className="px-2 py-2 text-center"><CodeBadge value={commande.plan} field="plan" commandeId={commande.id} onUpdate={onUpdate} /></td>
      <td className="px-2 py-2 text-center"><CodeBadge value={commande.envoyeProduction} field="envoyeProduction" commandeId={commande.id} onUpdate={onUpdate} /></td>
      <td className="px-2 py-2 text-center"><CodeBadge value={commande.productionTerminee} field="productionTerminee" commandeId={commande.id} onUpdate={onUpdate} /></td>
      <td className="px-2 py-2 text-center"><CodeBadge value={commande.termine} field="termine" commandeId={commande.id} onUpdate={onUpdate} /></td>
      <td className="px-2 py-2 text-center"><CodeBadge value={commande.installation} field="installation" commandeId={commande.id} onUpdate={onUpdate} /></td>
      <td className="px-2 py-2 text-center"><LivraisonBadge value={commande.statutLivraison} commandeId={commande.id} onUpdate={onUpdate} /></td>
      <td className="px-2 py-2">
        <div className="flex flex-wrap gap-0.5 justify-center">
          <AchatBadge value={commande.achatFibre} />
          <AchatBadge value={commande.achatLimons} />
          <AchatBadge value={commande.achatVerres} />
          <AchatBadge value={commande.achatColonnes} />
        </div>
      </td>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onView(commande.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={14} /></button>
      </td>
    </tr>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function ProductionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [parJour, setParJour] = useState<Record<string, Commande[]>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [semaine, setSemaine] = useState<Semaine | null>(null);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterEnProduction, setFilterEnProduction] = useState(false);
  const [viewMode, setViewMode] = useState<"tableau" | "semaine">("tableau");
  const [sortField] = useState<string>("datePrevue");
  const [sortDir] = useState<"asc" | "desc">("asc");

  const loadData = useCallback(async (weekOffset = 0) => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterService) params.append("service", filterService);
      if (filterEnProduction) params.append("enProduction", "true");
      if (semaine && weekOffset !== 0) {
        params.append("semaine", String(semaine.numero + weekOffset));
        params.append("annee", String(semaine.annee));
      }
      const res = await fetch(`/api/production?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCommandes(data.commandes || []);
        setParJour(data.parJour || {});
        setStats(data.stats || null);
        setSemaine(data.semaine || null);
      }
    } catch (e) { console.error("Erreur:", e); }
    setRefreshing(false);
    setLoading(false);
  }, [search, filterService, filterEnProduction, semaine]);

  useEffect(() => { loadData(); }, []);

  const changeWeek = (offset: number) => { loadData(offset); };
  const goToCurrentWeek = () => { setLoading(true); loadData(0); };

  const handleUpdate = async (commandeId: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/production/${commandeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field, value }) });
      if (res.ok) { setCommandes(prev => prev.map(c => c.id === commandeId ? { ...c, [field]: value || null } : c)); }
    } catch (e) { console.error("Erreur mise à jour:", e); }
  };

  const handleView = (id: string) => { router.push(`/dashboard/commandes/${id}`); };

  const sortedCommandes = useMemo(() => {
    return [...commandes].sort((a, b) => {
      let aVal: unknown = a[sortField as keyof Commande];
      let bVal: unknown = b[sortField as keyof Commande];
      if (sortField === "datePrevue" || sortField === "dateProduction") {
        aVal = aVal ? new Date(aVal as string).getTime() : 0;
        bVal = bVal ? new Date(bVal as string).getTime() : 0;
      }
      if (sortDir === "asc") { return (aVal as number) > (bVal as number) ? 1 : -1; }
      return (aVal as number) < (bVal as number) ? 1 : -1;
    });
  }, [commandes, sortField, sortDir]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" });

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center"><div className="text-center"><Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" /><p className="text-gray-500">Chargement de la production...</p></div></div>);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-[1.5rem] md:text-[2rem] font-bold text-gray-900 dark:text-white flex items-center gap-3"><Factory className="text-blue-600" />Production</h1>
          <p className="text-[0.875rem] text-gray-500 mt-1">Gestion et suivi de la production en temps réel</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadData()} disabled={refreshing} className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Actualiser"><RefreshCw size={20} className={refreshing ? "animate-spin" : ""} /></button>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button onClick={() => setViewMode("tableau")} className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-medium transition-colors ${viewMode === "tableau" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-600"}`}>Tableau</button>
            <button onClick={() => setViewMode("semaine")} className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-medium transition-colors ${viewMode === "semaine" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-600"}`}>Semaine</button>
          </div>
        </div>
      </div>

      {/* Navigation semaine */}
      {semaine && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><ChevronLeft size={24} /></button>
            <div className="text-center">
              <div className="text-[1.25rem] font-bold">Semaine {semaine.numero}</div>
              <div className="text-[0.875rem] opacity-90">{formatDate(semaine.debut)} — {formatDate(semaine.fin)}</div>
              <button onClick={goToCurrentWeek} className="mt-2 px-3 py-1 text-[0.75rem] bg-white/20 hover:bg-white/30 rounded-lg transition-colors">Semaine actuelle</button>
            </div>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><ChevronRight size={24} /></button>
          </div>
        </div>
      )}

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total commandes" value={stats.total} subtitle="Commandes actives" icon={Package} color="blue" />
          <StatCard title="En production" value={stats.enProduction} subtitle={`${stats.semaineEnCours} cette semaine`} icon={Factory} color="green" />
          <StatCard title="Pieds linéaires" value={`${stats.piedsLineairesTotaux.toLocaleString()} pi`} subtitle={`${stats.piedsLineairesSemaine.toLocaleString()} pi cette sem.`} icon={Layers} color="purple" />
          <StatCard title="Complétées" value={stats.parEtape.termine.complete} subtitle={`${stats.parEtape.livre} livrées`} icon={CheckCircle} color="green" />
        </div>
      )}

      {/* Progression des étapes */}
      {stats && <EtapeProgress stats={stats} />}

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadData()} placeholder="Rechercher par numéro, client, adresse..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-[0.875rem]" />
          </div>
          <div className="flex items-center gap-2">
            <select value={filterService} onChange={(e) => { setFilterService(e.target.value); loadData(); }} className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-[0.875rem]">
              <option value="">Tous les services</option>
              {Object.entries(SERVICE_COLORS).map(([value, info]) => (<option key={value} value={value}>{info.icon} {value}</option>))}
            </select>
            <label className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
              <input type="checkbox" checked={filterEnProduction} onChange={(e) => { setFilterEnProduction(e.target.checked); loadData(); }} className="w-4 h-4 rounded" />
              <span className="text-[0.875rem]">En prod.</span>
            </label>
            <button onClick={() => loadData()} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[0.875rem] font-medium hover:bg-blue-700">Rechercher</button>
          </div>
        </div>
      </div>

      {/* Vue Tableau */}
      {viewMode === "tableau" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[0.75rem]">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-20">
                <tr>
                  <th className="px-2 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-900 z-30 min-w-32">Commande</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-16">Date</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-14">Pieds</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-12">Mes.</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-12">Plan</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-12">Env.</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-12">Prod.</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-12">Term.</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-12">Inst.</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-12">Liv.</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-20">Achats</th>
                  <th className="px-2 py-3 text-center font-semibold text-gray-600 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sortedCommandes.length === 0 ? (
                  <tr><td colSpan={12} className="px-4 py-12 text-center"><Package size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Aucune commande trouvée</p></td></tr>
                ) : (
                  sortedCommandes.map(commande => (<CommandeRow key={commande.id} commande={commande} onUpdate={handleUpdate} onView={handleView} />))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue Semaine */}
      {viewMode === "semaine" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {JOURS.map((jour, i) => {
            const joursCommandes = parJour[jour] || [];
            const dateJour = semaine ? new Date(semaine.debut) : new Date();
            if (semaine) dateJour.setDate(dateJour.getDate() + i);
            
            return (
              <div key={jour} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-[0.875rem]">{jour}</div>
                  <div className="text-[0.75rem] text-gray-500">{dateJour.toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}</div>
                  <div className="text-[0.625rem] text-blue-600 font-medium mt-1">{joursCommandes.length} commande{joursCommandes.length > 1 ? "s" : ""}</div>
                </div>
                <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                  {joursCommandes.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-[0.75rem]">Aucune commande</div>
                  ) : (
                    joursCommandes.map(c => {
                      const serviceInfo = SERVICE_COLORS[c.service] || SERVICE_COLORS.INSTALLATION;
                      return (
                        <div key={c.id} onClick={() => handleView(c.id)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${serviceInfo.bg}`} />
                            <span className="font-semibold text-[0.75rem]">{c.numero}</span>
                            {c.enProduction && <span className="text-[0.5rem] px-1 bg-green-100 text-green-700 rounded">⚡</span>}
                          </div>
                          <div className="text-[0.625rem] text-gray-500 truncate">{c.client.nom}</div>
                          <div className="flex gap-1 mt-1.5">
                            <CodeBadge value={c.mesure} field="mesure" commandeId={c.id} onUpdate={handleUpdate} />
                            <CodeBadge value={c.plan} field="plan" commandeId={c.id} onUpdate={handleUpdate} />
                            <CodeBadge value={c.productionTerminee} field="productionTerminee" commandeId={c.id} onUpdate={handleUpdate} />
                          </div>
                          <div className="flex items-center justify-between mt-2 text-[0.5rem] text-gray-400"><span>{c.piedsLineairesRampes} pi</span><span>{c.nombrePoteaux} pot.</span></div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Légende des codes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-[0.875rem] font-semibold mb-3">Légende des codes</h3>
        <div className="flex flex-wrap gap-2">
          {CODE_PRODUCTION.filter(c => c.value).map(code => (
            <div key={code.value} className="flex items-center gap-1.5">
              <span className={`${code.bg} ${code.color} px-1.5 py-0.5 rounded text-[0.625rem] font-medium`}>{code.symbol}</span>
              <span className="text-[0.625rem] text-gray-600">{code.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-[0.75rem] font-medium mb-2">Achats</div>
          <div className="flex flex-wrap gap-2">
            {STATUT_ACHAT.filter(s => s.value).map(statut => (
              <div key={statut.value} className="flex items-center gap-1.5">
                <span className={`${statut.bg} ${statut.color} px-1.5 py-0.5 rounded text-[0.625rem] font-medium`}>{statut.symbol}</span>
                <span className="text-[0.625rem] text-gray-600">{statut.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}