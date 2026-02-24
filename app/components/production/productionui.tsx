"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  CODES_PRODUCTION_MAP,
  STATUTS_ACHAT_MAP,
  SERVICE_COLORS,
} from "@/app/dashboard/production/schema";
import type { ServiceCommande } from "@/app/dashboard/production/schema";

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
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// ──────────────────────────────────────────
// Onglets de navigation Production
// ──────────────────────────────────────────

type TabId = "calendrier" | "finaliser" | "statistiques";

interface ProductionTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function ProductionTabs({ activeTab, onTabChange }: ProductionTabsProps) {
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "calendrier", label: "Calendrier", icon: <Calendar className="w-[1.125rem] h-[1.125rem]" /> },
    { id: "finaliser", label: "Finaliser", icon: <Check className="w-[1.125rem] h-[1.125rem]" /> },
    { id: "statistiques", label: "Statistiques", icon: <BarChart3 className="w-[1.125rem] h-[1.125rem]" /> },
  ];

  return (
    <div className="flex gap-[0.25rem] bg-slate-100 p-[0.25rem] rounded-xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-[0.5rem] px-[1.25rem] py-[0.625rem] rounded-lg
            font-medium text-[0.875rem] transition-all duration-200
            ${
              activeTab === tab.id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }
          `}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────
// Badge Code de Production (√, At.C, etc.)
// ──────────────────────────────────────────

interface CodeBadgeProps {
  code: string | null | undefined;
  type?: "production" | "achat";
  size?: "sm" | "md";
}

export function CodeBadge({ code, type = "production", size = "sm" }: CodeBadgeProps) {
  const map = type === "achat" ? STATUTS_ACHAT_MAP : CODES_PRODUCTION_MAP;
  const info = map[code ?? ""] ?? map[""];

  const sizeClasses = size === "sm"
    ? "px-[0.5rem] py-[0.125rem] text-[0.6875rem]"
    : "px-[0.625rem] py-[0.25rem] text-[0.75rem]";

  return (
    <span className={`inline-flex items-center rounded font-bold whitespace-nowrap ${info.bg} ${info.text} ${sizeClasses}`}>
      {info.symbole}
    </span>
  );
}

// ──────────────────────────────────────────
// Badge Service (Installation, Livraison…)
// ──────────────────────────────────────────

interface ServiceBadgeProps {
  service: ServiceCommande;
  size?: "sm" | "md" | "lg";
}

export function ServiceBadge({ service, size = "sm" }: ServiceBadgeProps) {
  const colors = SERVICE_COLORS[service] ?? {
    bg: "bg-slate-200",
    text: "text-slate-700",
    border: "border-slate-300",
    rowBg: "bg-slate-50",
  };

  const label: Record<string, string> = {
    INSTALLATION: "Installation",
    LIVRAISON: "Livraison",
    CUEILLETTE: "Cueillette",
    TRANSPORT: "Transport",
  };

  const sizeClasses = {
    sm: "px-[0.5rem] py-[0.125rem] text-[0.6875rem]",
    md: "px-[0.75rem] py-[0.25rem] text-[0.75rem]",
    lg: "px-[1rem] py-[0.375rem] text-[0.875rem]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${colors.bg} ${colors.text} ${sizeClasses[size]}`}
    >
      {label[service] ?? service}
    </span>
  );
}

// ──────────────────────────────────────────
// Badge Service Card (fond coloré fort)
// ──────────────────────────────────────────

interface ServiceCardBadgeProps {
  service: ServiceCommande;
  numero: string;
  client?: string;
}

