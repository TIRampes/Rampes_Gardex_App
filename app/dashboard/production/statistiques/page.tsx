import { redirect } from "next/navigation";

// Les statistiques sont intégrées dans l'onglet "Statistiques" 
// de la page principale de production
export default function StatistiquesPage() {
  redirect("/production");
}