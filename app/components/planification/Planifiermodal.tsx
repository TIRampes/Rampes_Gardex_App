"use client";

import { useState } from "react";
import { X, AlertTriangle, Clock, Users } from "lucide-react";
import { calculerJoursNecessaires } from "@/app/services/planification.service";
import type { CommandePlanification, Equipe, PlanificationFormData } from "@/app/types/planification";

interface PlanifierModalProps {
  commande: CommandePlanification;
  equipes: Equipe[];
  onPlanifier: (data: PlanificationFormData) => Promise<boolean>;
  onClose: () => void;
}

export default function PlanifierModal({
  commande,
  equipes,
  onPlanifier,
  onClose,
}: PlanifierModalProps) {
  const [form, setForm] = useState({
    datePlanifiee: "",
    equipeId: "",
    heureDebut: "07:00",
    heureFin: "",
    clientPresent: false,
    representantPresent: false,
    envoyerAvis: false,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const tempsH = commande.tempsEstimeInstallation || 0;
  const joursNecessaires = calculerJoursNecessaires(tempsH);

  const handleSubmit = async () => {
    if (!form.datePlanifiee || !form.equipeId) return;
    setSubmitting(true);
    const ok = await onPlanifier({
      commandeId: commande.id,
      equipeId: form.equipeId,
      datePlanifiee: form.datePlanifiee,
      heureDebut: form.heureDebut || undefined,
      heureFin: form.heureFin || undefined,
      clientPresent: form.clientPresent,
      representantPresent: form.representantPresent,
      envoyerAvis: form.envoyerAvis,
      notes: form.notes || undefined,
    });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-[0.75rem]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[32rem]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-[1rem] border-b bg-gradient-to-r from-amber-400 to-yellow-500 rounded-t-2xl">
          <h2 className="text-[1.125rem] sm:text-[1.25rem] font-bold text-slate-900">Planifier l&apos;installation</h2>
          <p className="text-[0.8125rem] text-slate-700">{commande.numero} — {commande.clientNom}</p>
        </div>

        <div className="p-[1rem] sm:p-[1.5rem] space-y-[1rem]">
          {/* Info temps */}
          <div className="bg-blue-50 p-[0.75rem] sm:p-[1rem] rounded-xl">
            <div className="flex items-center gap-[0.375rem] text-[0.875rem] text-blue-700">
              <Clock className="w-[1rem] h-[1rem]" />
              Temps estimé: <strong>{tempsH}h</strong>
            </div>
            {joursNecessaires > 1 && (
              <div className="flex items-center gap-[0.375rem] mt-[0.375rem] text-[0.8125rem] text-amber-700">
                <AlertTriangle className="w-[0.875rem] h-[0.875rem]" />
                Cette installation nécessite <strong>{joursNecessaires} jours</strong> de travail
              </div>
            )}
            <div className="flex items-center gap-[0.75rem] mt-[0.5rem] text-[0.8125rem] text-blue-600">
              <span>Pieds lin.: <strong>{commande.piedsLineairesRampes}</strong></span>
              <span>Poteaux: <strong>{commande.nombrePoteaux}</strong></span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem]">Date de début</label>
            <input
              type="date"
              value={form.datePlanifiee}
              onChange={(e) => setForm({ ...form, datePlanifiee: e.target.value })}
              className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
            />
          </div>

          {/* Heures */}
          <div className="grid grid-cols-2 gap-[0.75rem]">
            <div>
              <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem]">Heure début</label>
              <input
                type="time"
                value={form.heureDebut}
                onChange={(e) => setForm({ ...form, heureDebut: e.target.value })}
                className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem]">Heure fin (opt.)</label>
              <input
                type="time"
                value={form.heureFin}
                onChange={(e) => setForm({ ...form, heureFin: e.target.value })}
                className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
              />
            </div>
          </div>

          {/* Équipe */}
          <div>
            <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem]">
              <Users className="inline w-[0.875rem] h-[0.875rem] mr-[0.25rem]" />Équipe
            </label>
            <select
              value={form.equipeId}
              onChange={(e) => setForm({ ...form, equipeId: e.target.value })}
              className="w-full px-[0.75rem] py-[0.625rem] border border-slate-200 rounded-xl bg-white text-[0.875rem] focus:ring-2 focus:ring-blue-300 outline-none"
            >
              <option value="">Choisir une équipe</option>
              {equipes.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.nom} ({eq.nbInstallations ?? 0} install.)</option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div className="space-y-[0.625rem]">
            {[
              { key: "clientPresent", label: "Le client veut être présent" },
              { key: "representantPresent", label: "Le représentant veut être présent" },
              { key: "envoyerAvis", label: "Envoyer un avis d'installation au client" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-[0.625rem] cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as Record<string, unknown>)[key] as boolean}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="w-[1.125rem] h-[1.125rem] rounded border-slate-300 text-blue-500 focus:ring-blue-300"
                />
                <span className="text-[0.875rem] text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.375rem]">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-xl text-[0.875rem] resize-none focus:ring-2 focus:ring-blue-300 outline-none"
              placeholder="Notes pour l'équipe..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-[1rem] border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-[1rem] py-[0.5rem] text-slate-600 hover:bg-slate-100 rounded-lg text-[0.875rem] transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.datePlanifiee || !form.equipeId || submitting}
            className="px-[1.25rem] sm:px-[1.5rem] py-[0.625rem] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold rounded-xl text-[0.875rem] transition-colors"
          >
            {submitting ? "Planification..." : "Planifier"}
          </button>
        </div>
      </div>
    </div>
  );
}