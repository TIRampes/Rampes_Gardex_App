"use client";

import { useState, useEffect } from "react";
import { Package, Truck, Ruler, Tags, AlertTriangle, DollarSign, Activity, Loader2, ArrowRight, TrendingDown } from "lucide-react";
import Link from "next/link";
import InventaireNav from "@/app/components/inventaire/Inventaireav";

interface DashStats {
  totalActives: number;
  totalInactives: number;
  totalSousSeuil: number;
  valeurStock: number;
}

export default function InventaireDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [fournisseursCount, setFournisseursCount] = useState(0);
  const [unitesCount, setUnitesCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lowStockPieces, setLowStockPieces] = useState<{ code: string; nom: string; quantite: number; seuilMin: number }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [piecesRes, fournRes, unitesRes, catsRes] = await Promise.all([
          fetch("/api/inventaire/pieces?limite=10&sousSeuilMin=true").then((r) => r.json()),
          fetch("/api/inventaire/fournisseurs?limite=1").then((r) => r.json()),
          fetch("/api/inventaire/unites").then((r) => r.json()),
          fetch("/api/inventaire/categories").then((r) => r.json()),
        ]);
        if (piecesRes.stats) setStats(piecesRes.stats);
        if (piecesRes.data) setLowStockPieces(piecesRes.data.slice(0, 8));
        if (fournRes.pagination) setFournisseursCount(fournRes.pagination.total);
        if (unitesRes.data) setUnitesCount(unitesRes.data.length);
        if (catsRes.data) setCategoriesCount(catsRes.data.length);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const formatMoney = (n: number) => new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[0.75rem] py-[1.25rem]">
            <div>
              <h1 className="text-[1.375rem] sm:text-[1.625rem] font-extrabold text-slate-800 tracking-tight flex items-center gap-[0.5rem]">
                <div className="w-[2.25rem] h-[2.25rem] bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-[1.125rem] h-[1.125rem] text-white" />
                </div>
                Inventaire
              </h1>
              <p className="text-[0.8125rem] text-slate-500 mt-[0.125rem]">Gestion des pièces, fournisseurs et unités</p>
            </div>
          </div>
          <InventaireNav />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem] py-[1.25rem]">
        {loading ? (
          <div className="flex items-center justify-center py-[4rem]">
            <Loader2 className="w-[1.5rem] h-[1.5rem] text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-[1.25rem]">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[0.75rem]">
              <StatCard
                icon={<Package className="w-[1.125rem] h-[1.125rem]" />}
                label="Pièces actives"
                value={String(stats?.totalActives ?? 0)}
                sub={`${stats?.totalInactives ?? 0} inactives`}
                color="sky"
                href="/dashboard/inventaire/pieces"
              />
              <StatCard
                icon={<AlertTriangle className="w-[1.125rem] h-[1.125rem]" />}
                label="Sous le seuil"
                value={String(stats?.totalSousSeuil ?? 0)}
                sub="à commander"
                color="rose"
                href="/dashboard/inventaire/pieces?sousSeuilMin=true"
              />
              <StatCard
                icon={<DollarSign className="w-[1.125rem] h-[1.125rem]" />}
                label="Valeur stock"
                value={formatMoney(stats?.valeurStock ?? 0)}
                sub="estimation totale"
                color="emerald"
              />
              <StatCard
                icon={<Truck className="w-[1.125rem] h-[1.125rem]" />}
                label="Fournisseurs"
                value={String(fournisseursCount)}
                sub={`${unitesCount} unités · ${categoriesCount} catégories`}
                color="amber"
                href="/dashboard/inventaire/fournisseurs"
              />
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[0.75rem]">
              <QuickLink href="/dashboard/inventaire/pieces" icon={Package} label="Pièces" desc="Gérer les pièces et l'inventaire" count={stats?.totalActives ?? 0} />
              <QuickLink href="/dashboard/inventaire/fournisseurs" icon={Truck} label="Fournisseurs" desc="Gérer les fournisseurs" count={fournisseursCount} />
              <QuickLink href="/dashboard/inventaire/unites" icon={Ruler} label="Unités & Catégories" desc="Configurer les unités et catégories" count={unitesCount + categoriesCount} />
            </div>

            {/* Low stock alert table */}
            {lowStockPieces.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-[1.25rem] py-[1rem] border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-[0.5rem]">
                    <div className="w-[2rem] h-[2rem] bg-rose-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-[1rem] h-[1rem] text-rose-600" />
                    </div>
                    <div>
                      <h2 className="text-[0.9375rem] font-bold text-slate-800">Stock critique</h2>
                      <p className="text-[0.6875rem] text-slate-500">Pièces sous le seuil minimum</p>
                    </div>
                  </div>
                  <Link href="/dashboard/inventaire/pieces?sousSeuilMin=true" className="text-[0.75rem] text-sky-600 hover:text-sky-800 font-medium flex items-center gap-[0.25rem]">
                    Voir tout <ArrowRight className="w-[0.75rem] h-[0.75rem]" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[0.8125rem]">
                    <thead>
                      <tr className="text-[0.6875rem] text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/70">
                        <th className="px-[1.25rem] py-[0.625rem] text-left">Code</th>
                        <th className="px-[0.75rem] py-[0.625rem] text-left">Nom</th>
                        <th className="px-[0.75rem] py-[0.625rem] text-right">Qté</th>
                        <th className="px-[0.75rem] py-[0.625rem] text-right">Seuil min</th>
                        <th className="px-[1.25rem] py-[0.625rem] text-right">Manque</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockPieces.map((p) => (
                        <tr key={p.code} className="border-t border-slate-100 hover:bg-rose-50/40 transition-colors">
                          <td className="px-[1.25rem] py-[0.5rem] font-mono font-bold text-slate-800">{p.code}</td>
                          <td className="px-[0.75rem] py-[0.5rem] text-slate-600 max-w-[14rem] truncate">{p.nom}</td>
                          <td className="px-[0.75rem] py-[0.5rem] text-right font-bold text-rose-600">{p.quantite}</td>
                          <td className="px-[0.75rem] py-[0.5rem] text-right text-slate-500">{p.seuilMin}</td>
                          <td className="px-[1.25rem] py-[0.5rem] text-right">
                            <span className="bg-rose-100 text-rose-700 px-[0.375rem] py-[0.125rem] rounded-md text-[0.6875rem] font-bold">
                              -{p.seuilMin - p.quantite}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ──── Sub-components ────

function StatCard({ icon, label, value, sub, color, href }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string; href?: string }) {
  const colorMap: Record<string, { bg: string; iconBg: string; text: string; accent: string }> = {
    sky: { bg: "bg-sky-50", iconBg: "bg-sky-100 text-sky-600", text: "text-sky-900", accent: "text-sky-500" },
    rose: { bg: "bg-rose-50", iconBg: "bg-rose-100 text-rose-600", text: "text-rose-900", accent: "text-rose-500" },
    emerald: { bg: "bg-emerald-50", iconBg: "bg-emerald-100 text-emerald-600", text: "text-emerald-900", accent: "text-emerald-500" },
    amber: { bg: "bg-amber-50", iconBg: "bg-amber-100 text-amber-600", text: "text-amber-900", accent: "text-amber-500" },
  };
  const c = colorMap[color] ?? colorMap.sky;
  const Wrapper: React.ElementType = href ? Link : "div";
  const props = href ? { href } : {};
  return (
    <Wrapper {...(props as Record<string, string>)} className={`${c.bg} rounded-2xl p-[1rem] border border-slate-100 ${href ? "hover:shadow-md cursor-pointer" : ""} transition-all group`}>
      <div className="flex items-center justify-between mb-[0.5rem]">
        <div className={`w-[2rem] h-[2rem] ${c.iconBg} rounded-lg flex items-center justify-center`}>{icon}</div>
        {href && <ArrowRight className="w-[0.875rem] h-[0.875rem] text-slate-300 group-hover:text-slate-500 transition-colors" />}
      </div>
      <p className={`text-[1.25rem] sm:text-[1.5rem] font-extrabold ${c.text} leading-none`}>{value}</p>
      <p className="text-[0.6875rem] text-slate-500 mt-[0.25rem]">{label}</p>
      <p className={`text-[0.625rem] ${c.accent} font-medium mt-[0.125rem]`}>{sub}</p>
    </Wrapper>
  );
}

function QuickLink({ href, icon: Icon, label, desc, count }: { href: string; icon: React.ElementType; label: string; desc: string; count: number }) {
  return (
    <Link href={href} className="bg-white rounded-2xl border border-slate-200 p-[1rem] hover:shadow-lg hover:border-slate-300 transition-all group flex items-center gap-[0.875rem]">
      <div className="w-[3rem] h-[3rem] bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white text-slate-500 transition-all flex-shrink-0">
        <Icon className="w-[1.375rem] h-[1.375rem]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-[0.9375rem] font-bold text-slate-800">{label}</p>
          <span className="text-[0.75rem] bg-slate-100 text-slate-600 px-[0.375rem] py-[0.0625rem] rounded-md font-medium">{count}</span>
        </div>
        <p className="text-[0.75rem] text-slate-500 mt-[0.125rem]">{desc}</p>
      </div>
      <ArrowRight className="w-[1rem] h-[1rem] text-slate-300 group-hover:text-slate-600 flex-shrink-0 transition-colors" />
    </Link>
  );
}