"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Search, X, Loader2, Pencil, Trash2, ToggleLeft, ToggleRight, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import InventaireNav from "@/app/components/inventaire/Inventaireav";
import SlidePanel from"@/app/components/inventaire/Slidepanel";
import { ActionMenu, ConfirmDialog, Toast, Field, ToggleField } from "@/app/components/inventaire/Shareui";
import { useFournisseurs } from "@/app/hooks/useinventaire";
import type { FournisseurInv } from "@/app/types/inventaire";

export default function FournisseursPage() {
  const { fournisseurs, loading, pagination, charger, creer, modifier, supprimer } = useFournisseurs();
  const [recherche, setRecherche] = useState("");
  const [filtreActif, setFiltreActif] = useState("true");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<FournisseurInv | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FournisseurInv | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; visible: boolean }>({ message: "", type: "success", visible: false });
  const [form, setForm] = useState({ nom: "", contact: "", telephone: "", email: "", adresse: "", notes: "", actif: true });

  const recharger = useCallback(() => {
    const params: Record<string, string> = { page: String(page), limite: "50" };
    if (recherche) params.recherche = recherche;
    if (filtreActif) params.actif = filtreActif;
    charger(params);
  }, [page, recherche, filtreActif, charger]);

  useEffect(() => { recharger(); }, [recharger]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); recharger(); }, 300); return () => clearTimeout(t); }, [recherche]);

  const resetForm = () => setForm({ nom: "", contact: "", telephone: "", email: "", adresse: "", notes: "", actif: true });

  const openCreate = () => { resetForm(); setPanelMode("create"); setSelected(null); setPanelOpen(true); };

  const openEdit = (f: FournisseurInv) => {
    setForm({ nom: f.nom, contact: f.contact ?? "", telephone: f.telephone ?? "", email: f.email ?? "", adresse: f.adresse ?? "", notes: f.notes ?? "", actif: f.actif });
    setSelected(f); setPanelMode("edit"); setPanelOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { nom: form.nom, contact: form.contact || undefined, telephone: form.telephone || undefined, email: form.email || undefined, adresse: form.adresse || undefined, notes: form.notes || undefined, actif: form.actif };
      if (panelMode === "create") { await creer(data); setToast({ message: "Fournisseur créé", type: "success", visible: true }); }
      else { await modifier(selected!.id, data); setToast({ message: "Fournisseur modifié", type: "success", visible: true }); }
      setPanelOpen(false); recharger();
    } catch (e) { setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true }); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try { await supprimer(confirmDelete.id); setToast({ message: "Fournisseur supprimé", type: "success", visible: true }); setConfirmDelete(null); recharger(); }
    catch (e) { setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true }); }
    setSaving(false);
  };

  const handleToggleActif = async (f: FournisseurInv) => {
    try { await modifier(f.id, { actif: !f.actif }); setToast({ message: f.actif ? "Fournisseur désactivé" : "Fournisseur réactivé", type: "info", visible: true }); recharger(); }
    catch (e) { setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true }); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[0.75rem] py-[1.25rem]">
            <div>
              <h1 className="text-[1.375rem] sm:text-[1.625rem] font-extrabold text-slate-800 tracking-tight flex items-center gap-[0.5rem]">
                <div className="w-[2.25rem] h-[2.25rem] bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Truck className="w-[1.125rem] h-[1.125rem] text-white" />
                </div>
                Fournisseurs
              </h1>
              <p className="text-[0.8125rem] text-slate-500 mt-[0.125rem]">{pagination.total} fournisseur(s)</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[0.8125rem] font-semibold shadow-md transition-all">
              <Plus className="w-[0.875rem] h-[0.875rem]" /> Nouveau fournisseur
            </button>
          </div>
          <InventaireNav />
        </div>
      </div>

      <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem] py-[1rem]">
        <div className="flex flex-wrap items-center gap-[0.5rem] mb-[0.75rem]">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-[0.75rem] top-1/2 -translate-y-1/2 w-[0.875rem] h-[0.875rem] text-slate-400" />
            <input type="text" placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-[2.25rem] pr-[2rem] py-[0.5rem] border border-slate-200 rounded-xl text-[0.8125rem] bg-white focus:ring-2 focus:ring-sky-300 outline-none" />
            {recherche && <button onClick={() => setRecherche("")} className="absolute right-[0.5rem] top-1/2 -translate-y-1/2 p-[0.125rem] hover:bg-slate-100 rounded"><X className="w-[0.75rem] h-[0.75rem] text-slate-400" /></button>}
          </div>
          <select value={filtreActif} onChange={(e) => { setFiltreActif(e.target.value); setPage(1); }} className="px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-xl text-[0.8125rem] bg-white focus:ring-2 focus:ring-sky-300 outline-none">
            <option value="true">Actifs</option><option value="false">Inactifs</option><option value="">Tous</option>
          </select>
        </div>

        {/* Cards Grid — more professional than a table for fournisseurs */}
        {loading ? (
          <div className="flex items-center justify-center py-[4rem]"><Loader2 className="w-[1.25rem] h-[1.25rem] text-slate-400 animate-spin" /></div>
        ) : fournisseurs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-[3rem] text-center">
            <Truck className="w-[2rem] h-[2rem] text-slate-300 mx-auto mb-[0.5rem]" />
            <p className="text-[0.875rem] text-slate-500">Aucun fournisseur trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[0.75rem]">
            {fournisseurs.map((f) => (
              <div
                key={f.id}
                onClick={() => openEdit(f)}
                className={`bg-white rounded-2xl border border-slate-200 p-[1rem] cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all group ${!f.actif ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between mb-[0.625rem]">
                  <div className="flex items-center gap-[0.5rem] min-w-0">
                    <div className="w-[2.25rem] h-[2.25rem] bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-slate-800 group-hover:text-white transition-colors flex-shrink-0">
                      <Truck className="w-[1rem] h-[1rem]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] font-bold text-slate-800 truncate">{f.nom}</p>
                      {f.contact && <p className="text-[0.75rem] text-slate-500 truncate">{f.contact}</p>}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionMenu actions={[
                      { label: "Modifier", icon: <Pencil className="w-[0.75rem] h-[0.75rem]" />, onClick: () => openEdit(f) },
                      { label: f.actif ? "Désactiver" : "Réactiver", icon: f.actif ? <ToggleLeft className="w-[0.75rem] h-[0.75rem]" /> : <ToggleRight className="w-[0.75rem] h-[0.75rem]" />, onClick: () => handleToggleActif(f) },
                      { label: "Supprimer", icon: <Trash2 className="w-[0.75rem] h-[0.75rem]" />, onClick: () => setConfirmDelete(f), danger: true },
                    ]} />
                  </div>
                </div>
                <div className="space-y-[0.25rem] text-[0.75rem] text-slate-500">
                  {f.telephone && <p className="flex items-center gap-[0.375rem]"><Phone className="w-[0.625rem] h-[0.625rem]" /> {f.telephone}</p>}
                  {f.email && <p className="flex items-center gap-[0.375rem]"><Mail className="w-[0.625rem] h-[0.625rem]" /> <span className="truncate">{f.email}</span></p>}
                  {f.adresse && <p className="flex items-center gap-[0.375rem]"><MapPin className="w-[0.625rem] h-[0.625rem]" /> <span className="truncate">{f.adresse}</span></p>}
                </div>
                <div className="flex items-center gap-[0.375rem] mt-[0.625rem] pt-[0.5rem] border-t border-slate-100">
                  <span className="text-[0.6875rem] bg-slate-100 text-slate-600 px-[0.375rem] py-[0.0625rem] rounded font-medium">{f._count?.produitsPrincipaux ?? 0} pièces</span>
                  <span className="text-[0.6875rem] bg-slate-100 text-slate-600 px-[0.375rem] py-[0.0625rem] rounded font-medium">{f._count?.achats ?? 0} achats</span>
                  {!f.actif && <span className="text-[0.6875rem] bg-rose-100 text-rose-600 px-[0.375rem] py-[0.0625rem] rounded font-medium">Inactif</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-[0.75rem] text-[0.75rem] text-slate-500">
            <span>{pagination.total} résultat(s)</span>
            <div className="flex gap-[0.25rem]">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-[0.375rem] rounded-lg hover:bg-slate-200 disabled:opacity-30"><ChevronLeft className="w-[0.875rem] h-[0.875rem]" /></button>
              <span className="px-[0.5rem] py-[0.375rem] font-medium">{page}/{pagination.totalPages}</span>
              <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages} className="p-[0.375rem] rounded-lg hover:bg-slate-200 disabled:opacity-30"><ChevronRight className="w-[0.875rem] h-[0.875rem]" /></button>
            </div>
          </div>
        )}
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} titre={panelMode === "create" ? "Nouveau fournisseur" : `Modifier — ${selected?.nom}`}
        footer={<div className="flex items-center justify-end gap-[0.5rem]">
          <button onClick={() => setPanelOpen(false)} className="px-[0.875rem] py-[0.4375rem] border border-slate-300 rounded-xl text-[0.8125rem] hover:bg-slate-100 transition-colors">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.nom} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.4375rem] bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-[0.8125rem] font-semibold transition-colors">
            {saving && <Loader2 className="w-[0.875rem] h-[0.875rem] animate-spin" />} {panelMode === "create" ? "Créer" : "Enregistrer"}
          </button>
        </div>}>
        <div className="space-y-[0.75rem]">
          <Field label="Nom" id="nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required placeholder="Nom du fournisseur" />
          <Field label="Personne contact" id="contact" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} placeholder="Jean Dupont" />
          <div className="grid grid-cols-2 gap-[0.5rem]">
            <Field label="Téléphone" id="tel" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} placeholder="(418) 555-1234" />
            <Field label="Email" id="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="contact@fournisseur.com" />
          </div>
          <Field label="Adresse" id="adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} rows={2} placeholder="123 rue Principale, Québec" />
          <Field label="Notes" id="notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={3} placeholder="Notes internes…" />
          <ToggleField label="Fournisseur actif" checked={form.actif} onChange={(v) => setForm({ ...form, actif: v })} />
        </div>
      </SlidePanel>

      <ConfirmDialog open={!!confirmDelete} titre="Supprimer ce fournisseur ?" message={`Le fournisseur "${confirmDelete?.nom}" sera supprimé ou désactivé.`} labelConfirm="Supprimer" loading={saving} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </div>
  );
}