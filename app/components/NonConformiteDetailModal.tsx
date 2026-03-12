'use client';

import { Edit, Trash2, X } from 'lucide-react';

export default function NonConformiteDetailModal({ isOpen, onClose, nc, onEdit, onDelete }) {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-800 text-white">
          <h2 className="text-xl font-bold">Détail de la non-conformité</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase"># Projet</p>
              <p className="text-lg font-semibold text-slate-800">{nc.noProjet || '-'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase">Date de détection</p>
              <p className="text-lg font-semibold text-slate-800">{formatDate(nc.dateDetection)}</p>
            </div>
          </div>

          {/* Département / Responsable / Type */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-xs text-amber-600 uppercase">Département</p>
              <p className="text-base font-semibold">{nc.departement?.nom || nc.departementTexte || '-'}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 uppercase">Responsable</p>
              <p className="text-base font-semibold">{nc.responsable?.nom || nc.responsableTexte || '-'}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-purple-600 uppercase">Type</p>
              <p className="text-base font-semibold">{nc.type?.nom || '-'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase mb-2">Description</p>
            <p className="text-slate-700 whitespace-pre-wrap">{nc.description}</p>
          </div>

          {/* Actions et suivi */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Suivi</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${nc.envoiMail ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                <span>Envoi mail: {nc.envoiMail ? 'Oui' : 'Non'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${nc.confirmation ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                <span>Confirmation: {nc.confirmation ? 'Oui' : 'Non'}</span>
              </div>
            </div>

            {(nc.mesureCorrective || nc.correction || nc.dateCorrection) && (
              <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
                {nc.mesureCorrective && (
                  <div>
                    <p className="text-xs text-slate-500">Mesure corrective</p>
                    <p className="text-sm">{nc.mesureCorrective}</p>
                  </div>
                )}
                {nc.correction && (
                  <div>
                    <p className="text-xs text-slate-500">Correction apportée</p>
                    <p className="text-sm">{nc.correction}</p>
                  </div>
                )}
                {nc.dateCorrection && (
                  <div>
                    <p className="text-xs text-slate-500">Date de correction</p>
                    <p className="text-sm">{formatDate(nc.dateCorrection)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <Edit size={16} /> Modifier
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2"
          >
            <Trash2 size={16} /> Supprimer
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}