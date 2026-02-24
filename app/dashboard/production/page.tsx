"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Factory,
  Calendar,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Check,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Package,
  Ruler,
  Columns3,
  Eye,
  Filter,
} from "lucide-react";
import {
  CODES_PRODUCTION_MAP,
  SERVICE_COLORS,
  type CommandeProduction,
  type StatsProduction,
} from "./schema";

import {
  ProductionTabs,
  CodeBadge,
  ServiceBadge,
  ServiceCardBadge,
  CodeSelect,
  LegendeServices,
  StatCard,
  MoisNavigation,
  ProductionSkeleton,
  formatDateFr,
  formatDateLong,
  getServiceRowBg,
} from "@/app/components/production/productionui";

// ──────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────
const MOIS_NOMS = [
  "janvier","février","mars","avril","mai","juin",
  "juillet","août","septembre","octobre","novembre","décembre",
];
const JOURS_COURTS = ["dim","lun","mar","mer","jeu","ven","sam"];
const PERIODES = ["journalier","hebdomadaire","mensuel","annuel"] as const;

// ──────────────────────────────────────────
// Helpers calendrier
// ──────────────────────────────────────────
interface DayInfo {
  day: number;
  currentMonth: boolean;
  date: Date;
}

function getDaysInMonth(date: Date): DayInfo[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();
  const days: DayInfo[] = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
  }
  return days;
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeeksOfMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const weeks: { label: string; start: Date; end: Date }[] = [];
  let weekStart = new Date(year, month, 1);
  while (weekStart.getMonth() === month) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weeks.push({
      label: `${weekStart.getDate()} - ${weekEnd.getDate() > weekStart.getDate() ? weekEnd.getDate() : new Date(year, month + 1, 0).getDate()} ${MOIS_NOMS[month]}`,
      start: new Date(weekStart),
      end: weekEnd,
    });
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
  }
  return weeks;
}

// ══════════════════════════════════════════
// PAGE PRODUCTION
// ══════════════════════════════════════════

