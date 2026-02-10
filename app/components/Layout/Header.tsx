"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Bell, Menu, Search, ChevronDown, User, Settings, LogOut } from "lucide-react";


const quickServices = [
  { name: "Livraison",color: "bg-blue-500 hover:bg-blue-600", dotColor: "bg-blue-500" },
  { name: "Cueillette", color: "bg-yellow-500 hover:bg-yellow-600", dotColor: "bg-yellow-500" },
  { name: "Intervention", color: "bg-red-500 hover:bg-red-600", dotColor: "bg-red-500" },
  { name: "Transport", color: "bg-green-500 hover:bg-green-600", dotColor: "bg-green-500" },
];

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileServices, setShowMobileServices] = useState(false);

  const user = {
    name: session?.user?.name || "Utilisateur",
    email: session?.user?.email || "user@rampesgardex.com",
    initials: session?.user?.name?.charAt(0).toUpperCase() || "U",
  };

  const notifications = [
    { id: 1, title: "Nouvelle commande", message: "CMD-2024-004 créée", time: "5 min", unread: true, type: "info" },
    { id: 2, title: "Stock critique", message: 'Poteaux 2"x2" - Seuil atteint', time: "1h", unread: true, type: "warning" },
    { id: 3, title: "Installation terminée", message: "CMD-2024-001 complétée", time: "3h", unread: false, type: "success" },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    // couleur de fond modifiée pour correspondre à l'identité visuelle
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-gradient-to-b from-[#1a2332] to-[#0f1419] border-b border-gray-200 z-30 bg-color-gbadex-white shadow-sm">

        {/* Conteneur principal du header */}
      <div className="flex items-center justify-between h-full px-4 lg:px-6 color-gray-900">
        {/* Gauche */}
        <div className="flex items-center gap-3">
          {/* Menu hamburger mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu size={24} />
          </button>

{/* Services rapides - Desktop */}
<div className="hidden md:flex items-center gap-2">
  {quickServices.map((service) => (
    <div
      key={service.name}
      className={`px-4 py-2 rounded text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${service.color} cursor-default`}
    >
      {service.name}
    </div>
  ))}
</div>

          {/* Services rapides - Mobile */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowMobileServices(!showMobileServices)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gardex-orange to-[#e6951f] text-white rounded-full text-sm font-semibold shadow-md"
            >
              Actions
              <ChevronDown size={16} className={`transition-transform ${showMobileServices ? 'rotate-180' : ''}`} />
            </button>

            {showMobileServices && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileServices(false)} />
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-2">
                  {quickServices.map((service) => (
                    <Link
                      key={service.name}
                        href="#"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowMobileServices(false)}
                    >
                      <span className={`w-3 h-3 rounded-full ${service.dotColor}`} />
                      {service.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Droite */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Recherche - Desktop */}
         {/* <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors">
            <Search size={18} />
            <span className="text-sm">Rechercher...</span>
            <kbd className="hidden xl:inline-flex px-2 py-0.5 bg-white rounded text-xs text-gray-400 border">⌘K</kbd>
          </button> */}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              
              className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <button className="text-sm text-gardex-orange hover:underline font-medium">
                      Tout marquer lu
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-5 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          notif.unread ? "bg-orange-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notif.unread && (
                            <span className="w-2 h-2 bg-gardex-orange rounded-full mt-2 flex-shrink-0" />
                          )}
                          <div className={notif.unread ? "" : "ml-5"}>
                            <p className="font-semibold text-gray-900">{notif.title}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 bg-gray-50 text-center border-t border-gray-100">
                    <Link href="/notifications" className="text-sm text-gardex-orange hover:underline font-semibold">
                      Voir toutes les notifications
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Séparateur */}
          <div className="hidden sm:block h-8 w-px bg-gray-200" />

          {/* Profil */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{user.name}</p>
                <p className="text-xs text-gray-500 truncate max-w-[140px]">{user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gardex-orange to-[#e6951f] text-white font-bold flex items-center justify-center shadow-md">
                {user.initials}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <Link href="/profil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User size={18} />
                      Mon profil
                    </Link>
                    <Link href="/parametres" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings size={18} />
                      Paramètres
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={() => signOut({ callbackUrl: "/Auth/login" })}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut size={18} />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}