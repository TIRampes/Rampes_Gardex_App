"use client";

import { AlertTriangle, X, Trash2, Loader2, Package } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmModalProps {
  clientName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  error?: string | null;
  hasCommandes?: boolean;
  commandesCount?: number;
  commandesList?: { id: string; numero: string; statut: string }[];
}

export default function DeleteConfirmModal({ 
  clientName, 
  onClose, 
  onConfirm,
  error,
  hasCommandes = false,
  commandesCount = 0,
  commandesList = []
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [showCommandes, setShowCommandes] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  // Si le client a des commandes, on affiche un message d'erreur spécifique
  if (hasCommandes) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Suppression impossible
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 mb-4">
              <Package className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <p className="text-red-700 dark:text-red-400 font-medium mb-1">
                  Ce client ne peut pas être supprimé
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {error || `Le client "${clientName}" est lié à ${commandesCount} commande(s).`}
                </p>
              </div>
            </div>

            {/* Liste des commandes (si disponibles) */}
            {commandesList.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowCommandes(!showCommandes)}
                  className="text-sm text-[var(--color-primary)] hover:underline mb-2"
                >
                  {showCommandes ? "Masquer" : "Voir"} les commandes concernées
                </button>
                
                {showCommandes && (
                  <div className="space-y-2 max-h-48 overflow-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {commandesList.map((cmd) => (
                      <div key={cmd.id} className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <span className="font-medium text-gray-900 dark:text-white">{cmd.numero}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          cmd.statut === "ACTIVE" ? "bg-green-100 text-green-700" :
                          cmd.statut === "EN_ATTENTE" ? "bg-yellow-100 text-yellow-700" :
                          cmd.statut === "COMPLETEE" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {cmd.statut === "ACTIVE" ? "Active" :
                           cmd.statut === "EN_ATTENTE" ? "En attente" :
                           cmd.statut === "COMPLETEE" ? "Complétée" :
                           cmd.statut}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Pour supprimer ce client, vous devez d'abord supprimer ou réassigner ses commandes.
            </p>
          </div>

          {/* Actions */}
          <div className="flex px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal normal pour la confirmation de suppression
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Confirmer la suppression
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Êtes-vous sûr de vouloir supprimer le client :
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            &quot;{clientName}&quot; ?
          </p>
          
          {/* Message d'erreur personnalisé */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              ⚠️ Cette action est irréversible. Toutes les données associées à ce client seront perdues.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}