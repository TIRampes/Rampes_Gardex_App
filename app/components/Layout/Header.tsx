"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, MoreVertical } from "lucide-react";

// Services rapides (boutons colorés)
const quickServices = [
  { name: "Livraison", href: "/interventions/new?type=livraison", color: "bg-blue-500 hover:bg-blue-600" },
  { name: "Cueillette", href: "/interventions/new?type=cueillette", color: "bg-green-500 hover:bg-green-600" },
  { name: "Intervention", href: "/interventions/new?type=intervention", color: "bg-red-500 hover:bg-red-600" },
  { name: "Transport", href: "/interventions/new?type=transport", color: "bg-purple-500 hover:bg-purple-600" },
];

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickServices, setShowQuickServices] = useState(false);

  // Données simulées
  const user = {
    name: "Admin Utilisateur",
    email: "admin@rampesgardex.com",
    initials: "A",
  };

  const notifications = [
    { id: 1, title: "Nouvelle commande", message: "CMD-2024-004 créée", time: "5 min", unread: true },
    { id: 2, title: "Stock critique", message: 'Poteaux 2"x2" - Seuil atteint', time: "1h", unread: true },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-white border-b border-gray-200 z-30">
      <div className="flex items-center justify-between h-full px-4">
        {/* Gauche: Menu hamburger (mobile) + Services rapides */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bouton Menu hamburger (mobile seulement) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Menu size={24} />
          </button>

          {/* Services rapides - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {quickServices.map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className={`px-3 lg:px-4 py-1.5 rounded-full text-xs lg:text-sm font-medium text-white transition-all duration-200 ${service.color}`}
              >
                {service.name}
              </Link>
            ))}
          </div>

          {/* Services rapides - Mobile (menu déroulant) */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowQuickServices(!showQuickServices)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gardex-orange text-white rounded-full text-xs font-medium"
            >
              Actions
              <MoreVertical size={14} />
            </button>

            {showQuickServices && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickServices(false)}
                />
                <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                  {quickServices.map((service) => (
                    <Link
                      key={service.name}
                      href={service.href}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                      onClick={() => setShowQuickServices(false)}
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${service.color.split(" ")[0]}`}
                      />
                      {service.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Droite: Notifications + Profil */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Dropdown Notifications */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          notif.unread ? "bg-orange-50" : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profil utilisateur */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nom - caché sur très petit écran */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] lg:max-w-none">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[120px] lg:max-w-none">
                {user.email}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gardex-orange text-white font-semibold flex items-center justify-center text-sm flex-shrink-0">
              {user.initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}