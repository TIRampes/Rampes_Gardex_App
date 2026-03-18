"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { X } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";

import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Factory,
  Calendar,
  Wrench,
  Truck,
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
  AlertTriangle,
  Building2,
  RotateCcw,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";

// Tous les menus avec leur id d'accès (doit matcher auth-config.ts)
const TOUS_LES_MENUS = [
  { id: "dashboard",      name: "Tableau de bord",  href: "/dashboard/dashboard",       icon: LayoutDashboard },
  { id: "clients",        name: "Clients",          href: "/dashboard/clients",          icon: Users },
  { id: "commandes",      name: "Commandes",        href: "/dashboard/commandes",        icon: ClipboardList },
  { id: "production",     name: "Production",        href: "/dashboard/production",       icon: Factory },
  { id: "planification",  name: "Planification",     href: "/dashboard/planification",    icon: Calendar },
  { id: "interventions",  name: "Interventions",     href: "/dashboard/interventions",    icon: Wrench },
  { id: "inventaire",     name: "Inventaire",        href: "/dashboard/inventaire",       icon: Package },
  { id: "achats",         name: "Achats",            href: "/dashboard/achats",           icon: ShoppingCart },
  { id: "rentabilite",    name: "Rentabilité",       href: "/dashboard/rentabilite",      icon: TrendingUp },
  { id: "attentes",       name: "Attentes",          href: "/dashboard/attentes",         icon: Clock },
  { id: "nonconformites", name: "Non-conformités",   href: "/dashboard/non_conformite",   icon: AlertTriangle },
  { id: "multilogements", name: "Multi-logements",   href: "/dashboard/multi_logements",  icon: Building2 },
  { id: "commissions",    name: "Commissions",       href: "/dashboard/commissions",      icon: ClipboardList },
  { id: "reprises",       name: "Reprises",          href: "/dashboard/reprises",         icon: RotateCcw },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { theme, toggleTheme, selectPalette } = useTheme();
  const pathname = usePathname();
  const { canAccess, user, isAdmin } = useAuth();

  // Filtrer les menus selon le rôle de l'utilisateur
  const menuItems = TOUS_LES_MENUS.filter((item) => canAccess(item.id));

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 z-50 flex flex-col
          bg-gradient-to-b from-[#1a2332] to-[#0f1419]
          transform transition-transform duration-300 ease-in-out
          shadow-2xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/dashboard/dashboard" className="flex items-center">
            <Image
              src="/images/logo-gardex.png"
              alt="Rampes Gardex"
              width={160}
              height={53}
              className="object-contain"
              priority
            />
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation — filtrée par rôle */}
        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200 group
                      ${isActive
                        ? "bg-gradient-to-r from-gardex-orange to-[#e6951f] text-white shadow-lg shadow-gardex-orange/25"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <Icon
                      size={20}
                      className={`transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`}
                    />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Utilisateur + Déconnexion */}
        <div className="p-4 border-t border-white/10">
          {user && (
            <div className="px-4 py-2 mb-2">
              <p className="text-[0.75rem] text-gray-400 truncate">{user.name}</p>
              <p className="text-[0.625rem] text-gray-500 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut size={20} className="transition-transform group-hover:scale-110" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}