// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: lib/auth-config.ts                              ║
// ║  NOUVEAU — copier dans lib/ (à côté de auth.ts)           ║
// ╚══════════════════════════════════════════════════════════╝

export type Role =
  | 'ADMIN' | 'GESTIONNAIRE' | 'EMPLOYE' | 'CHAUFFEUR'
  | 'INSTALLATEUR' | 'MESUREUR' | 'CLIENT' | 'REPRESENTANT' | 'PRODUCTEUR';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export const TOUS_LES_MENUS: MenuItem[] = [
  { id: 'dashboard',       label: 'Tableau de bord',       href: '/dashboard/dashboard', icon: 'home' },
  { id: 'clients',         label: 'Clients',               href: '/dashboard/clients',   icon: 'users' },
  { id: 'commandes',       label: 'Commandes',             href: '/dashboard/commandes', icon: 'file' },
  { id: 'production',      label: 'Production',            href: '/dashboard/production', icon: 'factory' },
  { id: 'planification',   label: 'Planification',         href: '/dashboard/planification', icon: 'calendar' },
  { id: 'interventions',   label: 'Interventions',         href: '/dashboard/interventions', icon: 'wrench' },
  { id: 'cueillettes',     label: 'Cueillettes/Transport', href: '/dashboard/cueillettes', icon: 'truck' },
  { id: 'inventaire',      label: 'Inventaire',            href: '/dashboard/inventaire', icon: 'package' },
  { id: 'achats',          label: 'Achats',                href: '/dashboard/achats',    icon: 'cart' },
  { id: 'rentabilite',     label: 'Rentabilité',           href: '/dashboard/rentabilite', icon: 'trend' },
  { id: 'attentes',        label: 'Attentes',              href: '/dashboard/attentes',  icon: 'alert' },
  { id: 'nonconformites',  label: 'Non-conformités',       href: '/dashboard/nonconformites', icon: 'alert-triangle' },
  { id: 'multilogements',  label: 'Multi-logements',       href: '/dashboard/multilogements', icon: 'building' },
  { id: 'reprises',        label: 'Reprises',              href: '/dashboard/reprises',  icon: 'refresh' },
  { id: 'rapports',        label: 'Rapports',              href: '/dashboard/rapports',  icon: 'chart' },
  { id: 'parametres',      label: 'Paramètres',            href: '/dashboard/parametres', icon: 'settings' },
];

// ═══════════════════════════════════════════
// QUI VOIT QUOI
// ═══════════════════════════════════════════
const ACCESS: Record<Role, string[]> = {
  // Accès total
  ADMIN:        ['*'],
  GESTIONNAIRE: ['*'],

  // Accès limité
  EMPLOYE:      ['dashboard', 'clients'],
  INSTALLATEUR: ['dashboard', 'clients', 'interventions'],
  MESUREUR:     ['dashboard', 'clients', 'interventions'],
  CHAUFFEUR:    ['dashboard', 'clients', 'interventions', 'cueillettes'],
  PRODUCTEUR:   ['dashboard', 'clients', 'production', 'inventaire'],

  // Représentant — tout SAUF non-conformités et paramètres
  REPRESENTANT: [
    'dashboard', 'clients', 'commandes', 'production', 'planification',
    'interventions', 'cueillettes', 'inventaire', 'achats',
    'attentes', 'multilogements', 'reprises', 'rapports',
  ],

  // Client — juste le dashboard
  CLIENT: ['dashboard'],
};

// ═══════════════════════════════════════════
// PERMISSIONS SPÉCIALES
// ═══════════════════════════════════════════
const PERMISSIONS: Record<string, Role[]> = {
  'modifier_cout_horaire': ['ADMIN'],
  'supprimer_commande':    ['ADMIN', 'GESTIONNAIRE'],
  'gerer_parametres':      ['ADMIN', 'GESTIONNAIRE'],
  'gerer_utilisateurs':    ['ADMIN'],
};

// ═══════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════
export function getMenusPourRole(role: Role | string): MenuItem[] {
  const a = ACCESS[(role || 'EMPLOYE') as Role] || ACCESS.EMPLOYE;
  if (a.includes('*')) return TOUS_LES_MENUS;
  return TOUS_LES_MENUS.filter((m) => a.includes(m.id));
}

export function peutAcceder(role: Role | string, menuId: string): boolean {
  const a = ACCESS[(role || 'EMPLOYE') as Role] || ACCESS.EMPLOYE;
  return a.includes('*') || a.includes(menuId);
}

export function aPermission(role: Role | string, permission: string): boolean {
  const roles = PERMISSIONS[permission];
  return roles ? roles.includes((role || 'EMPLOYE') as Role) : false;
}

export function estAdmin(role: Role | string): boolean {
  return role === 'ADMIN';
}

export function estGestionnaire(role: Role | string): boolean {
  return role === 'ADMIN' || role === 'GESTIONNAIRE';
}

/** Pour le proxy — vérifie si une route /dashboard/xxx est autorisée */
export function routeAutorisee(role: string, pathname: string): boolean {
  const a = ACCESS[(role || 'EMPLOYE') as Role] || ACCESS.EMPLOYE;
  if (a.includes('*')) return true;

  // Extraire le segment après /dashboard/
  // Ex: /dashboard/interventions → interventions
  const parts = pathname.replace(/^\/dashboard\/?/, '').split('/');
  const segment = parts[0] || 'dashboard';

  return a.includes(segment);
}