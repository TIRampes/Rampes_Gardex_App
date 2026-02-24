import { redirect } from "next/navigation";

// Redirige vers la page principale avec l'onglet calendrier actif
// Le calendrier est l'onglet par défaut de /production
export default function CalendrierPage() {
  redirect("/production");
}