export default function ProductionPage() {
  // State principal
  const [activeTab, setActiveTab] = useState<"calendrier" | "finaliser" | "statistiques">("calendrier");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMettreEnProduction, setShowMettreEnProduction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemaine, setFilterSemaine] = useState("toutes");
  const [statsPeriode, setStatsPeriode] = useState<typeof PERIODES[number]>("hebdomadaire");
  const [loading, setLoading] = useState(true);

  // Données — dans un vrai projet, fetcher depuis l'API
  const [commandes, setCommandes] = useState<CommandeProduction[]>([]);

  // ──────────────────────────────────────────
  // Fetch des données
  // ──────────────────────────────────────────
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/production?statut=ACTIVE&limite=200`);
      if (!res.ok) throw new Error("Erreur fetch");
      const json = await res.json();
      setCommandes(json.data);
    } catch (err) {
      console.error("Erreur chargement production:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  // ──────────────────────────────────────────
  // Computed
  // ──────────────────────────────────────────
  const commandesEnProduction = useMemo(
    () => commandes.filter((c) => c.envoyeProduction === "COMPLETE" && c.productionTerminee !== "COMPLETE"),
    [commandes]
  );

  const commandesPretesProduction = useMemo(
    () => commandes.filter((c) => c.statut === "ACTIVE"),
    [commandes]
  );

  const totalPiedsLin = useMemo(
    () => commandesEnProduction.reduce((s, c) => s + c.piedsLineairesRampes, 0),
    [commandesEnProduction]
  );

  const totalPoteaux = useMemo(
    () => commandesEnProduction.reduce((s, c) => s + c.nombrePoteaux, 0),
    [commandesEnProduction]
  );

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const semaines = useMemo(() => getWeeksOfMonth(currentMonth), [currentMonth]);

  // Commandes groupées par date production
  const commandesParDate = useMemo(() => {
    const map: Record<string, CommandeProduction[]> = {};
    for (const cmd of commandesEnProduction) {
      if (!cmd.dateProduction) continue;
      const key = cmd.dateProduction.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(cmd);
    }
    return map;
  }, [commandesEnProduction]);

  // ──────────────────────────────────────────
  // Actions API
  // ──────────────────────────────────────────
  async function mettreEnProduction(cmdId: string) {
    try {
      await fetch("/api/production", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: cmdId,
          envoyeProduction: "COMPLETE",
          enProduction: true,
        }),
      });
      setCommandes((prev) =>
        prev.map((c) => (c.id === cmdId ? { ...c, envoyeProduction: "COMPLETE", enProduction: true } : c))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function retirerDeProduction(cmdId: string) {
    try {
      await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retirer", commandeId: cmdId }),
      });
      setCommandes((prev) =>
        prev.map((c) =>
          c.id === cmdId ? { ...c, envoyeProduction: null, enProduction: false, dateProduction: null } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function terminerProduction(cmdId: string) {
    try {
      await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "terminer", commandeId: cmdId }),
      });
      setCommandes((prev) =>
        prev.map((c) =>
          c.id === cmdId ? { ...c, productionTerminee: "COMPLETE", enProduction: false } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function updateChampProduction(cmdId: string, champ: string, valeur: string | null) {
    try {
      await fetch("/api/production", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandeId: cmdId, [champ]: valeur }),
      });
      setCommandes((prev) =>
        prev.map((c) => (c.id === cmdId ? { ...c, [champ]: valeur } : c))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function updateDateProduction(cmdId: string, date: string) {
    try {
      await fetch("/api/production", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandeId: cmdId, dateProduction: date || null }),
      });
      setCommandes((prev) =>
        prev.map((c) => (c.id === cmdId ? { ...c, dateProduction: date || null } : c))
      );
    } catch (err) {
      console.error(err);
    }
  }

  // ──────────────────────────────────────────
  // Navigation mois
  // ──────────────────────────────────────────
  const goToPrevMonth = () =>
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  // ──────────────────────────────────────────
  // Stats
  // ──────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    let filtered = commandesEnProduction;

    if (statsPeriode === "journalier") {
      const todayKey = formatDateKey(now);
      filtered = filtered.filter((c) => c.dateProduction?.split("T")[0] === todayKey);
    } else if (statsPeriode === "hebdomadaire") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      filtered = filtered.filter((c) => {
        if (!c.dateProduction) return false;
        const d = new Date(c.dateProduction);
        return d >= weekStart && d <= weekEnd;
      });
    } else if (statsPeriode === "mensuel") {
      filtered = filtered.filter((c) => {
        if (!c.dateProduction) return false;
        const d = new Date(c.dateProduction);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (statsPeriode === "annuel") {
      filtered = filtered.filter((c) => {
        if (!c.dateProduction) return false;
        return new Date(c.dateProduction).getFullYear() === now.getFullYear();
      });
    }

    return {
      totalCommandes: filtered.length,
      piedsLineaires: filtered.reduce((s, c) => s + c.piedsLineairesRampes, 0),
      poteaux: filtered.reduce((s, c) => s + c.nombrePoteaux, 0),
      enProduction: commandesEnProduction.length,
      terminees: commandes.filter((c) => c.productionTerminee === "COMPLETE").length,
      enAttente: commandes.filter((c) => c.statut === "ACTIVE" && c.envoyeProduction !== "COMPLETE").length,
    };
  }, [commandesEnProduction, commandes, statsPeriode]);

  // ──────────────────────────────────────────
  // Loading
  // ──────────────────────────────────────────
  if (loading) return <ProductionSkeleton />;

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════
  return (
    <div className="space-y-[1.25rem] sm:space-y-[1.5rem]">
      {/* Modals */}
      {selectedDate && (
        <DateDetailModal
          date={selectedDate}
          commandes={commandesParDate[formatDateKey(selectedDate)] ?? []}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {showMettreEnProduction && (
        <MettreEnProductionModal
          commandes={commandesPretesProduction}
          commandesEnProduction={commandesEnProduction}
          totalPiedsLin={totalPiedsLin}
          currentMonth={currentMonth}
          semaines={semaines}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterSemaine={filterSemaine}
          setFilterSemaine={setFilterSemaine}
          onMettreEnProd={mettreEnProduction}
          onRetirer={retirerDeProduction}
          onUpdateChamp={updateChampProduction}
          onUpdateDate={updateDateProduction}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onClose={() => setShowMettreEnProduction(false)}
        />
      )}

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-[1rem]">
        <div>
          <h1 className="text-[1.5rem] sm:text-[1.875rem] font-bold text-slate-800 flex items-center gap-[0.5rem]">
            <Factory className="w-[1.5rem] h-[1.5rem] sm:w-[1.75rem] sm:h-[1.75rem] text-amber-500" />
            Production
          </h1>
          <p className="text-slate-500 text-[0.8125rem] sm:text-[0.875rem] mt-[0.125rem]">
            Gérez la production de vos commandes
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[0.75rem]">
          <LegendeServices />

          {/* Stats rapides */}
          <div className="flex items-center gap-[1rem] bg-white px-[0.75rem] sm:px-[1rem] py-[0.5rem] rounded-xl border border-slate-200 shadow-sm">
            <div className="text-center">
              <p className="text-[0.625rem] sm:text-[0.6875rem] text-slate-400 font-medium uppercase tracking-wide">Cmd</p>
              <p className="text-[1.125rem] sm:text-[1.25rem] font-bold text-slate-800">{commandesEnProduction.length}</p>
            </div>
            <div className="w-px h-[2rem] bg-slate-200" />
            <div className="text-center">
              <p className="text-[0.625rem] sm:text-[0.6875rem] text-slate-400 font-medium uppercase tracking-wide">Pi.Lin.</p>
              <p className="text-[1.125rem] sm:text-[1.25rem] font-bold text-emerald-600">{totalPiedsLin.toLocaleString()}</p>
            </div>
            <div className="w-px h-[2rem] bg-slate-200" />
            <div className="text-center">
              <p className="text-[0.625rem] sm:text-[0.6875rem] text-slate-400 font-medium uppercase tracking-wide">Poteaux</p>
              <p className="text-[1.125rem] sm:text-[1.25rem] font-bold text-blue-600">{totalPoteaux}</p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => setShowMettreEnProduction(true)}
            className="
              flex items-center gap-[0.5rem] px-[1rem] sm:px-[1.25rem] py-[0.625rem] sm:py-[0.75rem]
              bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900
              font-semibold text-[0.8125rem] sm:text-[0.875rem] rounded-xl
              shadow-lg hover:shadow-xl hover:scale-[1.02]
              transition-all duration-200 active:scale-[0.98]
            "
          >
            <Plus className="w-[1.125rem] h-[1.125rem]" />
            Mettre en production
          </button>
        </div>
      </div>

      {/* ═══════ ONGLETS ═══════ */}
      <ProductionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ═══════ CALENDRIER ═══════ */}
      {activeTab === "calendrier" && (
        <CalendrierView
          days={days}
          currentMonth={currentMonth}
          commandesParDate={commandesParDate}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* ═══════ FINALISER ═══════ */}
      {activeTab === "finaliser" && (
        <FinaliserView
          commandes={commandesEnProduction}
          totalPiedsLin={totalPiedsLin}
          totalPoteaux={totalPoteaux}
          onTerminer={terminerProduction}
          onMettreEnProd={() => setShowMettreEnProduction(true)}
        />
      )}

      {/* ═══════ STATISTIQUES ═══════ */}
      {activeTab === "statistiques" && (
        <StatistiquesView
          stats={stats}
          periode={statsPeriode}
          onChangePeriode={setStatsPeriode}
          days={days}
          currentMonth={currentMonth}
          commandesParDate={commandesParDate}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onSelectDate={setSelectedDate}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// VIEW: CALENDRIER
// ══════════════════════════════════════════
function CalendrierView({
  days,
  currentMonth,
  commandesParDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: {
  days: DayInfo[];
  currentMonth: Date;
  commandesParDate: Record<string, CommandeProduction[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (d: Date) => void;
}) {
  const todayKey = formatDateKey(new Date());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Navigation mois */}
      <MoisNavigation
        mois={currentMonth.getMonth()}
        annee={currentMonth.getFullYear()}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
        variant="dark"
      />

      {/* En-têtes jours */}
      <div className="grid grid-cols-7 bg-slate-700 text-white">
        {JOURS_COURTS.map((jour) => (
          <div key={jour} className="p-[0.5rem] sm:p-[0.75rem] text-center border-r border-slate-600 last:border-r-0">
            <p className="font-semibold uppercase text-[0.625rem] sm:text-[0.75rem]">{jour}</p>
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7">
        {days.map((dayInfo, idx) => {
          const dateKey = formatDateKey(dayInfo.date);
          const cmds = commandesParDate[dateKey] ?? [];
          const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;
          const isToday = dateKey === todayKey;
          const hasCommandes = cmds.length > 0 && dayInfo.currentMonth;
          const totalPl = cmds.reduce((s, c) => s + c.piedsLineairesRampes, 0);

          return (
            <div
              key={idx}
              onClick={() => hasCommandes && onSelectDate(dayInfo.date)}
              className={`
                min-h-[4rem] sm:min-h-[7rem] lg:min-h-[8.5rem]
                border-r border-b border-slate-200 p-[0.25rem] sm:p-[0.5rem]
                transition-colors duration-150
                ${!dayInfo.currentMonth ? "bg-slate-100/50 text-slate-300" : isWeekend ? "bg-slate-50" : "bg-white"}
                ${hasCommandes ? "cursor-pointer hover:bg-blue-50/60" : ""}
                ${isToday && dayInfo.currentMonth ? "ring-2 ring-inset ring-amber-400" : ""}
              `}
            >
              {/* Numéro du jour + badge count */}
              <div className="flex items-center justify-between mb-[0.125rem] sm:mb-[0.25rem]">
                <span
                  className={`text-[0.8125rem] sm:text-[1rem] lg:text-[1.0625rem] font-bold
                    ${!dayInfo.currentMonth ? "text-slate-300" : isToday ? "text-amber-600" : "text-slate-700"}
                  `}
                >
                  {dayInfo.day}
                </span>
                {hasCommandes && (
                  <span className="bg-blue-500 text-white text-[0.5625rem] sm:text-[0.625rem] font-bold px-[0.375rem] py-[0.0625rem] rounded">
                    {cmds.length}
                  </span>
                )}
              </div>

              {/* Totaux & aperçu */}
              {hasCommandes && (
                <div className="space-y-[0.1875rem] sm:space-y-[0.25rem]">
                  {/* Total pieds linéaires */}
                  <div className="bg-red-500 text-white text-[0.5625rem] sm:text-[0.6875rem] font-bold px-[0.375rem] py-[0.1875rem] rounded text-center">
                    {totalPl} pi.lin.
                  </div>

                  {/* Aperçu commandes (max 2 sur desktop, 1 sur mobile) */}
                  <div className="hidden sm:block space-y-[0.1875rem]">
                    {cmds.slice(0, 2).map((cmd) => {
                      const colors = SERVICE_COLORS[cmd.service] ?? { bg: "bg-slate-200", text: "text-slate-700" };
                      return (
                        <div
                          key={cmd.id}
                          className={`${colors.bg} ${colors.text} text-[0.5625rem] lg:text-[0.625rem] p-[0.25rem] sm:p-[0.375rem] rounded truncate`}
                        >
                          <p className="font-bold truncate">{cmd.numero}</p>
                          <p className="truncate opacity-80 text-[0.5rem] lg:text-[0.5625rem]">{cmd.clientNom}</p>
                        </div>
                      );
                    })}
                    {cmds.length > 2 && (
                      <p className="text-[0.5625rem] text-blue-600 font-medium text-center">
                        +{cmds.length - 2} autres
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// VIEW: FINALISER
// ══════════════════════════════════════════
function FinaliserView({
  commandes,
  totalPiedsLin,
  totalPoteaux,
  onTerminer,
  onMettreEnProd,
}: {
  commandes: CommandeProduction[];
  totalPiedsLin: number;
  totalPoteaux: number;
  onTerminer: (id: string) => void;
  onMettreEnProd: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return commandes;
    const s = search.toLowerCase();
    return commandes.filter(
      (c) =>
        c.numero.toLowerCase().includes(s) ||
        c.clientNom.toLowerCase().includes(s)
    );
  }, [commandes, search]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-[0.75rem] sm:p-[1rem] border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[0.75rem]">
        <div className="relative flex-1 max-w-[25rem]">
          <Search className="absolute left-[0.75rem] top-1/2 -translate-y-1/2 w-[1rem] h-[1rem] text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une commande..."
            className="w-full pl-[2.25rem] pr-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl text-[0.875rem] focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-[1rem] sm:gap-[1.5rem]">
          <div className="text-[0.8125rem] text-slate-600">
            <span className="font-bold text-[1.125rem] text-slate-800">{commandes.length}</span>{" "}
            <span className="hidden sm:inline">commandes en production</span>
            <span className="sm:hidden">cmd</span>
          </div>
          <div className="text-[0.8125rem]">
            Total:{" "}
            <span className="font-bold text-emerald-600">{totalPiedsLin.toLocaleString()}</span>{" "}
            pi.lin.
          </div>
        </div>
      </div>

      {/* Table ou empty state */}
      {filtered.length === 0 ? (
        <div className="p-[3rem] sm:p-[4rem] text-center text-slate-400">
          <Package className="w-[3rem] h-[3rem] mx-auto mb-[1rem] opacity-30" />
          <p className="text-[1rem] font-medium mb-[0.25rem]">Aucune commande en production</p>
          <p className="text-[0.8125rem] mb-[1rem]">Commencez par mettre des commandes en production</p>
          <button
            onClick={onMettreEnProd}
            className="px-[1rem] py-[0.5rem] bg-amber-100 text-amber-800 rounded-lg font-medium text-[0.875rem] hover:bg-amber-200 transition-colors"
          >
            Mettre des commandes en production
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[45rem]">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-[0.75rem] py-[0.75rem] text-left text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wider"># Projet</th>
                <th className="px-[0.75rem] py-[0.75rem] text-left text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wider">Date Prod.</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wider">Poteaux</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wider">Pi. Lin.</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cmd) => (
                <tr key={cmd.id} className={`${getServiceRowBg(cmd.service)} hover:brightness-95 transition-colors`}>
                  <td className="px-[0.75rem] py-[0.875rem]">
                    <ServiceCardBadge service={cmd.service} numero={cmd.numero} />
                  </td>
                  <td className="px-[0.75rem] py-[0.875rem]">
                    <p className="font-medium text-[0.875rem] text-slate-800">{cmd.clientNom}</p>
                    <p className="text-[0.75rem] text-slate-500 truncate max-w-[14rem]">
                      {cmd.adresse?.split(",")[0]}
                    </p>
                  </td>
                  <td className="px-[0.75rem] py-[0.875rem] text-center">
                    <ServiceBadge service={cmd.service} size="md" />
                  </td>
                  <td className="px-[0.75rem] py-[0.875rem] text-center text-[0.875rem] font-medium text-slate-700">
                    {formatDateFr(cmd.dateProduction)}
                  </td>
                  <td className="px-[0.75rem] py-[0.875rem] text-center">
                    <span className="text-[1.25rem] font-bold text-blue-600">{cmd.nombrePoteaux}</span>
                  </td>
                  <td className="px-[0.75rem] py-[0.875rem] text-center">
                    <span className="text-[1.25rem] font-bold text-emerald-600">{cmd.piedsLineairesRampes}</span>
                  </td>
                  <td className="px-[0.75rem] py-[0.875rem] text-center">
                    <button
                      onClick={() => onTerminer(cmd.id)}
                      className="
                        px-[0.75rem] sm:px-[1rem] py-[0.5rem]
                        bg-emerald-500 hover:bg-emerald-600
                        text-white font-medium text-[0.75rem] sm:text-[0.8125rem]
                        rounded-lg transition-colors
                        active:scale-95
                      "
                    >
                      <span className="hidden sm:inline">Terminer production</span>
                      <span className="sm:hidden">Terminer</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-200">
              <tr>
                <td colSpan={4} className="px-[0.75rem] py-[0.75rem] text-right font-bold text-[0.875rem] text-slate-700">
                  TOTAUX:
                </td>
                <td className="px-[0.75rem] py-[0.75rem] text-center">
                  <span className="text-[1.5rem] font-bold text-blue-600">{totalPoteaux}</span>
                </td>
                <td className="px-[0.75rem] py-[0.75rem] text-center">
                  <span className="text-[1.5rem] font-bold text-emerald-600">{totalPiedsLin.toLocaleString()}</span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// VIEW: STATISTIQUES
// ══════════════════════════════════════════
function StatistiquesView({
  stats,
  periode,
  onChangePeriode,
  days,
  currentMonth,
  commandesParDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: {
  stats: {
    totalCommandes: number;
    piedsLineaires: number;
    poteaux: number;
    enProduction: number;
    terminees: number;
    enAttente: number;
  };
  periode: string;
  onChangePeriode: (p: typeof PERIODES[number]) => void;
  days: DayInfo[];
  currentMonth: Date;
  commandesParDate: Record<string, CommandeProduction[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (d: Date) => void;
}) {
  const todayKey = formatDateKey(new Date());

  // Données pour le graphique simple
  const barLabels = useMemo(() => {
    if (periode === "hebdomadaire") return ["Lun", "Mar", "Mer", "Jeu", "Ven"];
    if (periode === "journalier") return ["8h", "10h", "12h", "14h", "16h"];
    return ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
  }, [periode]);

  return (
    <div className="space-y-[1.25rem] sm:space-y-[1.5rem]">
      {/* Sélecteur période */}
      <div className="flex gap-[0.25rem] bg-white p-[0.25rem] rounded-xl w-fit border border-slate-200">
        {PERIODES.map((p) => (
          <button
            key={p}
            onClick={() => onChangePeriode(p)}
            className={`
              px-[0.75rem] sm:px-[1rem] py-[0.5rem] rounded-lg
              font-medium text-[0.75rem] sm:text-[0.875rem] capitalize
              transition-all duration-200
              ${periode === p ? "bg-amber-100 text-amber-800 shadow-sm" : "text-slate-500 hover:bg-slate-50"}
            `}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Cartes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[0.75rem] sm:gap-[1rem]">
        <StatCard label="Total Commandes" value={stats.totalCommandes} icon={<Package className="w-[1.25rem] h-[1.25rem]" />} />
        <StatCard label="Pieds Linéaires" value={stats.piedsLineaires.toLocaleString()} bgColor="bg-emerald-50" textColor="text-emerald-700" borderColor="border-emerald-100" icon={<Ruler className="w-[1.25rem] h-[1.25rem]" />} />
        <StatCard label="Nb Poteaux" value={stats.poteaux} bgColor="bg-blue-50" textColor="text-blue-700" borderColor="border-blue-100" icon={<Columns3 className="w-[1.25rem] h-[1.25rem]" />} />
        <StatCard label="En Production" value={stats.enProduction} bgColor="bg-purple-50" textColor="text-purple-700" borderColor="border-purple-100" icon={<Factory className="w-[1.25rem] h-[1.25rem]" />} />
        <StatCard label="Terminées" value={stats.terminees} bgColor="bg-green-50" textColor="text-green-700" borderColor="border-green-100" icon={<CheckCircle2 className="w-[1.25rem] h-[1.25rem]" />} />
        <StatCard label="En Attente" value={stats.enAttente} bgColor="bg-amber-50" textColor="text-amber-700" borderColor="border-amber-100" icon={<AlertTriangle className="w-[1.25rem] h-[1.25rem]" />} />
      </div>

      {/* Calendrier mini + Graphique */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1rem] sm:gap-[1.5rem]">
        {/* Mini calendrier */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-[1rem] sm:p-[1.5rem]">
          <div className="flex items-center justify-between mb-[1rem]">
            <h3 className="text-[1rem] sm:text-[1.125rem] font-bold text-slate-800">Calendrier</h3>
            <div className="flex items-center gap-[0.5rem]">
              <button onClick={onPrevMonth} className="p-[0.25rem] hover:bg-slate-100 rounded transition-colors">
                <ChevronLeft className="w-[1.125rem] h-[1.125rem]" />
              </button>
              <span className="font-medium text-[0.75rem] sm:text-[0.8125rem] capitalize min-w-[8rem] text-center">
                {MOIS_NOMS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={onNextMonth} className="p-[0.25rem] hover:bg-slate-100 rounded transition-colors">
                <ChevronRight className="w-[1.125rem] h-[1.125rem]" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-[0.125rem] sm:gap-[0.25rem] text-center text-[0.75rem]">
            {JOURS_COURTS.map((d) => (
              <div key={d} className="p-[0.25rem] sm:p-[0.375rem] font-semibold text-slate-400 text-[0.625rem] sm:text-[0.6875rem]">
                {d}
              </div>
            ))}
            {days.map((dayInfo, idx) => {
              const dateKey = formatDateKey(dayInfo.date);
              const cmds = commandesParDate[dateKey] ?? [];
              const count = cmds.length;
              const totalPl = cmds.reduce((s, c) => s + c.piedsLineairesRampes, 0);
              const hasCmds = count > 0 && dayInfo.currentMonth;

              return (
                <div
                  key={idx}
                  onClick={() => hasCmds && onSelectDate(dayInfo.date)}
                  className={`
                    p-[0.125rem] sm:p-[0.25rem] rounded-lg text-[0.75rem] sm:text-[0.8125rem]
                    transition-colors duration-150
                    ${!dayInfo.currentMonth ? "text-slate-300" : ""}
                    ${hasCmds ? "bg-emerald-100 text-emerald-800 cursor-pointer hover:bg-emerald-200 font-bold" : ""}
                    ${dateKey === todayKey && dayInfo.currentMonth ? "ring-1 ring-amber-400" : ""}
                  `}
                >
                  {dayInfo.day}
                  {hasCmds && (
                    <p className="text-[0.5rem] sm:text-[0.5625rem] text-emerald-600 leading-tight">
                      {count} | {totalPl}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Graphique barres */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-[1rem] sm:p-[1.5rem]">
          <h3 className="text-[1rem] sm:text-[1.125rem] font-bold text-slate-800 mb-[1.5rem]">
            Volume <span className="text-slate-400 font-normal capitalize">({periode})</span>
          </h3>
          <div className="h-[10rem] sm:h-[12rem] flex items-end justify-around gap-[0.5rem] sm:gap-[1rem]">
            {barLabels.map((label, i) => {
              const h1 = [60, 80, 45, 90, 70][i] ?? 50;
              const h2 = [40, 60, 75, 50, 85][i] ?? 50;
              return (
                <div key={label} className="flex flex-col items-center gap-[0.375rem] flex-1">
                  <div className="w-full flex gap-[0.125rem] items-end justify-center h-[8rem]">
                    <div
                      className="w-[0.875rem] sm:w-[1.25rem] lg:w-[1.5rem] bg-gradient-to-t from-amber-500 to-amber-300 rounded-t transition-all duration-500"
                      style={{ height: `${h1}%` }}
                    />
                    <div
                      className="w-[0.875rem] sm:w-[1.25rem] lg:w-[1.5rem] bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t transition-all duration-500"
                      style={{ height: `${h2}%` }}
                    />
                  </div>
                  <span className="text-[0.6875rem] sm:text-[0.75rem] font-medium text-slate-500">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-[1rem] sm:gap-[1.5rem] mt-[1rem]">
            <div className="flex items-center gap-[0.375rem]">
              <div className="w-[0.875rem] h-[0.875rem] bg-amber-400 rounded" />
              <span className="text-[0.75rem] text-slate-500">Commandes</span>
            </div>
            <div className="flex items-center gap-[0.375rem]">
              <div className="w-[0.875rem] h-[0.875rem] bg-emerald-400 rounded" />
              <span className="text-[0.75rem] text-slate-500">Pieds lin.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MODAL: DÉTAIL DATE
// ══════════════════════════════════════════
function DateDetailModal({
  date,
  commandes,
  onClose,
}: {
  date: Date;
  commandes: CommandeProduction[];
  onClose: () => void;
}) {
  const totalPl = commandes.reduce((s, c) => s + c.piedsLineairesRampes, 0);
  const totalPot = commandes.reduce((s, c) => s + c.nombrePoteaux, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.75rem] sm:p-[1rem]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[56rem] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-[1rem] sm:p-[1.25rem] border-b border-slate-200 bg-slate-800 text-white">
          <h2 className="text-[1rem] sm:text-[1.25rem] font-bold capitalize">
            Projet du : {formatDateLong(date)}
          </h2>
          <button onClick={onClose} className="p-[0.375rem] hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-[1.25rem] h-[1.25rem]" />
          </button>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto flex-1 p-[0.75rem] sm:p-[1rem] space-y-[0.75rem] sm:space-y-[1rem]">
          {commandes.length === 0 ? (
            <div className="text-center py-[3rem] text-slate-400">
              Aucune commande en production pour cette date
            </div>
          ) : (
            commandes.map((cmd) => (
              <div
                key={cmd.id}
                className="border border-slate-200 rounded-xl p-[0.75rem] sm:p-[1rem] hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-[0.5rem]">
                  <div className="flex-1">
                    {/* Identité */}
                    <div className="flex flex-wrap items-center gap-[0.5rem] sm:gap-[0.75rem] mb-[0.5rem]">
                      <span className="font-mono font-bold text-[1rem] sm:text-[1.125rem] text-slate-800">{cmd.numero}</span>
                      <span className="text-slate-500 text-[0.8125rem]">{cmd.clientNom}</span>
                      <ServiceBadge service={cmd.service} size="md" />
                      {cmd.reprise && (
                        <span className="px-[0.5rem] py-[0.125rem] bg-red-100 text-red-600 rounded text-[0.6875rem] font-bold">
                          REPRISE
                        </span>
                      )}
                    </div>
                    <p className="text-[0.8125rem] text-slate-400 mb-[0.75rem]">{cmd.adresse}</p>

                    {/* Dates */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[0.5rem] sm:gap-[1rem] text-[0.8125rem] mb-[0.75rem]">
                      <div>
                        <p className="text-slate-400 text-[0.6875rem]">Date prévue</p>
                        <p className="font-semibold text-green-600 bg-green-50 px-[0.375rem] py-[0.125rem] rounded inline-block">
                          {formatDateFr(cmd.datePrevue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[0.6875rem]">Date production</p>
                        <p className="font-semibold text-blue-700 bg-blue-50 px-[0.375rem] py-[0.125rem] rounded inline-block">
                          {formatDateFr(cmd.dateProduction)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[0.6875rem]">Prise mesure</p>
                        <p className="font-semibold text-amber-600 bg-amber-50 px-[0.375rem] py-[0.125rem] rounded inline-block">
                          {formatDateFr(cmd.datePriseMesure)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[0.6875rem]">Couleur</p>
                        <p className="font-semibold text-slate-700">{cmd.couleur ?? "—"}</p>
                      </div>
                    </div>

                    {/* Codes production */}
                    <div className="flex flex-wrap gap-x-[1rem] gap-y-[0.375rem] text-[0.8125rem] mb-[0.75rem]">
                      <div className="flex items-center gap-[0.375rem]">
                        <span className="text-slate-400">Mesure:</span>
                        <CodeBadge code={cmd.mesure} size="md" />
                      </div>
                      <div className="flex items-center gap-[0.375rem]">
                        <span className="text-slate-400">Plan:</span>
                        <CodeBadge code={cmd.plan} size="md" />
                      </div>
                      <div className="flex items-center gap-[0.375rem]">
                        <span className="text-slate-400">Envoyé prod:</span>
                        <CodeBadge code={cmd.envoyeProduction} size="md" />
                      </div>
                    </div>

                    {/* Métriques */}
                    <div className="flex items-center gap-[1rem] pt-[0.75rem] border-t border-slate-100">
                      <div className="bg-emerald-50 px-[0.75rem] py-[0.375rem] rounded-lg">
                        <span className="text-slate-400 text-[0.75rem]">Pi. lin.: </span>
                        <span className="font-bold text-[1.25rem] text-emerald-600">{cmd.piedsLineairesRampes}</span>
                      </div>
                      <div className="bg-blue-50 px-[0.75rem] py-[0.375rem] rounded-lg">
                        <span className="text-slate-400 text-[0.75rem]">Poteaux: </span>
                        <span className="font-bold text-[1.25rem] text-blue-600">{cmd.nombrePoteaux}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-[0.75rem] sm:p-[1rem] bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center gap-[0.75rem]">
          <button
            onClick={onClose}
            className="px-[1.25rem] sm:px-[1.5rem] py-[0.625rem] sm:py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold text-[0.875rem] rounded-xl transition-colors"
          >
            Fermer
          </button>
          <div className="flex-1 flex flex-wrap items-center gap-[0.75rem] sm:gap-[1.5rem]">
            <div className="bg-white px-[0.75rem] py-[0.375rem] rounded-lg border text-[0.8125rem]">
              <span className="text-slate-400">Commandes: </span>
              <span className="font-bold text-[1.125rem]">{commandes.length}</span>
            </div>
            <div className="bg-emerald-100 px-[0.75rem] py-[0.375rem] rounded-lg text-[0.8125rem]">
              <span className="text-emerald-700">Total pi. lin.: </span>
              <span className="font-bold text-[1.125rem] text-emerald-700">{totalPl}</span>
            </div>
            <div className="bg-blue-100 px-[0.75rem] py-[0.375rem] rounded-lg text-[0.8125rem]">
              <span className="text-blue-700">Total poteaux: </span>
              <span className="font-bold text-[1.125rem] text-blue-700">{totalPot}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MODAL: METTRE EN PRODUCTION
// ══════════════════════════════════════════
function MettreEnProductionModal({
  commandes,
  commandesEnProduction,
  totalPiedsLin,
  currentMonth,
  semaines,
  searchTerm,
  setSearchTerm,
  filterSemaine,
  setFilterSemaine,
  onMettreEnProd,
  onRetirer,
  onUpdateChamp,
  onUpdateDate,
  onPrevMonth,
  onNextMonth,
  onClose,
}: {
  commandes: CommandeProduction[];
  commandesEnProduction: CommandeProduction[];
  totalPiedsLin: number;
  currentMonth: Date;
  semaines: { label: string; start: Date; end: Date }[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterSemaine: string;
  setFilterSemaine: (s: string) => void;
  onMettreEnProd: (id: string) => void;
  onRetirer: (id: string) => void;
  onUpdateChamp: (id: string, champ: string, val: string | null) => void;
  onUpdateDate: (id: string, date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onClose: () => void;
}) {
  const filtered = useMemo(() => {
    return commandes.filter((cmd) => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!cmd.numero.toLowerCase().includes(s) && !cmd.clientNom.toLowerCase().includes(s)) return false;
      }
      if (filterSemaine !== "toutes") {
        const semIdx = parseInt(filterSemaine);
        const sem = semaines[semIdx];
        if (sem && cmd.datePrevue) {
          const cmdDate = new Date(cmd.datePrevue);
          if (cmdDate < sem.start || cmdDate > sem.end) return false;
        }
      }
      return true;
    });
  }, [commandes, searchTerm, filterSemaine, semaines]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] sm:p-[1rem]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[80rem] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-[0.75rem] sm:p-[1rem] border-b border-slate-200 bg-slate-800 text-white gap-[0.5rem]">
          <div className="flex items-center gap-[0.5rem] sm:gap-[1rem]">
            <button onClick={onClose} className="p-[0.375rem] hover:bg-slate-700 rounded-lg transition-colors">
              <ChevronLeft className="w-[1.25rem] h-[1.25rem]" />
            </button>
            <h2 className="text-[1rem] sm:text-[1.25rem] font-bold">Envoyer des commandes en production</h2>
          </div>
          <div className="flex items-center gap-[1rem] sm:gap-[1.5rem]">
            <div className="text-center">
              <p className="text-[0.6875rem] text-slate-300">En production</p>
              <p className="text-[1.25rem] sm:text-[1.5rem] font-bold">{commandesEnProduction.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[0.6875rem] text-slate-300">Pieds lin. total</p>
              <p className="text-[1.25rem] sm:text-[1.5rem] font-bold text-emerald-400">{totalPiedsLin.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Navigation mois */}
        <MoisNavigation
          mois={currentMonth.getMonth()}
          annee={currentMonth.getFullYear()}
          onPrev={onPrevMonth}
          onNext={onNextMonth}
          variant="light"
        />

        {/* Filtres */}
        <div className="p-[0.75rem] sm:p-[1rem] border-b border-slate-200 flex flex-wrap gap-[0.75rem] items-center">
          <div className="flex items-center gap-[0.375rem]">
            <Search className="w-[0.875rem] h-[0.875rem] text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="# Projet ou client"
              className="px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] w-[10rem] sm:w-[12rem] focus:ring-2 focus:ring-amber-300 outline-none"
            />
          </div>
          <div className="flex items-center gap-[0.375rem]">
            <Filter className="w-[0.875rem] h-[0.875rem] text-slate-400" />
            <select
              value={filterSemaine}
              onChange={(e) => setFilterSemaine(e.target.value)}
              className="px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] focus:ring-2 focus:ring-amber-300 outline-none"
            >
              <option value="toutes">Toutes les semaines</option>
              {semaines.map((s, idx) => (
                <option key={idx} value={idx}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 text-right text-[0.8125rem] text-slate-500">
            {filtered.length} commandes affichées
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[0.8125rem] min-w-[55rem]">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-[0.75rem] py-[0.75rem] text-left font-semibold text-slate-600"># Projet</th>
                <th className="px-[0.75rem] py-[0.75rem] text-left font-semibold text-slate-600">Client</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center font-semibold text-slate-600">Service</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center font-semibold text-slate-600">Date Prévue</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center font-semibold text-slate-600">Date Prod.</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center font-semibold text-slate-600">Pi. Lin.</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center font-semibold text-slate-600">Mesure</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center font-semibold text-slate-600">Plan</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center font-semibold text-slate-600">Envoyé Prod.</th>
                <th className="px-[0.75rem] py-[0.75rem] text-center font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cmd) => (
                <tr
                  key={cmd.id}
                  className={`hover:bg-slate-50 transition-colors ${cmd.envoyeProduction === "COMPLETE" ? "bg-emerald-50/50" : ""}`}
                >
                  <td className="px-[0.75rem] py-[0.625rem] font-mono font-bold text-slate-800">{cmd.numero}</td>
                  <td className="px-[0.75rem] py-[0.625rem] text-slate-700">{cmd.clientNom}</td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <ServiceBadge service={cmd.service} />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center text-slate-600">
                    {formatDateFr(cmd.datePrevue)}
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <input
                      type="date"
                      value={cmd.dateProduction?.split("T")[0] ?? ""}
                      onChange={(e) => onUpdateDate(cmd.id, e.target.value)}
                      className="px-[0.375rem] py-[0.25rem] border border-slate-200 rounded text-[0.75rem] w-[8.5rem] focus:ring-1 focus:ring-amber-300 outline-none"
                    />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center font-bold text-emerald-600">
                    {cmd.piedsLineairesRampes || 0}
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <CodeSelect
                      value={cmd.mesure}
                      onChange={(v) => onUpdateChamp(cmd.id, "mesure", v)}
                      className="w-[3.5rem]"
                    />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <CodeSelect
                      value={cmd.plan}
                      onChange={(v) => onUpdateChamp(cmd.id, "plan", v)}
                      className="w-[3.5rem]"
                    />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <CodeSelect
                      value={cmd.envoyeProduction}
                      onChange={(v) => onUpdateChamp(cmd.id, "envoyeProduction", v)}
                      className="w-[3.5rem]"
                    />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    {cmd.envoyeProduction === "COMPLETE" ? (
                      <button
                        onClick={() => onRetirer(cmd.id)}
                        className="px-[0.625rem] py-[0.375rem] bg-red-100 text-red-600 hover:bg-red-200 rounded font-medium text-[0.75rem] transition-colors"
                      >
                        Retirer
                      </button>
                    ) : (
                      <button
                        onClick={() => onMettreEnProd(cmd.id)}
                        className="px-[0.625rem] py-[0.375rem] bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded font-medium text-[0.75rem] transition-colors"
                      >
                        Ajouter
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-[0.75rem] sm:p-[1rem] border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-[1.5rem] sm:px-[2rem] py-[0.625rem] sm:py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold text-[0.875rem] rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}