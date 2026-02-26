"use client";

import { useState } from "react";
import { X, Plus, Trash2, Users } from "lucide-react";
import { COULEURS_EQUIPES } from "@/app/api/planification/schema";
import type { Equipe } from "@/app/types/planification";

interface EquipesModalProps {
  equipes: Equipe[];
  onAjouter: (nom: string, couleur: string) => Promise<boolean>;
  onSupprimer: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export default function EquipesModal({
  equipes,
  onAjouter,
  onSupprimer,
  onClose,
}: EquipesModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [couleur, setCouleur] = useState<(typeof COULEURS_EQUIPES)[number]>(
  COULEURS_EQUIPES[0]
);
  const [submitting, setSubmitting] = useState(false);

  const handleAjouter = async () => {
    if (!nom.trim()) return;
    setSubmitting(true);
    const ok = await onAjouter(nom.trim(), couleur);
    setSubmitting(false);
    if (ok) {
      setNom("");
      setCouleur(COULEURS_EQUIPES[0]);
      setShowForm(false);
    }
  };

  const handleSupprimer = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette équipe?")) return;
    await onSupprimer(id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.75rem]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[48rem] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[0.75rem] sm:p-[1rem] border-b bg-slate-800 text-white">
          <h2 className="text-[1rem] sm:text-[1.25rem] font-bold flex items-center gap-[0.5rem]">
            <Users className="w-[1.25rem] h-[1.25rem]" /> Gestion des équipes
          </h2>
          <button onClick={onClose} className="p-[0.375rem] hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-[1.25rem] h-[1.25rem]" />
          </button>
        </div>

        {/* Liste des équipes */}
        <div className="flex-1 overflow-auto p-[0.75rem] sm:p-[1rem] space-y-[0.75rem]">
          {equipes.map((equipe) => (
            <div key={equipe.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className={`p-[0.75rem] sm:p-[1rem] ${equipe.couleur} text-white flex items-center justify-between`}>
                <div>
                  <h3 className="font-bold text-[1rem] sm:text-[1.125rem]">{equipe.nom}</h3>
                  <p className="text-[0.8125rem] opacity-90">
                    {equipe.nbInstallations ?? 0} installation(s) · {equipe.heuresPlanifiees ?? 0}h planifiées
                  </p>
                </div>
                <button
                  onClick={() => handleSupprimer(equipe.id)}
                  className="p-[0.375rem] hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-[1rem] h-[1rem]" />
                </button>
              </div>
              {equipe.membres && equipe.membres.length > 0 && (
                <div className="p-[0.625rem] bg-slate-50 flex flex-wrap gap-[0.375rem]">
                  {equipe.membres.map((m) => (
                    <span key={m.id} className="px-[0.5rem] py-[0.25rem] bg-white border text-slate-700 text-[0.8125rem] rounded">
                      {m.prenom} {m.nom}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Formulaire nouvelle équipe */}
          {showForm && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-[0.75rem] sm:p-[1rem]">
              <h4 className="font-bold text-[0.9375rem] mb-[0.625rem]">Nouvelle équipe</h4>
              <div className="space-y-[0.625rem]">
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.875rem] focus:ring-2 focus:ring-amber-300 outline-none"
                  placeholder="Nom de l'équipe"
                  autoFocus
                />
                <div className="flex flex-wrap gap-[0.375rem]">
                  {COULEURS_EQUIPES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCouleur(c)}
                      className={`w-[2rem] h-[2rem] rounded-full ${c} transition-all ${
                        couleur === c ? "ring-2 ring-offset-2 ring-slate-800 scale-110" : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-[0.5rem]">
                  <button
                    onClick={() => { setShowForm(false); setNom(""); }}
                    className="px-[0.75rem] py-[0.5rem] text-slate-600 hover:bg-slate-100 rounded-lg text-[0.875rem] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAjouter}
                    disabled={!nom.trim() || submitting}
                    className="px-[0.75rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg text-[0.875rem] font-medium transition-colors"
                  >
                    {submitting ? "Ajout..." : "Ajouter"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-[0.75rem] sm:p-[1rem] border-t border-slate-200 bg-slate-50 flex justify-between">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-[0.375rem] px-[0.75rem] py-[0.5rem] bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[0.875rem] font-medium transition-colors"
          >
            <Plus className="w-[1rem] h-[1rem]" /> Nouvelle équipe
          </button>
          <button onClick={onClose} className="px-[1.25rem] py-[0.625rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-[0.875rem] transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}