"use client";

import { useState, useEffect } from "react";
import { Ruler, Plus, Loader2, Pencil, Trash2, Package } from "lucide-react";
import InventaireNav from "@/app/components/inventaire/Inventaireav";
import SlidePanel from "@/app/components/inventaire/Slidepanel";
import { ActionMenu, ConfirmDialog, Toast, Field } from "@/app/components/inventaire/Shareui";
import { useUnites } from "@/app/hooks/useinventaire";
import type { UniteInv } from "@/app/types/inventaire";

export default function UnitesPage() {
  const { unites, loading, charger, creer, modifier, supprimer } = useUnites();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<UniteInv | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UniteInv | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; visible: boolean }>({ message: "", type: "success", visible: false });
  const [form, setForm] = useState({ unite: "", qtePar: "1", description: "" });

  useEffect(() => { charger(); }, [charger]);

  const resetForm = () => setForm({ unite: "", qtePar: "1", description: "" });
  const openCreate = () => { resetForm(); setPanelMode("create"); setSelected(null); setPanelOpen(true); };
  const openEdit = (u: UniteInv) => { setForm({ unite: u.unite, qtePar: String(u.qtePar), description: u.description ?? "" }); setSelected(u); setPanelMode("edit"); setPanelOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { unite: form.unite, qtePar: parseInt(form.qtePar) || 1, description: form.description || undefined };
      if (panelMode === "create") { await creer(data); setToast({ message: "Unité créée", type: "success", visible: true }); }
      else { await modifier(selected!.id, data); setToast({ message: "Unité modifiée", type: "success", visible: true }); }
      setPanelOpen(false);
    } catch (e) { setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true }); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try { await supprimer(confirmDelete.id); setToast({ message: "Unité supprimée", type: "success", visible: true }); setConfirmDelete(null); }
    catch (e) { setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true }); }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[0.75rem] py-[1.25rem]">
            <div>
              <h1 className="text-[1.375rem] sm:text-[1.625rem] font-extrabold text-slate-800 tracking-tight flex items-center gap-[0.5rem]">
                <div className="w-[2.25rem] h-[2.25rem] bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Ruler className="w-[1.125rem] h-[1.125rem] text-white" />
                </div>
                Unités de mesure
              </h1>
              <p className="text-[0.8125rem] text-slate-500 mt-[0.125rem]">{unites.length} unité(s) configurée(s)</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[0.8125rem] font-semibold shadow-md transition-all">
              <Plus className="w-[0.875rem] h-[0.875rem]" /> Nouvelle unité
            </button>
          </div>
          <InventaireNav />
        </div>
      </div>

      <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem] py-[1rem]">
        {loading ? (
          <div className="flex items-center justify-center py-[4rem]"><Loader2 className="w-[1.25rem] h-[1.25rem] text-slate-400 animate-spin" /></div>
        ) : unites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-[3rem] text-center">
            <Ruler className="w-[2rem] h-[2rem] text-slate-300 mx-auto mb-[0.5rem]" />
            <p className="text-[0.875rem] text-slate-500">Aucune unité configurée</p>
            <button onClick={openCreate} className="mt-[0.75rem] text-[0.8125rem] text-sky-600 hover:text-sky-800 font-medium">Créer la première</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[0.75rem]">
            {unites.map((u) => (
              <div key={u.id} onClick={() => openEdit(u)} className="bg-white rounded-2xl border border-slate-200 p-[1rem] cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all group">
                <div className="flex items-start justify-between mb-[0.5rem]">
                  <div className="flex items-center gap-[0.5rem]">
                    <div className="w-[2.25rem] h-[2.25rem] bg-sky-50 rounded-lg flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <Ruler className="w-[1rem] h-[1rem]" />
                    </div>
                    <div>
                      <p className="text-[0.9375rem] font-bold text-slate-800">{u.unite}</p>
                      <p className="text-[0.6875rem] text-slate-500">×{u.qtePar} par unité</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu actions={[
                      { label: "Modifier", icon: <Pencil className="w-[0.75rem] h-[0.75rem]" />, onClick: () => openEdit(u) },
                      { label: "Supprimer", icon: <Trash2 className="w-[0.75rem] h-[0.75rem]" />, onClick: () => setConfirmDelete(u), danger: true, disabled: (u._count?.produits ?? 0) > 0 },
                    ]} />
                  </div>
                </div>
                {u.description && <p className="text-[0.75rem] text-slate-500 mt-[0.25rem] line-clamp-2">{u.description}</p>}
                <div className="flex items-center gap-[0.25rem] mt-[0.5rem] pt-[0.5rem] border-t border-slate-100">
                  <Package className="w-[0.625rem] h-[0.625rem] text-slate-400" />
                  <span className="text-[0.6875rem] text-slate-500 font-medium">{u._count?.produits ?? 0} pièce(s) liée(s)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} titre={panelMode === "create" ? "Nouvelle unité" : `Modifier — ${selected?.unite}`}
        footer={<div className="flex items-center justify-end gap-[0.5rem]">
          <button onClick={() => setPanelOpen(false)} className="px-[0.875rem] py-[0.4375rem] border border-slate-300 rounded-xl text-[0.8125rem] hover:bg-slate-100">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.unite} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.4375rem] bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-[0.8125rem] font-semibold">
            {saving && <Loader2 className="w-[0.875rem] h-[0.875rem] animate-spin" />} {panelMode === "create" ? "Créer" : "Enregistrer"}
          </button>
        </div>}>
        <div className="space-y-[0.75rem]">
          <Field label="Nom de l'unité" id="unite" value={form.unite} onChange={(v) => setForm({ ...form, unite: v })} required placeholder="ex: Unité, Boîte, Paire…" />
          <Field label="Quantité par unité" id="qtePar" value={form.qtePar} onChange={(v) => setForm({ ...form, qtePar: v })} type="number" />
          <Field label="Description" id="desc" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={3} placeholder="Description optionnelle…" />
        </div>
      </SlidePanel>

      <ConfirmDialog open={!!confirmDelete} titre="Supprimer cette unité ?" message={`L'unité "${confirmDelete?.unite}" sera supprimée définitivement.`} labelConfirm="Supprimer" loading={saving} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </div>
  );
}