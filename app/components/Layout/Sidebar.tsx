"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";

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

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { name: "Tableau de bord", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { name: "Clients", href: "/clients", icon: <Users size={18} /> },
  { name: "Commandes", href: "/commandes", icon: <ClipboardList size={18} /> },
  { name: "Production", href: "/production", icon: <Factory size={18} /> },
  { name: "Planification", href: "/planification", icon: <Calendar size={18} /> },
  { name: "Interventions", href: "/interventions", icon: <Wrench size={18} /> },
  { name: "Cueillettes /Transport", href: "/cueillettes", icon: <Truck size={18} /> },
  { name: "Inventaire", href: "/inventaire", icon: <Package size={18} /> },
  { name: "Achats", href: "/achats", icon: <ShoppingCart size={18} /> },
  { name: "Rentabilité", href: "/rentabilite", icon: <TrendingUp size={18} /> },
  { name: "Attentes", href: "/attentes", icon: <Clock size={18} /> },
  { name: "Non-conformités", href: "/non-conformites", icon: <AlertTriangle size={18} /> },
  { name: "Multi-logements", href: "/multi-logements", icon: <Building2 size={18} /> },
  { name: "Reprises", href: "/reprises", icon: <RotateCcw size={18} /> },
  { name: "Rapports", href: "/rapports", icon: <FileBarChart size={18} /> },
  { name: "Paramètres", href: "/parametres", icon: <Settings size={18} /> },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Fermer le sidebar quand on change de page (mobile)
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Empêcher le scroll du body quand le sidebar est ouvert sur mobile
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

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 bg-gardex-black text-white z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo + Bouton fermer (mobile) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/images/logo-gardex.png"
              alt="Rampes Gardex"
              width={140}
              height={45}
              className="object-contain"
              priority
            />
          </Link>

          {/* Bouton fermer (mobile seulement) */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-0.5 px-3">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200
                      ${
                        isActive
                          ? "bg-gardex-orange/20 text-gardex-orange font-medium"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <span className={isActive ? "text-gardex-orange" : "text-gray-500"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Déconnexion */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            <LogOut size={18} className="text-gray-500" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}