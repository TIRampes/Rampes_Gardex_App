"use client";

import { useState, useEffect } from "react";
import { Tags, Plus, Loader2, Pencil, Trash2, Package } from "lucide-react";
import InventaireNav from "@/app/components/inventaire/Inventaireav";
import SlidePanel from "@/app/components/inventaire/Slidepanel";
import { ActionMenu, ConfirmDialog, Toast, Field } from "@/app/components/inventaire/Shareui";
import { useCategories } from "@/app/hooks/useinventaire";
import type { CategorieInv } from "@/app/types/inventaire";

// Palette de couleurs pour les catégories
const COLORS = [
  { bg: "bg-sky-100", text: "text-sky-700", accent: "bg-sky-500" },
  { bg: "bg-emerald-100", text: "text-emerald-700", accent: "bg-emerald-500" },
  { bg: "bg-amber-100", text: "text-amber-700", accent: "bg-amber-500" },
  { bg: "bg-rose-100", text: "text-rose-700", accent: "bg-rose-500" },
  { bg: "bg-violet-100", text: "text-violet-700", accent: "bg-violet-500" },
  { bg: "bg-teal-100", text: "text-teal-700", accent: "bg-teal-500" },
  { bg: "bg-orange-100", text: "text-orange-700", accent: "bg-orange-500" },
  { bg: "bg-indigo-100", text: "text-indigo-700", accent: "bg-indigo-500" },
];

function getColor(index: number) { return COLORS[index % COLORS.length]; }

