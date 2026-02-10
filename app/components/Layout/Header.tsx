"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { 
  Bell, Menu, Search, ChevronDown, User, Settings, LogOut,
  Sun, Moon, Palette, ChevronRight
} from "lucide-react";

const quickServices = [
  { name: "Livraison", color: "bg-blue-500", dotColor: "bg-blue-500" },
  { name: "Cueillette", color: "bg-yellow-500", dotColor: "bg-yellow-500" },
  { name: "Intervention", color: "bg-red-500", dotColor: "bg-red-500" },
  { name: "Transport", color: "bg-green-500", dotColor: "bg-green-500" },
];

// Palettes de couleurs disponibles
const colorPalettes = [
  { 
    name: "Orange Gardex", 
    primary: "#f97316", 
    gradient: "from-[#f97316] to-[#e6951f]",
    bgSidebar: "from-[#1a2332] to-[#0f1419]"
  },
  { 
    name: "Bleu Professionnel", 
    primary: "#3b82f6", 
    gradient: "from-[#3b82f6] to-[#1d4ed8]",
    bgSidebar: "from-[#1e293b] to-[#0f172a]"
  },
  { 
    name: "Vert Naturel", 
    primary: "#10b981", 
    gradient: "from-[#10b981] to-[#059669]",
    bgSidebar: "from-[#1a2c2a] to-[#0f1f1d]"
  },
  { 
    name: "Violet Créatif", 
    primary: "#8b5cf6", 
    gradient: "from-[#8b5cf6] to-[#7c3aed]",
    bgSidebar: "from-[#2a1b4d] to-[#1a1033]"
  },
  { 
    name: "Rouge Énergique", 
    primary: "#ef4444", 
    gradient: "from-[#ef4444] to-[#dc2626]",
    bgSidebar: "from-[#2c1a1a] to-[#1a0f0f]"
  },
];

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileServices, setShowMobileServices] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedPalette, setSelectedPalette] = useState(colorPalettes[0]);

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

  // Gérer le thème dark/light
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sauvegarder les préférences
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode');
    const savedPalette = localStorage.getItem('theme-palette');
    
    if (savedTheme) setDarkMode(savedTheme === 'dark');
    if (savedPalette) setSelectedPalette(JSON.parse(savedPalette));
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
  };

  const handlePaletteSelect = (palette: any) => {
    setSelectedPalette(palette);
    localStorage.setItem('theme-palette', JSON.stringify(palette));
    // Émettre un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('theme-change', { detail: palette }));
  };

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-gradient-to-b from-[#1a2332] to-[#0f1419] border-b border-gray-200 z-30 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 text-gray-900">
        {/* Gauche */}
        <div className="flex items-center gap-3">
          {/* Menu hamburger mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
          >
            <Menu size={24} />
          </button>

          {/* Services rapides - Desktop */}
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

        {/* Droite */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Contrôles de thème */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Bouton Dark/Light Mode */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white relative group"
              title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs bg-black/80 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {darkMode ? "Mode clair" : "Mode sombre"}
              </div>
            </button>

            {/* Bouton Palette de couleurs */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white relative group"
                title="Changer la palette de couleurs"
              >
                <Palette size={20} />
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs bg-black/80 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Palette
                </div>
              </button>

              {/* Menu déroulant des palettes */}
              {showThemeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Personnalisation</h3>
                      <p className="text-xs text-gray-500">Choisissez votre thème</p>
                    </div>
                    
                    {/* Mode Dark/Light */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Thème</span>
                        <button
                          onClick={toggleDarkMode}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          {darkMode ? (
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
                            className={`h-full transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-yellow-400'}`}
                            style={{ width: darkMode ? '100%' : '0%' }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{darkMode ? "Sombre" : "Clair"}</span>
                      </div>
                    </div>

                    {/* Palettes de couleurs */}
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Palette de couleurs</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {colorPalettes.map((palette) => (
                          <button
                            key={palette.name}
                            onClick={() => handlePaletteSelect(palette)}
                            className="flex flex-col items-center group"
                            title={palette.name}
                          >
                            <div 
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                selectedPalette.name === palette.name 
                                  ? 'border-blue-500 scale-110' 
                                  : 'border-gray-200 group-hover:border-gray-300'
                              }`}
                              style={{ backgroundColor: palette.primary }}
                            />
                            <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                              {palette.name.split(' ')[0]}
                            </span>
                            {selectedPalette.name === palette.name && (
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prévisualisation */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Prévisualisation :</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: selectedPalette.primary }}
                          />
                          <span className="text-xs font-medium text-gray-900">
                            {selectedPalette.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Séparateur */}
          <div className="hidden lg:block h-8 w-px bg-white/20" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl hover:bg-white/10 transition-colors text-white"
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
                  {/* Boutons thème pour mobile */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <button
                      onClick={toggleDarkMode}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                      <span>{darkMode ? "Mode clair" : "Mode sombre"}</span>
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

          {/* Séparateur */}
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