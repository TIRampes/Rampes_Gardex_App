'use client';

import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
// On utilise lucide-react directement pour éviter les erreurs de typage du composant Icon
import { Mail, Check, X } from 'lucide-react';
import { Representant } from '@prisma/client';

interface ConfirmEnvoiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  representants: Representant[];
  commandesCount: number;
}

export default function ConfirmEnvoiModal({
  isOpen,
  onClose,
  onConfirm,
  representants,
  commandesCount,
}: ConfirmEnvoiModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmer l'envoi" size="md">
      <div className="text-center">
        {/* Icône Mail de lucide-react */}
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={32} className="text-emerald-600" />
        </div>
        
        <p className="text-lg font-semibold text-slate-800 mb-2">Envoyer les attentes ?</p>
        <p className="text-slate-600 mb-4">
          Vous allez envoyer un email récapitulatif à <strong>{representants.length}</strong> représentant(s) pour{' '}
          <strong>{commandesCount}</strong> commande(s) en attente.
        </p>

        <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-xl p-4 mb-6 text-left text-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Destinataires :</p>
          <ul className="space-y-2">
            {representants.map((rep) => (
              <li key={rep.id} className="flex flex-col border-b border-slate-200 last:border-0 pb-1">
                <span className="font-bold text-slate-700">{rep.nom}</span>
                <span className="text-xs text-slate-500">{rep.email}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl px-6"
          >
            <X size={18} className="mr-2" />
            Annuler
          </Button>
          <Button 
            variant="default" 
            onClick={onConfirm} 
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 shadow-lg shadow-teal-100"
          >
            <Check size={18} className="mr-2" />
            Confirmer l'envoi
          </Button>
        </div>
      </div>
    </Modal>
  );
}