export default function CategoriesPage() {
  const { categories, loading, charger, creer, modifier, supprimer } = useCategories();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<CategorieInv | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategorieInv | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; visible: boolean }>({ message: "", type: "success", visible: false });
  const [form, setForm] = useState({ nom: "" });

  useEffect(() => { charger(); }, [charger]);

  const openCreate = () => { setForm({ nom: "" }); setPanelMode("create"); setSelected(null); setPanelOpen(true); };
  const openEdit = (c: CategorieInv) => { setForm({ nom: c.nom }); setSelected(c); setPanelMode("edit"); setPanelOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (panelMode === "create") { await creer({ nom: form.nom }); setToast({ message: "Catégorie créée", type: "success", visible: true }); }
      else { await modifier(selected!.id, { nom: form.nom }); setToast({ message: "Catégorie modifiée", type: "success", visible: true }); }
      setPanelOpen(false);
    } catch (e) { setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true }); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try { await supprimer(confirmDelete.id); setToast({ message: "Catégorie supprimée", type: "success", visible: true }); setConfirmDelete(null); }
    catch (e) { setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true }); }
    setSaving(false);
  };

  const totalPieces = categories.reduce((a, c) => a + (c._count?.produits ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[0.75rem] py-[1.25rem]">
            <div>
              <h1 className="text-[1.375rem] sm:text-[1.625rem] font-extrabold text-slate-800 tracking-tight flex items-center gap-[0.5rem]">
                <div className="w-[2.25rem] h-[2.25rem] bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Tags className="w-[1.125rem] h-[1.125rem] text-white" />
                </div>
                Catégories
              </h1>
              <p className="text-[0.8125rem] text-slate-500 mt-[0.125rem]">{categories.length} catégorie(s) · {totalPieces} pièce(s) classées</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[0.8125rem] font-semibold shadow-md transition-all">
              <Plus className="w-[0.875rem] h-[0.875rem]" /> Nouvelle catégorie
            </button>
          </div>
          <InventaireNav />
        </div>
      </div>

      <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem] py-[1rem]">
        {loading ? (
          <div className="flex items-center justify-center py-[4rem]"><Loader2 className="w-[1.25rem] h-[1.25rem] text-slate-400 animate-spin" /></div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-[3rem] text-center">
            <Tags className="w-[2rem] h-[2rem] text-slate-300 mx-auto mb-[0.5rem]" />
            <p className="text-[0.875rem] text-slate-500">Aucune catégorie configurée</p>
            <button onClick={openCreate} className="mt-[0.75rem] text-[0.8125rem] text-sky-600 hover:text-sky-800 font-medium">Créer la première</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[0.75rem]">
            {categories.map((c, i) => {
              const color = getColor(i);
              const nbPieces = c._count?.produits ?? 0;
              return (
                <div key={c.id} onClick={() => openEdit(c)} className="bg-white rounded-2xl border border-slate-200 p-[1rem] cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all group relative overflow-hidden">
                  {/* Color accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-[0.1875rem] ${color.accent}`} />

                  <div className="flex items-start justify-between mb-[0.5rem]">
                    <div className="flex items-center gap-[0.5rem]">
                      <div className={`w-[2.25rem] h-[2.25rem] ${color.bg} rounded-lg flex items-center justify-center ${color.text} transition-colors`}>
                        <Tags className="w-[1rem] h-[1rem]" />
                      </div>
                      <div>
                        <p className="text-[0.9375rem] font-bold text-slate-800">{c.nom}</p>
                        <p className="text-[0.6875rem] text-slate-500">
                          {nbPieces === 0 ? "Aucune pièce" : `${nbPieces} pièce${nbPieces > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionMenu actions={[
                        { label: "Modifier", icon: <Pencil className="w-[0.75rem] h-[0.75rem]" />, onClick: () => openEdit(c) },
                        { label: "Supprimer", icon: <Trash2 className="w-[0.75rem] h-[0.75rem]" />, onClick: () => setConfirmDelete(c), danger: true, disabled: nbPieces > 0 },
                      ]} />
                    </div>
                  </div>

                  {/* Mini bar chart */}
                  <div className="mt-[0.5rem] pt-[0.5rem] border-t border-slate-100">
                    <div className="flex items-center justify-between text-[0.6875rem] text-slate-500 mb-[0.25rem]">
                      <span className="flex items-center gap-[0.25rem]"><Package className="w-[0.625rem] h-[0.625rem]" /> Pièces</span>
                      <span className="font-bold text-slate-700">{nbPieces}</span>
                    </div>
                    <div className="h-[0.25rem] bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color.accent} rounded-full transition-all`} style={{ width: `${totalPieces > 0 ? Math.max(4, (nbPieces / totalPieces) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} titre={panelMode === "create" ? "Nouvelle catégorie" : `Modifier — ${selected?.nom}`}
        footer={<div className="flex items-center justify-end gap-[0.5rem]">
          <button onClick={() => setPanelOpen(false)} className="px-[0.875rem] py-[0.4375rem] border border-slate-300 rounded-xl text-[0.8125rem] hover:bg-slate-100">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.nom} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.4375rem] bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-[0.8125rem] font-semibold">
            {saving && <Loader2 className="w-[0.875rem] h-[0.875rem] animate-spin" />} {panelMode === "create" ? "Créer" : "Enregistrer"}
          </button>
        </div>}>
        <div className="space-y-[0.75rem]">
          <Field label="Nom de la catégorie" id="nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required placeholder="ex: Rampes, Poteaux, Verres…" />
          {panelMode === "edit" && selected && (
            <div className="bg-slate-50 rounded-xl p-[0.75rem] text-[0.75rem] text-slate-500">
              <p><strong className="text-slate-700">{selected._count?.produits ?? 0}</strong> pièce(s) utilisent cette catégorie</p>
              <p className="mt-[0.25rem]">Créée le {new Date(selected.createdAt).toLocaleDateString("fr-CA")}</p>
            </div>
          )}
        </div>
      </SlidePanel>

      <ConfirmDialog open={!!confirmDelete} titre="Supprimer cette catégorie ?" message={`La catégorie "${confirmDelete?.nom}" sera supprimée définitivement.`} labelConfirm="Supprimer" loading={saving} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </div>
  );
}