"use client";

import { FileText, Wrench, Calendar, AlertTriangle } from "lucide-react";

// Données simulées
const stats = [
  {
    title: "Commandes actives",
    value: 3,
    icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />,
    link: "/commandes",
    linkText: "Cliquez pour voir →",
    linkColor: "text-blue-500",
  },
  {
    title: "Installations aujourd'hui",
    value: 3,
    icon: <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-gardex-orange" />,
    link: "/planification",
    linkText: "Voir le calendrier →",
    linkColor: "text-gardex-orange",
  },
  {
    title: "Production en cours",
    value: 2,
    icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />,
    link: "/production",
    linkText: "Gérer la production →",
    linkColor: "text-green-500",
  },
  {
    title: "Alertes matériel",
    value: 1,
    icon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />,
    link: "/inventaire",
    linkText: "Vérifier l'inventaire →",
    linkColor: "text-red-500",
  },
];

const prochainesInstallations = [
  {
    id: 1,
    client: "Construction Leblanc",
    numero: "CMD-2024-001",
    type: "Installation",
    date: "2026-01-28",
    equipe: "Équipe A",
    bgColor: "bg-red-500",
  },
  {
    id: 2,
    client: "Rénovations ABC",
    numero: "CMD-2024-002",
    type: "Livraison",
    date: "2026-01-29",
    equipe: "Équipe B",
    bgColor: "bg-green-500",
  },
  {
    id: 3,
    client: "Gestion Immobilière XYZ",
    numero: "CMD-2024-003",
    type: "Transport",
    date: "2026-01-30",
    equipe: "Non assigné",
    bgColor: "bg-blue-500",
  },
];

const alertesInventaire = [
  {
    id: 1,
    produit: 'Poteaux 2"x2"',
    fournisseur: "Alu-Québec",
    quantite: 45,
    seuil: 100,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header de page */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Vue d&apos;ensemble de vos opérations</p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <a
            key={index}
            href={stat.link}
            className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg flex-shrink-0 ml-2">{stat.icon}</div>
            </div>
            <p className={`text-xs sm:text-sm mt-3 sm:mt-4 ${stat.linkColor} truncate`}>{stat.linkText}</p>
          </a>
        ))}
      </div>

      {/* Section principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Prochaines installations */}
        <div className="lg:col-span-2">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Prochaines installations
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {prochainesInstallations.map((installation) => (
              <div
                key={installation.id}
                className={`${installation.bgColor} rounded-lg p-3 sm:p-4 text-white cursor-pointer hover:opacity-90 transition-opacity`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">{installation.client}</p>
                    <p className="text-xs sm:text-sm opacity-90">{installation.numero}</p>
                    <span className="inline-block mt-1.5 sm:mt-2 text-xs bg-white/20 px-2 py-0.5 rounded">
                      {installation.type}
                    </span>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="font-medium text-sm sm:text-base">{installation.date}</p>
                    <p className="text-xs sm:text-sm opacity-90">{installation.equipe}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes inventaire */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Alertes inventaire</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            {alertesInventaire.map((alerte) => (
              <div key={alerte.id} className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{alerte.produit}</p>
                    <p className="text-xs sm:text-sm text-gray-500">Fournisseur: {alerte.fournisseur}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg sm:text-xl font-bold text-blue-600">{alerte.quantite}</p>
                    <p className="text-xs text-gray-500">Seuil: {alerte.seuil}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}