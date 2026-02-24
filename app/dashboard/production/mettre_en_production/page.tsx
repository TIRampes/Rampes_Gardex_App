"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Factory,
  ArrowLeft,
} from "lucide-react";
import { type CommandeProduction } from "../schema";
import {
  ServiceBadge,
  CodeSelect,
  MoisNavigation,
  formatDateFr,
  ProductionSkeleton,
} from "@/app/components/production/productionui";

const MOIS_NOMS = [
  "janvier","février","mars","avril","mai","juin",
  "juillet","août","septembre","octobre","novembre","décembre",
];

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

export default function MettreEnProductionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [commandes, setCommandes] = useState<CommandeProduction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemaine, setFilterSemaine] = useState("toutes");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/production?statut=ACTIVE&limite=200`);
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      setCommandes(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCommandes(); }, [fetchCommandes]);

  const commandesEnProduction = useMemo(
    () => commandes.filter((c) => c.envoyeProduction === "COMPLETE" && c.productionTerminee !== "COMPLETE"),
    [commandes]
  );

  const totalPiedsLin = useMemo(
    () => commandesEnProduction.reduce((s, c) => s + c.piedsLineairesRampes, 0),
    [commandesEnProduction]
  );

  const semaines = useMemo(() => getWeeksOfMonth(currentMonth), [currentMonth]);

  const filtered = useMemo(() => {
    return commandes.filter((cmd) => {
      if (cmd.statut !== "ACTIVE") return false;
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

  async function mettreEnProd(cmdId: string) {
    await fetch("/api/production", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandeId: cmdId, envoyeProduction: "COMPLETE", enProduction: true }),
    });
    setCommandes((prev) =>
      prev.map((c) => (c.id === cmdId ? { ...c, envoyeProduction: "COMPLETE", enProduction: true } : c))
    );
  }

  async function retirerProd(cmdId: string) {
    await fetch("/api/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retirer", commandeId: cmdId }),
    });
    setCommandes((prev) =>
      prev.map((c) => (c.id === cmdId ? { ...c, envoyeProduction: null, enProduction: false } : c))
    );
  }

  async function updateChamp(cmdId: string, champ: string, val: string | null) {
    await fetch("/api/production", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandeId: cmdId, [champ]: val }),
    });
    setCommandes((prev) => prev.map((c) => (c.id === cmdId ? { ...c, [champ]: val } : c)));
  }

  async function updateDate(cmdId: string, date: string) {
    await fetch("/api/production", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandeId: cmdId, dateProduction: date || null }),
    });
    setCommandes((prev) => prev.map((c) => (c.id === cmdId ? { ...c, dateProduction: date || null } : c)));
  }

  if (loading) return <ProductionSkeleton />;

  return (
    <div className="space-y-[1rem]">
      {/* Header */}
      <div className="flex items-center gap-[0.75rem]">
        <button
          onClick={() => router.push("/production")}
          className="p-[0.5rem] hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-[1.25rem] h-[1.25rem] text-slate-600" />
        </button>
        <div>
          <h1 className="text-[1.25rem] sm:text-[1.5rem] font-bold text-slate-800 flex items-center gap-[0.5rem]">
            <Factory className="w-[1.25rem] h-[1.25rem] text-amber-500" />
            Mettre en production
          </h1>
          <p className="text-[0.8125rem] text-slate-500">Envoyez des commandes en production</p>
        </div>
        <div className="ml-auto flex items-center gap-[1rem]">
          <div className="text-center bg-slate-800 text-white px-[1rem] py-[0.5rem] rounded-xl">
            <p className="text-[0.625rem] text-slate-300">En production</p>
            <p className="text-[1.25rem] font-bold">{commandesEnProduction.length}</p>
          </div>
          <div className="text-center bg-emerald-50 px-[1rem] py-[0.5rem] rounded-xl border border-emerald-200">
            <p className="text-[0.625rem] text-emerald-600">Pieds lin.</p>
            <p className="text-[1.25rem] font-bold text-emerald-700">{totalPiedsLin.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Month nav */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <MoisNavigation
          mois={currentMonth.getMonth()}
          annee={currentMonth.getFullYear()}
          onPrev={() => setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
          onNext={() => setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
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
              className="px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] w-[12rem] focus:ring-2 focus:ring-amber-300 outline-none"
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
            {filtered.length} commandes
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[calc(100vh-22rem)]">
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
                  <td className="px-[0.75rem] py-[0.625rem] text-center"><ServiceBadge service={cmd.service} /></td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center text-slate-600">{formatDateFr(cmd.datePrevue)}</td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <input
                      type="date"
                      value={cmd.dateProduction?.split("T")[0] ?? ""}
                      onChange={(e) => updateDate(cmd.id, e.target.value)}
                      className="px-[0.375rem] py-[0.25rem] border border-slate-200 rounded text-[0.75rem] w-[8.5rem] focus:ring-1 focus:ring-amber-300 outline-none"
                    />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center font-bold text-emerald-600">{cmd.piedsLineairesRampes}</td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <CodeSelect value={cmd.mesure} onChange={(v) => updateChamp(cmd.id, "mesure", v)} className="w-[3.5rem]" />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <CodeSelect value={cmd.plan} onChange={(v) => updateChamp(cmd.id, "plan", v)} className="w-[3.5rem]" />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    <CodeSelect value={cmd.envoyeProduction} onChange={(v) => updateChamp(cmd.id, "envoyeProduction", v)} className="w-[3.5rem]" />
                  </td>
                  <td className="px-[0.75rem] py-[0.625rem] text-center">
                    {cmd.envoyeProduction === "COMPLETE" ? (
                      <button onClick={() => retirerProd(cmd.id)} className="px-[0.625rem] py-[0.375rem] bg-red-100 text-red-600 hover:bg-red-200 rounded font-medium text-[0.75rem] transition-colors">
                        Retirer
                      </button>
                    ) : (
                      <button onClick={() => mettreEnProd(cmd.id)} className="px-[0.625rem] py-[0.375rem] bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded font-medium text-[0.75rem] transition-colors">
                        Ajouter
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}