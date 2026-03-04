// components/attentes/ConfirmEnvoiModal.tsx
'use client';

import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Icon } from '@/app/components/icons/Icon';
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
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Mail" size={32} className="text-emerald-600" />
        </div>
        <p className="text-lg font-semibold text-slate-800 mb-2">Envoyer les attentes ?</p>
        <p className="text-slate-600 mb-4">
          Vous allez envoyer un email récapitulatif à <strong>{representants.length}</strong> représentant(s) pour{' '}
          <strong>{commandesCount}</strong> commande(s) en attente.
        </p>
        <ul className="bg-slate-50 rounded-lg p-4 mb-6 text-left text-sm">
          {representants.map((rep) => (
            <li key={rep.id} className="flex justify-between items-center py-1">
              <span>
                <strong>{rep.nom}</strong> ({rep.email})
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="default" onClick={onConfirm} className="bg-teal-500 hover:bg-teal-600">
            <Icon name="Check" size={18} className="mr-2" />
            Confirmer l'envoi
          </Button>
        </div>
      </div>
    </Modal>
  );
}