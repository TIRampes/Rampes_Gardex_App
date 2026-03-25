"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Bell, Menu, User, Settings, LogOut,
  Sun, Moon, AlertTriangle, CheckCircle2, Info
} from "lucide-react";

import { useTheme } from "../../hooks/useTheme";

const quickServices = [
  { name: "Livraison", color: "bg-blue-500" },
  { name: "Cueillette", color: "bg-yellow-500" },
  { name: "Installation", color: "bg-red-500" },
  { name: "Transport", color: "bg-green-500" },
];

// ─── Mapping des rôles Prisma → Label français ──────────────
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  GESTIONNAIRE: "Gestionnaire",
  EMPLOYE: "Employé",
  CHAUFFEUR: "Chauffeur",
  INSTALLATEUR: "Installateur",
  MESUREUR: "Mesureur",
  CLIENT: "Client",
  REPRESENTANT: "Représentant",
  PRODUCTEUR: "Producteur",
};

const getRoleLabel = (role: string | undefined | null): string => {
  if (!role) return "Employé";
  return ROLE_LABELS[role.toUpperCase()] || role;
};

const getRoleBadgeColor = (role: string | undefined | null): string => {
  switch (role?.toUpperCase()) {
    case "ADMIN": return "text-red-400";
    case "GESTIONNAIRE": return "text-purple-400";
    case "REPRESENTANT": return "text-cyan-400";
    case "MESUREUR": return "text-indigo-400";
    case "INSTALLATEUR": return "text-emerald-400";
    case "CHAUFFEUR": return "text-blue-400";
    case "PRODUCTEUR": return "text-orange-400";
    case "CLIENT": return "text-slate-400";
    default: return "text-amber-400";
  }
};

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
  const { toggleTheme, isDark } = useTheme();
  const { data: session } = useSession();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const rawRole = (session?.user as any)?.role;

  const user = {
    name: session?.user?.name || "Utilisateur",
    email: session?.user?.email || "user@rampesgardex.com",
    role: getRoleLabel(rawRole),
    roleColor: getRoleBadgeColor(rawRole),
    initials: session?.user?.name?.charAt(0).toUpperCase() || "U",
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle size={14} className="text-amber-500" />;
      case "error": return <AlertTriangle size={14} className="text-red-500" />;
      case "success": return <CheckCircle2 size={14} className="text-green-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#1a2332] to-[#0f1419] border-b border-gray-700 z-30 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-white/10 transition text-white"
          >
            <Menu size={24} />
          </button>

          <div className="hidden md:flex items-center gap-2">
            {quickServices.map((service) => (
              <div
                key={service.name}
                className={`px-4 py-2 rounded text-sm font-semibold text-white ${service.color}`}
              >
                {service.name}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {/* THEME */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-white/10 text-white"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2.5 rounded-xl hover:bg-white/10 text-white relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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

                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border dark:border-slate-700 z-50 overflow-hidden">

                  {/* Header notifications */}
                  <div className="px-4 py-3 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Notifications
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>

                  {/* Liste des notifications */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell size={28} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Aucune notification
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`px-4 py-3 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition ${
                            notif.unread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm truncate ${
                                  notif.unread
                                    ? "font-semibold text-gray-900 dark:text-white"
                                    : "font-medium text-gray-700 dark:text-gray-300"
                                }`}>
                                  {notif.title}
                                </p>
                                {notif.unread && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                {notif.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                      <Link
                        href="/notifications"
                        className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                        onClick={() => setShowNotifications(false)}
                      >
                        Voir toutes les notifications
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* PROFILE */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/10"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-white truncate max-w-[160px]">
                  {user.name}
                </p>
                <p className="text-xs text-white/70 truncate max-w-[160px]">
                  {user.email}
                </p>
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${user.roleColor}`}>
                  {user.role}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 font-bold flex items-center justify-center">
                {user.initials}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />

                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border dark:border-slate-700 z-50 overflow-hidden">

                  <div className="px-4 py-3 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                    <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    <p className="text-xs text-amber-500 font-bold mt-1 uppercase">
                      {user.role}
                    </p>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/profil"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <User size={18} />
                      Mon profil
                    </Link>

                    <Link
                      href="/parametres"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <Settings size={18} />
                      Paramètres
                    </Link>
                  </div>

                  <div className="border-t dark:border-slate-700 py-2">
                    <button
                      onClick={() => signOut({ callbackUrl: "/auth/login" })}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
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