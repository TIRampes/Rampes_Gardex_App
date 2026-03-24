// ============================================================
// app/multilogements/page.tsx — Page serveur Multi-logements
// ============================================================
import { Metadata } from "next";
import MultiLogementsClient from "@//app/components/multilogements/MultiLogementsClient";

export const metadata: Metadata = {
  title: "Multi-logements | Rampes Gardex",
  description:
    "Suivi des commandes commerciales, multi-phases et multi-plans",
};

export default function MultiLogementsPage() {
  return <MultiLogementsClient />;
}