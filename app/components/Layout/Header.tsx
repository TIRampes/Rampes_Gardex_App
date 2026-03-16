"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { 
  Bell, Menu, ChevronDown, User, Settings, LogOut,
  Sun, Moon, Palette, AlertTriangle, CheckCircle2, Info
} from "lucide-react";

import { useTheme } from "../../hooks/useTheme";

const quickServices = [
  { name: "Livraison", color: "bg-blue-500", dotColor: "bg-blue-500" },
  { name: "Cueillette", color: "bg-yellow-500", dotColor: "bg-yellow-500" },
  { name: "Installation", color: "bg-red-500", dotColor: "bg-red-500" },
  { name: "Transport", color: "bg-green-500", dotColor: "bg-green-500" },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: "info" | "warning" | "success" | "error";
  link?: string;
}

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, palette, toggleTheme, selectPalette, colorPalettes, isDark } = useTheme(); 
  const { data: session } = useSession();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileServices, setShowMobileServices] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const user = {
    name: session?.user?.name || "Utilisateur",
    email: session?.user?.email || "user@rampesgardex.com",
    initials: session?.user?.name?.charAt(0).toUpperCase() || "U",
  };

  /**
   * Fetch notifications
   */
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle size={14} className="text-amber-500" />;
      case "error": return <AlertTriangle size={14} className="text-red-500" />;
      case "success": return <CheckCircle2 size={14} className="text-green-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  const handlePaletteSelect = (p: typeof palette) => {
    selectPalette(p);
    setShowThemeMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#1a2332] to-[#0f1419] border-b border-gray-700 z-30 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">

        {/* Gauche */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
          >
            <Menu size={24} />
          </button>

          <div className="hidden md:flex items-center gap-2">
            {quickServices.map((service) => (
              <div
                key={service.name}
                className={`px-4 py-2 rounded text-sm font-semibold text-white shadow-md ${service.color}`}
              >
                {service.name}
              </div>
            ))}
          </div>
        </div>

        {/* Droite */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Thème */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="hidden lg:block h-8 w-px bg-white/20" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                const open = !showNotifications;
                setShowNotifications(open);

                // ⚡ Chargement uniquement à l'ouverture
                if (open && notifications.length === 0) {
                  fetchNotifications();
                }
              }}
              className="relative p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white"
            >
              <Bell size={22} />

              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">Notifications</h3>

                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-gardex-orange hover:underline font-medium"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">

                    {loadingNotifications ? (
                      <div className="p-6 text-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gardex-orange rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">Chargement...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <Link
                          key={notif.id}
                          href={notif.link || "#"}
                          onClick={() => setShowNotifications(false)}
                          className={`block px-5 py-4 border-b border-gray-50 hover:bg-gray-50 ${
                            notif.unread ? "bg-orange-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {notif.unread && (
                              <span className="w-2 h-2 bg-gardex-orange rounded-full mt-2" />
                            )}

                            <div className="flex gap-2">
                              {getNotificationIcon(notif.type)}
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {notif.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {notif.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}

                  </div>

                  <div className="px-5 py-3 bg-gray-50 text-center border-t border-gray-100">
                    <Link
                      href="/dashboard/notifications"
                      className="text-sm text-gardex-orange hover:underline font-semibold"
                    >
                      Voir toutes les notifications
                    </Link>
                  </div>

                </div>
              </>
            )}
          </div>

          <div className="hidden sm:block h-8 w-px bg-white/20" />

          {/* Profil */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-white truncate max-w-[140px]">
                  {user.name}
                </p>
                <p className="text-xs text-white/70 truncate max-w-[140px]">
                  {user.email}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gardex-orange to-[#e6951f] text-white font-bold flex items-center justify-center shadow-md">
                {user.initials}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />

                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-2">

                    <Link
                      href="/profil"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={18} />
                      Mon profil
                    </Link>

                    <Link
                      href="/parametres"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings size={18} />
                      Paramètres
                    </Link>

                  </div>

                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={() => signOut({ callbackUrl: "/auth/login" })}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
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