export function ServiceCardBadge({ service, numero, client }: ServiceCardBadgeProps) {
  const colors = SERVICE_COLORS[service] ?? {
    bg: "bg-slate-200",
    text: "text-slate-700",
    border: "border-slate-300",
    rowBg: "bg-slate-50",
  };

  return (
    <div
      className={`${colors.bg} ${colors.text} border-2 ${colors.border} px-[0.75rem] py-[0.5rem] rounded-lg`}
    >
      <p className="font-mono font-bold text-[0.875rem]">{numero}</p>
      {client && (
        <p className="text-[0.6875rem] opacity-90 truncate max-w-[8rem]">{client}</p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Sélecteur de code de production
// ──────────────────────────────────────────

interface CodeSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  type?: "production" | "achat";
  className?: string;
}

export function CodeSelect({ value, onChange, type = "production", className = "" }: CodeSelectProps) {
  const map = type === "achat" ? STATUTS_ACHAT_MAP : CODES_PRODUCTION_MAP;
  const currentInfo = map[value ?? ""] ?? map[""];

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={`
        px-[0.5rem] py-[0.25rem] rounded text-[0.75rem] font-bold
        border border-slate-200 cursor-pointer transition-colors
        ${currentInfo.bg} ${currentInfo.text}
        ${className}
      `}
    >
      {Object.entries(map).map(([code, info]) => (
        <option key={code} value={code}>
          {info.symbole === "—" ? "—" : info.symbole}
        </option>
      ))}
    </select>
  );
}

// ──────────────────────────────────────────
// Légende couleurs des services
// ──────────────────────────────────────────

export function LegendeServices() {
  return (
    <div className="flex items-center gap-[0.375rem] flex-wrap">
      {Object.entries(SERVICE_COLORS).map(([service, colors]) => {
        const label: Record<string, string> = {
          INSTALLATION: "Installation",
          LIVRAISON: "Livraison",
          CUEILLETTE: "Cueillette",
          TRANSPORT: "Transport",
        };
        return (
          <span
            key={service}
            className={`${colors.bg} ${colors.text} px-[0.5rem] py-[0.25rem] rounded text-[0.6875rem] font-bold`}
          >
            {label[service]}
          </span>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────
// Carte statistique
// ──────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  icon?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  bgColor = "bg-white",
  textColor = "text-slate-800",
  borderColor = "border-slate-100",
  icon,
}: StatCardProps) {
  return (
    <div className={`${bgColor} p-[1rem] sm:p-[1.5rem] rounded-2xl shadow-sm border ${borderColor} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <p className={`${textColor} text-[0.75rem] sm:text-[0.8125rem] font-medium opacity-80`}>
          {label}
        </p>
        {icon && <div className="opacity-40">{icon}</div>}
      </div>
      <p className={`text-[1.5rem] sm:text-[2rem] lg:text-[2.5rem] font-bold ${textColor} mt-[0.25rem]`}>
        {value}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────
// Navigation mois (calendrier)
// ──────────────────────────────────────────

const MOIS_NOMS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

interface MoisNavigationProps {
  mois: number;
  annee: number;
  onPrev: () => void;
  onNext: () => void;
  variant?: "dark" | "light";
}

export function MoisNavigation({ mois, annee, onPrev, onNext, variant = "dark" }: MoisNavigationProps) {
  const isDark = variant === "dark";
  return (
    <div
      className={`flex items-center justify-between p-[1rem] ${
        isDark ? "bg-slate-800 text-white" : "bg-slate-100"
      }`}
    >
      <button
        onClick={onPrev}
        className={`p-[0.5rem] rounded-full transition-colors ${
          isDark ? "hover:bg-slate-700" : "hover:bg-slate-200"
        }`}
      >
        <ChevronLeft className="w-[1.5rem] h-[1.5rem] sm:w-[1.75rem] sm:h-[1.75rem]" />
      </button>
      <h2 className="text-[1.125rem] sm:text-[1.5rem] font-bold capitalize">
        {MOIS_NOMS[mois]} {annee}
      </h2>
      <button
        onClick={onNext}
        className={`p-[0.5rem] rounded-full transition-colors ${
          isDark ? "hover:bg-slate-700" : "hover:bg-slate-200"
        }`}
      >
        <ChevronRight className="w-[1.5rem] h-[1.5rem] sm:w-[1.75rem] sm:h-[1.75rem]" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────
// Skeleton loader
// ──────────────────────────────────────────

export function ProductionSkeleton() {
  return (
    <div className="animate-pulse space-y-[1.5rem]">
      <div className="flex gap-[1rem]">
        <div className="h-[2.5rem] w-[15rem] bg-slate-200 rounded-xl" />
        <div className="h-[2.5rem] w-[10rem] bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-[1rem]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[6rem] bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-[30rem] bg-slate-200 rounded-2xl" />
    </div>
  );
}

// ──────────────────────────────────────────
// Utilitaires
// ──────────────────────────────────────────

export function formatDateFr(date: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getServiceRowBg(service: string): string {
  return SERVICE_COLORS[service]?.rowBg ?? "bg-white";
}