"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
          {/* Bouton hamburger - suppression de lg:hidden pour qu'il soit visible sur tous les écrans */}
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
                className={`px-4 py-2 rounded text-sm font-semibold text-white shadow-md ${service.color} cursor-default`}
              >
                {service.name}
              </div>
            ))}
          </div>
        </div>

        {/* Droite (le reste du code est inchangé) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Contrôles thème - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white relative group"
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs bg-black/80 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {isDark ? "Mode clair" : "Mode sombre"}
              </span>
            </button>

            {/* Bouton Palette */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white relative group"
              >
                <Palette size={20} />
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs bg-black/80 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Palette
                </span>
              </button>

              {showThemeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Personnalisation</h3>
                      <p className="text-xs text-gray-500">Choisissez votre thème</p>
                    </div>
                    
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Thème</span>
                        <button
                          onClick={toggleTheme}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors text-gray-700"
                        >
                          {isDark ? (
                            <>
                              <Sun size={14} />
                              Passer en clair
                            </>
                          ) : (
                            <>
                              <Moon size={14} />
                              Passer en sombre
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${isDark ? 'bg-gray-800' : 'bg-yellow-400'}`}
                            style={{ width: isDark ? '100%' : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{isDark ? "Sombre" : "Clair"}</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Palette de couleurs</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPalettes.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => handlePaletteSelect(p)}
                            className="flex flex-col items-center group"
                            title={p.name}
                          >
                            <div 
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                palette.name === p.name 
                                  ? 'border-blue-500 scale-110' 
                                  : 'border-gray-200 group-hover:border-gray-300'
                              }`}
                              style={{ backgroundColor: p.primary }}
                            />
                            <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                              {p.name.split(' ')[0]}
                            </span>
                            {palette.name === p.name && (
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Actuel :</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: palette.primary }}
                          />
                          <span className="text-xs font-medium text-gray-900">
                            {palette.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:block h-8 w-px bg-white/20" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
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
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
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
                          className={`block px-5 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                            notif.unread ? "bg-orange-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {notif.unread && (
                              <span className="w-2 h-2 bg-gardex-orange rounded-full mt-2 flex-shrink-0" />
                            )}
                            <div className="flex items-start gap-2 flex-1">
                              <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                                <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  <div className="px-5 py-3 bg-gray-50 text-center border-t border-gray-100">
                    <Link href="/dashboard/notifications" className="text-sm text-gardex-orange hover:underline font-semibold">
                      Voir toutes les notifications
                    </Link>
                  </div>
                </div>
              </>
            )}
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <button
                      onClick={() => {
                        toggleTheme();
                        setShowMobileServices(false);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      {isDark ? <Sun size={18} /> : <Moon size={18} />}
                      <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileServices(false);
                        setShowThemeMenu(true);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      <Palette size={18} />
                      <span>Palette de couleurs</span>
                    </button>
                  </div>
                  
                  {quickServices.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowMobileServices(false)}
                    >
                      <span className={`w-3 h-3 rounded-full ${service.dotColor}`} />
                      {service.name}
                    </div>
                  ))}
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
                <p className="text-sm font-semibold text-white truncate max-w-[140px]">{user.name}</p>
                <p className="text-xs text-white/70 truncate max-w-[140px]">{user.email}</p>
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
                      onClick={() => signOut({ callbackUrl: "/auth/login" })}
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