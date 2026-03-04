  //import { clsx, type ClassValue } from "clsx";
//import { twMerge } from "tailwind-merge";

//export function cn(...inputs: ClassValue[]) {
  //return twMerge(clsx(inputs));

  
//}
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}