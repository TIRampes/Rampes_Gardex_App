import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateCourte(date: Date | string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-CA');
}

export function getStatutCouleur(valeur: string | null): string {
  if (!valeur) return 'text-slate-400';
  switch (valeur) {
    case 'COMPLETE':
      return 'text-slate-800';
    case 'ATTENTE_CLIENT':
      return 'bg-sky-200 text-sky-800 px-2 py-1 rounded';
    case 'ATTENTE_REPRESENTANT':
      return 'bg-amber-200 text-amber-800 px-2 py-1 rounded';
    default:
      return 'text-slate-400';
  }
}

export function getServiceCouleur(service: string): string {
  switch (service) {
    case 'INSTALLATION':
      return 'bg-red-500 text-white';
    case 'LIVRAISON':
      return 'bg-blue-500 text-white';
    case 'CUEILLETTE':
      return 'bg-yellow-500 text-yellow-900';
    default:
      return 'bg-slate-500 text-white';
  }
}