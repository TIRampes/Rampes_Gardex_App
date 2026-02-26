"use client";

import { useState } from "react";
import { X, Save, CheckCircle2, Calendar, Clock, Users, Ruler } from "lucide-react";
import type { CommandePlanification, Equipe } from "@/app/types/planification";

interface EditInstallationModalProps {
  commande: CommandePlanification;
  equipes: Equipe[];
  onSave: (commandeId: string, data: Record<string, unknown>) => Promise<boolean>;
  onTerminer: (commandeId: string, planifId?: string) => Promise<boolean>;
  onClose: () => void;
}

export default function EditInstallationModal({
  commande,
  equipes,
  onSave,
  onTerminer,
  onClose,
}: EditInstallationModalProps) {
  const [form, setForm] = useState({
    datePrevue: commande.datePrevue?.split("T")[0] ?? "",
    equipeId: commande.equipeId ?? "",
    tempsEstimeInstallation: commande.tempsEstimeInstallation ?? 0,
    heureDebut: commande.heureDebut ?? "07:00",
    heureFin: commande.heureFin ?? "",
    notes: commande.commentaire ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(commande.id, {
      datePrevue: form.datePrevue || null,
      equipeId: form.equipeId || null,
      tempsEstimeInstallation: form.tempsEstimeInstallation,
    });
    setSaving(false);
    if (ok) onClose();
  };

  const handleTerminer = async () => {
    if (!confirm("Marquer cette installation comme terminée?")) return;
    setSaving(true);
    const ok = await onTerminer(commande.id, commande.planificationId ?? undefined);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-[0.75rem]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[30rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-[0.75rem] sm:p-[1rem] border-b border-slate-200">
          <div>
            <h2 className="text-[1rem] sm:text-[1.125rem] font-bold text-slate-800">
              Modifier {commande.numero}
            </h2>
            <p className="text-[0.8125rem] text-slate-500">{commande.clientNom}</p>
          </div>
          <button
            onClick={onClose}
            className="p-[0.375rem] hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-[1.125rem] h-[1.125rem] text-slate-400" />
          </button>
        </div>

        {/* Info résumé */}
        <div className="mx-[1rem] mt-[1rem] p-[0.625rem] bg-slate-50 rounded-xl flex flex-wrap gap-[0.75rem] text-[0.8125rem]">
          <span className="flex items-center gap-[0.25rem] text-blue-600">
            <Ruler className="w-[0.75rem] h-[0.75rem]" />
            {commande.piedsLineairesRampes} pi.lin.
          </span>
          <span className="flex items-center gap-[0.25rem] text-slate-600">
            {commande.nombrePoteaux} poteaux
          </span>
          {commande.couleur && (
            <span className="flex items-center gap-[0.25rem] text-slate-600">
              Couleur: {commande.couleur}
            </span>
          )}
        </div>

        <div className="p-[1rem] space-y-[0.875rem]">
          {/* Date */}
          <div>
            <label className="flex items-center gap-[0.25rem] text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem]">
              <Calendar className="w-[0.875rem] h-[0.875rem]" /> Date prévue
            </label>
            <input
              type="date"
              value={form.datePrevue}
              onChange={(e) => setForm({ ...form, datePrevue: e.target.value })}
              className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
            />
          </div>

          {/* Équipe */}
          <div>
            <label className="flex items-center gap-[0.25rem] text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem]">
              <Users className="w-[0.875rem] h-[0.875rem]" /> Équipe
            </label>
            <select
              value={form.equipeId}
              onChange={(e) => setForm({ ...form, equipeId: e.target.value })}
              className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl bg-white text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
            >
              <option value="">Sélectionner</option>
              {equipes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Heures */}
          <div className="grid grid-cols-2 gap-[0.75rem]">
            <div>
              <label className="flex items-center gap-[0.25rem] text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem]">
                <Clock className="w-[0.875rem] h-[0.875rem]" /> Heure début
              </label>
              <input
                type="time"
                value={form.heureDebut}
                onChange={(e) => setForm({ ...form, heureDebut: e.target.value })}
                className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
              />
            </div>
            <div>
              <label className="text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem] block">
                Heure fin
              </label>
              <input
                type="time"
                value={form.heureFin}
                onChange={(e) => setForm({ ...form, heureFin: e.target.value })}
                className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
              />
            </div>
          </div>

          {/* Temps estimé */}
          <div>
            <label className="text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem] block">
              Temps estimé (heures)
            </label>
            <input
              type="number"
              value={form.tempsEstimeInstallation}
              onChange={(e) =>
                setForm({ ...form, tempsEstimeInstallation: parseInt(e.target.value) || 0 })
              }
              min={0}
              max={500}
              className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-[1rem] border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-[0.75rem] py-[0.5rem] text-slate-600 hover:bg-slate-100 rounded-lg text-[0.875rem] transition-colors"
          >
            Annuler
          </button>
          <div className="flex gap-[0.5rem]">
            <button
              onClick={handleTerminer}
              disabled={saving}
              className="flex items-center gap-[0.25rem] px-[0.75rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg text-[0.875rem] font-medium transition-colors"
            >
              <CheckCircle2 className="w-[0.875rem] h-[0.875rem]" /> Terminer
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-[0.25rem] px-[0.875rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-lg text-[0.875rem] font-medium transition-colors"
            >
              <Save className="w-[0.875rem] h-[0.875rem]" /> {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}