// types/attentes.ts
import { CodeProduction, Representant, Commande } from '@prisma/client';

export interface CommandeAttente extends Commande {
  representant: Representant | null;
}

export interface DetailCommande extends Commande {
  representant: Representant | null;
  client: {
    nom: string;
    telephone?: string;
    email?: string;
  };
}

export interface EnvoiEmailPayload {
  representantIds?: string[]; // si vide, envoie à tous les représentants concernés
}

export interface EnvoiEmailResponse {
  success: boolean;
  message: string;
  count?: number;
}