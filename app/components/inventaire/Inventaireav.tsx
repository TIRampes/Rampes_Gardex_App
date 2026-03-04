"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Package, Truck, Ruler, Tags, LayoutDashboard } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/inventaire", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/inventaire/pieces", label: "Pièces", icon: Package, exact: false },
  { href: "/dashboard/inventaire/fournisseurs", label: "Fournisseurs", icon: Truck, exact: false },
  { href: "/dashboard/inventaire/unites", label: "Unités", icon: Ruler, exact: false },
  { href: "/dashboard/inventaire/categories", label: "Catégories", icon: Tags, exact: false },
];

export default function InventaireNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-[0.25rem] overflow-x-auto pb-[0.125rem] scrollbar-hide">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-[0.375rem] px-[0.75rem] py-[0.5rem] rounded-xl text-[0.8125rem] font-medium whitespace-nowrap transition-all ${
              active
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-[0.875rem] h-[0.875rem]" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}