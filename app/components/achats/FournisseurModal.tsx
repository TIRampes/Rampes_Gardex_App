// app/dashboard/achats/components/FournisseurModal.tsx
'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { TYPE_ACHAT_ENUM } from '@/app/api/achats/schema';
import type { FournisseurView } from '@/app/hooks/useAchats';

export interface FournisseurModalData {
  id?: string;
  nom?: string;
  contact?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  notes?: string | null;
  typeAchat?: string | null;
  formulaireNom?: string | null;
  formulaireMime?: string | null;
  formulaireFile?: File | null;
  supprimerFormulaire?: boolean;
}

interface FournisseurModalProps {
  isOpen: boolean;
  fournisseur: FournisseurModalData | null;
  onClose: () => void;
  onSave: (data: FournisseurModalData) => Promise<void>;
}

const FournisseurModal = memo(function FournisseurModal({ isOpen, fournisseur, onClose, onSave }: FournisseurModalProps) {
  const [localData, setLocalData] = useState<FournisseurModalData | null>(fournisseur);

  useEffect(() => {
    setLocalData(fournisseur);
  }, [fournisseur]);

  const handleChange = useCallback((key: keyof FournisseurModalData, value: any) => {
    setLocalData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!localData) return;
    await onSave(localData);
  }, [localData, onSave]);

  if (!isOpen || !localData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[40rem] max-h-[90vh] overflow-y-auto">
        <div className="p-[1.25rem] bg-slate-800 text-white rounded-t-2xl">
          <h2 className="text-[1.125rem] font-bold">
            {localData.id ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
          </h2>
        </div>
        <div className="p-[1.5rem] grid grid-cols-2 gap-[1rem]">
          <div className="col-span-2">
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Nom *</label>
            <input
              type="text"
              value={localData.nom || ''}
              onChange={(e) => handleChange('nom', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Adresse</label>
            <input
              type="text"
              value={localData.adresse || ''}
              onChange={(e) => handleChange('adresse', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div>
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Téléphone</label>
            <input
              type="tel"
              value={localData.telephone || ''}
              onChange={(e) => handleChange('telephone', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div>
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Contact</label>
            <input
              type="text"
              value={localData.contact || ''}
              onChange={(e) => handleChange('contact', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div>
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Email</label>
            <input
              type="email"
              value={localData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div>
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Notes</label>
            <input
              type="text"
              value={localData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Type d'achat</label>
            <select
              value={localData.typeAchat || ''}
              onChange={(e) => handleChange('typeAchat', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            >
              <option value="">-- Sélectionner --</option>
              {TYPE_ACHAT_ENUM.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Formulaire de commande (PDF, Word, Excel)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => handleChange('formulaireFile', e.target.files?.[0] || null)}
              className="w-full text-[0.8125rem]"
            />
            {localData.formulaireNom && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-slate-600">Fichier actuel :</span>
                <a
                  href={`/api/achats/fournisseurs/${localData.id}/formulaire`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {localData.formulaireNom}
                </a>
                <button
                  type="button"
                  onClick={() => handleChange('supprimerFormulaire', true)}
                  className="text-red-500 text-xs"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-[1rem] border-t flex justify-end gap-[0.75rem]">
          <button onClick={onClose} className="px-[1.5rem] py-[0.5rem] border rounded-lg hover:bg-slate-50 text-[0.875rem]">
            Annuler
          </button>
          <button onClick={handleSave} className="px-[1.5rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem]">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
});

export default FournisseurModal;