"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
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

const menuItems = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Commandes", href: "/commandes", icon: ClipboardList },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Planification", href: "/planification", icon: Calendar },
  { name: "Interventions", href: "/interventions", icon: Wrench },
  { name: "Cueillettes /Transport", href: "/cueillettes", icon: Truck },
  { name: "Inventaire", href: "/inventaire", icon: Package },
  { name: "Achats", href: "/achats", icon: ShoppingCart },
  { name: "Rentabilité", href: "/rentabilite", icon: TrendingUp },
  { name: "Attentes", href: "/attentes", icon: Clock },
  { name: "Non-conformités", href: "/non-conformites", icon: AlertTriangle },
  { name: "Multi-logements", href: "/multi-logements", icon: Building2 },
  { name: "Reprises", href: "/reprises", icon: RotateCcw },
  { name: "Rapports", href: "/rapports", icon: FileBarChart },
  { name: "Paramètres", href: "/parametres", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

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
    signOut({ callbackUrl: "/Auth/login" });
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 z-50 flex flex-col
          bg-gradient-to-b from-[#1a2332] to-[#0f1419]
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 shadow-2xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header avec Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center">
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
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
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

        {/* Déconnexion */}
        <div className="p-4 border-t border-white/10">
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