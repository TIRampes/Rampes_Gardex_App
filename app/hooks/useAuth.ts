// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: hooks/useAuth.ts                                ║
// ║  NOUVEAU — copier dans hooks/                             ║
// ╚══════════════════════════════════════════════════════════╝

'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  getMenusPourRole, peutAcceder, aPermission, estAdmin, estGestionnaire,
} from '@/lib/auth-config';
import type { Role } from '@/lib/auth-config';

export function useAuth() {
  const { data: session, status } = useSession();

  const user = useMemo(() => {
    if (!session?.user) return null;
    const u = session.user as any;
    return {
      id: u.id as string,
      name: u.name as string,
      email: u.email as string,
      role: (u.role || 'EMPLOYE') as Role,
      equipeId: u.equipeId as string | null,
      equipeNom: u.equipeNom as string | null,
    };
  }, [session]);

  const role = user?.role || 'EMPLOYE';
  const menus = useMemo(() => getMenusPourRole(role), [role]);

  return {
    user,
    role,
    loading: status === 'loading',
    authenticated: status === 'authenticated',

    // Menus filtrés — seulement ceux autorisés pour ce rôle
    menus,

    // Checks rapides
    isAdmin: estAdmin(role),
    isGestionnaire: estGestionnaire(role),

    // Vérifie l'accès à un menu par son id
    canAccess: (menuId: string) => peutAcceder(role, menuId),

    // Vérifie une permission spéciale (ex: 'modifier_cout_horaire')
    hasPermission: (permission: string) => aPermission(role, permission),
  };
}