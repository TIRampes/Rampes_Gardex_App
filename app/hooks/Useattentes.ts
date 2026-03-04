// hooks/useAttentes.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Commande, Representant } from '@prisma/client';

interface CommandeWithRelations extends Commande {
  representant: Representant | null;
  client: { nom: string; telephone?: string; email?: string };
}

export function useAttentes() {
  const queryClient = useQueryClient();

  // Récupérer la liste des attentes avec filtres
  const useListeAttentes = (selectedRepresentants: string[] = []) => {
    const params = new URLSearchParams();
    selectedRepresentants.forEach(r => params.append('representant', r));

    return useQuery<CommandeWithRelations[]>({
      queryKey: ['attentes', selectedRepresentants],
      queryFn: async () => {
        const res = await fetch(`/api/attentes?${params}`);
        if (!res.ok) throw new Error('Erreur chargement');
        return res.json();
      },
    });
  };

  // Récupérer la liste des représentants
  const useRepresentants = () => {
    return useQuery<Representant[]>({
      queryKey: ['representants'],
      queryFn: async () => {
        const res = await fetch('/api/attentes/representants');
        if (!res.ok) throw new Error('Erreur chargement');
        return res.json();
      },
    });
  };

  // Récupérer le détail d'une commande
  const useCommande = (id: string | null) => {
    return useQuery<CommandeWithRelations>({
      queryKey: ['commande', id],
      queryFn: async () => {
        if (!id) throw new Error('ID manquant');
        const res = await fetch(`/api/attentes/commandes/${id}`);
        if (!res.ok) throw new Error('Erreur chargement');
        return res.json();
      },
      enabled: !!id,
    });
  };

  // Mutation pour envoyer les emails
  const envoyerEmails = useMutation({
    mutationFn: async (representantIds: string[]) => {
      const res = await fetch('/api/attentes/envoyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ representantIds }),
      });
      if (!res.ok) throw new Error('Erreur envoi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attentes'] });
      toast.success('Emails envoyés avec succès');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    useListeAttentes,
    useRepresentants,
    useCommande,
    envoyerEmails,
  };
}