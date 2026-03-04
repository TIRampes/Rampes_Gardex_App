"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Search, X, Filter, Loader2, Download, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, Copy, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";
import InventaireNav from "@/app/components/inventaire/Inventaireav";
import SlidePanel from "@/app/components/inventaire/Slidepanel";
import { ActionMenu, ConfirmDialog, Toast, Field, SelectField, ToggleField } from "@/app/components/inventaire/Shareui";
import { usePieces, useCategories, useUnites, useFournisseurs } from "@/app/hooks/useInventaire";
import type { Piece } from "@/app/types/inventaire";

export default function PiecesPage() {
  const { pieces, loading, stats, pagination, charger, creer, modifier, supprimer } = usePieces();
  const { categories, charger: chargerCats } = useCategories();
  const { unites, charger: chargerUnites } = useUnites();
  const { fournisseurs, charger: chargerFournisseurs } = useFournisseurs();

  // Filtres
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [filtreFournisseur, setFiltreFournisseur] = useState("");
  const [filtreActif, setFiltreActif] = useState("true");
  const [filtreSousSeuil, setFiltreSousSeuil] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // CRUD state
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "edit" | "view">("create");
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Piece | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; visible: boolean }>({ message: "", type: "success", visible: false });

  // Form state
  const [form, setForm] = useState({ code: "", nom: "", description: "", categoriePieceId: "", uniteId: "", quantite: "0", seuilMin: "0", seuilMax: "", prixUnitaire: "", emplacement: "", emplacement2: "", inventaireEmplacement1: "0", inventaireEmplacement2: "0", couleur: "", codePieceNonPeinte: "", piecePeinte: false, fournisseurId: "", actif: true });

  const recharger = useCallback(() => {
    const params: Record<string, string> = { page: String(page), limite: "50" };
    if (recherche) params.recherche = recherche;
    if (filtreCategorie) params.categorieId = filtreCategorie;
    if (filtreFournisseur) params.fournisseurId = filtreFournisseur;
    if (filtreActif) params.actif = filtreActif;
    if (filtreSousSeuil) params.sousSeuilMin = "true";
    charger(params);
  }, [page, recherche, filtreCategorie, filtreFournisseur, filtreActif, filtreSousSeuil, charger]);

  useEffect(() => { recharger(); }, [recharger]);
  useEffect(() => { chargerCats(); chargerUnites(); chargerFournisseurs(); }, [chargerCats, chargerUnites, chargerFournisseurs]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); recharger(); }, 300);
    return () => clearTimeout(t);
  }, [recherche]);

  const resetForm = () => setForm({ code: "", nom: "", description: "", categoriePieceId: "", uniteId: "", quantite: "0", seuilMin: "0", seuilMax: "", prixUnitaire: "", emplacement: "", emplacement2: "", inventaireEmplacement1: "0", inventaireEmplacement2: "0", couleur: "", codePieceNonPeinte: "", piecePeinte: false, fournisseurId: "", actif: true });

  const openCreate = () => { resetForm(); setPanelMode("create"); setSelectedPiece(null); setPanelOpen(true); };

  const openEdit = (p: Piece) => {
    setForm({
      code: p.code, nom: p.nom, description: p.description ?? "", categoriePieceId: p.categoriePieceId ?? "",
      uniteId: p.uniteId ?? "", quantite: String(p.quantite), seuilMin: String(p.seuilMin), seuilMax: p.seuilMax != null ? String(p.seuilMax) : "",
      prixUnitaire: p.prixUnitaire != null ? String(p.prixUnitaire) : "", emplacement: p.emplacement ?? "", emplacement2: p.emplacement2 ?? "",
      inventaireEmplacement1: String(p.inventaireEmplacement1), inventaireEmplacement2: String(p.inventaireEmplacement2),
      couleur: p.couleur ?? "", codePieceNonPeinte: p.codePieceNonPeinte ?? "", piecePeinte: p.piecePeinte,
      fournisseurId: p.fournisseurId ?? "", actif: p.actif,
    });
    setSelectedPiece(p);
    setPanelMode("edit");
    setPanelOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        code: form.code, nom: form.nom, description: form.description || undefined,
        categoriePieceId: form.categoriePieceId || undefined, uniteId: form.uniteId || undefined,
        quantite: parseInt(form.quantite) || 0, seuilMin: parseInt(form.seuilMin) || 0,
        seuilMax: form.seuilMax ? parseInt(form.seuilMax) : undefined,
        prixUnitaire: form.prixUnitaire ? parseFloat(form.prixUnitaire) : undefined,
        emplacement: form.emplacement || undefined, emplacement2: form.emplacement2 || undefined,
        inventaireEmplacement1: parseInt(form.inventaireEmplacement1) || 0,
        inventaireEmplacement2: parseInt(form.inventaireEmplacement2) || 0,
        couleur: form.couleur || undefined, codePieceNonPeinte: form.codePieceNonPeinte || undefined,
        piecePeinte: form.piecePeinte, fournisseurId: form.fournisseurId || undefined, actif: form.actif,
      };

      if (panelMode === "create") {
        await creer(data);
        setToast({ message: "Pièce créée avec succès", type: "success", visible: true });
      } else {
        await modifier(selectedPiece!.id, data);
        setToast({ message: "Pièce modifiée avec succès", type: "success", visible: true });
      }
      setPanelOpen(false);
      recharger();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await supprimer(confirmDelete.id);
      setToast({ message: "Pièce supprimée", type: "success", visible: true });
      setConfirmDelete(null);
      recharger();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true });
    }
    setSaving(false);
  };

  const handleToggleActif = async (p: Piece) => {
    try {
      await modifier(p.id, { actif: !p.actif });
      setToast({ message: p.actif ? "Pièce désactivée" : "Pièce réactivée", type: "info", visible: true });
      recharger();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Erreur", type: "error", visible: true });
    }
  };

  const nbFiltres = (filtreCategorie ? 1 : 0) + (filtreFournisseur ? 1 : 0) + (filtreSousSeuil ? 1 : 0) + (filtreActif !== "true" ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[0.75rem] py-[1.25rem]">
            <div>
              <h1 className="text-[1.375rem] sm:text-[1.625rem] font-extrabold text-slate-800 tracking-tight flex items-center gap-[0.5rem]">
                <div className="w-[2.25rem] h-[2.25rem] bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-[1.125rem] h-[1.125rem] text-white" />
                </div>
                Pièces
              </h1>
              <p className="text-[0.8125rem] text-slate-500 mt-[0.125rem]">
                {stats ? `${stats.totalActives} actives · ${stats.totalSousSeuil} sous seuil` : "Chargement…"}
              </p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[0.8125rem] font-semibold shadow-md hover:shadow-lg transition-all">
              <Plus className="w-[0.875rem] h-[0.875rem]" />
              Nouvelle pièce
            </button>
          </div>
          <InventaireNav />
        </div>
      </div>

      {/* Search + Filters */}
      <div className="max-w-[82rem] mx-auto px-[1rem] sm:px-[1.5rem] py-[1rem]">
        <div className="flex flex-wrap items-center gap-[0.5rem] mb-[0.75rem]">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="absolute left-[0.75rem] top-1/2 -translate-y-1/2 w-[0.875rem] h-[0.875rem] text-slate-400" />
            <input
              type="text" placeholder="Rechercher (code, nom, emplacement…)" value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-[2.25rem] pr-[2rem] py-[0.5rem] border border-slate-200 rounded-xl text-[0.8125rem] bg-white focus:ring-2 focus:ring-sky-300 outline-none"
            />
            {recherche && (
              <button onClick={() => setRecherche("")} className="absolute right-[0.5rem] top-1/2 -translate-y-1/2 p-[0.125rem] hover:bg-slate-100 rounded">
                <X className="w-[0.75rem] h-[0.75rem] text-slate-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-[0.375rem] px-[0.75rem] py-[0.5rem] border rounded-xl text-[0.8125rem] transition-colors ${showFilters || nbFiltres > 0 ? "bg-sky-50 border-sky-300 text-sky-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            <Filter className="w-[0.875rem] h-[0.875rem]" />
            Filtres
            {nbFiltres > 0 && <span className="w-[1.125rem] h-[1.125rem] bg-sky-500 text-white text-[0.625rem] font-bold rounded-full flex items-center justify-center">{nbFiltres}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-xl p-[0.75rem] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[0.5rem] mb-[0.75rem]">
            <select value={filtreCategorie} onChange={(e) => { setFiltreCategorie(e.target.value); setPage(1); }} className="px-[0.625rem] py-[0.4375rem] border border-slate-200 rounded-lg bg-white text-[0.8125rem] focus:ring-2 focus:ring-sky-300 outline-none">
              <option value="">Toutes les catégories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <select value={filtreFournisseur} onChange={(e) => { setFiltreFournisseur(e.target.value); setPage(1); }} className="px-[0.625rem] py-[0.4375rem] border border-slate-200 rounded-lg bg-white text-[0.8125rem] focus:ring-2 focus:ring-sky-300 outline-none">
              <option value="">Tous les fournisseurs</option>
              {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <select value={filtreActif} onChange={(e) => { setFiltreActif(e.target.value); setPage(1); }} className="px-[0.625rem] py-[0.4375rem] border border-slate-200 rounded-lg bg-white text-[0.8125rem] focus:ring-2 focus:ring-sky-300 outline-none">
              <option value="true">Actives seulement</option>
              <option value="false">Inactives seulement</option>
              <option value="">Toutes</option>
            </select>
            <label className="flex items-center gap-[0.375rem] px-[0.625rem] py-[0.4375rem] border border-slate-200 rounded-lg bg-white text-[0.8125rem] cursor-pointer hover:bg-rose-50 transition-colors">
              <input type="checkbox" checked={filtreSousSeuil} onChange={(e) => { setFiltreSousSeuil(e.target.checked); setPage(1); }} className="rounded border-slate-300 text-rose-500 focus:ring-rose-300" />
              <AlertTriangle className="w-[0.75rem] h-[0.75rem] text-rose-500" />
              Sous seuil min
            </label>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-[4rem]">
              <Loader2 className="w-[1.25rem] h-[1.25rem] text-slate-400 animate-spin" />
            </div>
          ) : pieces.length === 0 ? (
            <div className="text-center py-[3rem]">
              <Package className="w-[2rem] h-[2rem] text-slate-300 mx-auto mb-[0.5rem]" />
              <p className="text-[0.875rem] text-slate-500">Aucune pièce trouvée</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[0.8125rem]">
                  <thead>
                    <tr className="text-[0.6875rem] text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/70 border-b border-slate-200">
                      <th className="px-[1rem] py-[0.625rem] text-left">Code</th>
                      <th className="px-[0.75rem] py-[0.625rem] text-left">Nom</th>
                      <th className="px-[0.75rem] py-[0.625rem] text-left hidden lg:table-cell">Catégorie</th>
                      <th className="px-[0.75rem] py-[0.625rem] text-right">Qté</th>
                      <th className="px-[0.75rem] py-[0.625rem] text-right hidden sm:table-cell">Seuil</th>
                      <th className="px-[0.75rem] py-[0.625rem] text-right hidden md:table-cell">Prix</th>
                      <th className="px-[0.75rem] py-[0.625rem] text-left hidden xl:table-cell">Emplacement</th>
                      <th className="px-[0.75rem] py-[0.625rem] text-left hidden xl:table-cell">Fournisseur</th>
                      <th className="px-[0.75rem] py-[0.625rem] text-center">Statut</th>
                      <th className="px-[0.5rem] py-[0.625rem] w-[2.5rem]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pieces.map((p) => {
                      const sousSeuilLocal = p.seuilMin > 0 && p.quantite <= p.seuilMin;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => openEdit(p)}
                          className={`border-t border-slate-100 cursor-pointer transition-colors ${sousSeuilLocal ? "bg-rose-50/40 hover:bg-rose-50/70" : "hover:bg-slate-50"} ${!p.actif ? "opacity-50" : ""}`}
                        >
                          <td className="px-[1rem] py-[0.5rem] font-mono font-bold text-slate-800 text-[0.75rem]">{p.code}</td>
                          <td className="px-[0.75rem] py-[0.5rem] text-slate-700 max-w-[14rem] truncate">{p.nom}</td>
                          <td className="px-[0.75rem] py-[0.5rem] text-slate-500 hidden lg:table-cell">
                            {p.categoriePiece ? (
                              <span className="bg-slate-100 text-slate-600 px-[0.375rem] py-[0.0625rem] rounded text-[0.6875rem]">{p.categoriePiece.nom}</span>
                            ) : "—"}
                          </td>
                          <td className="px-[0.75rem] py-[0.5rem] text-right">
                            <span className={`font-bold ${sousSeuilLocal ? "text-rose-600" : "text-slate-800"}`}>{p.quantite}</span>
                          </td>
                          <td className="px-[0.75rem] py-[0.5rem] text-right text-slate-500 hidden sm:table-cell">{p.seuilMin}</td>
                          <td className="px-[0.75rem] py-[0.5rem] text-right text-slate-600 hidden md:table-cell">
                            {p.prixUnitaire != null ? `${p.prixUnitaire.toFixed(2)} $` : "—"}
                          </td>
                          <td className="px-[0.75rem] py-[0.5rem] text-slate-500 text-[0.75rem] hidden xl:table-cell truncate max-w-[8rem]">{p.emplacement || "—"}</td>
                          <td className="px-[0.75rem] py-[0.5rem] text-slate-500 text-[0.75rem] hidden xl:table-cell truncate max-w-[8rem]">{p.fournisseur?.nom ?? "—"}</td>
                          <td className="px-[0.75rem] py-[0.5rem] text-center">
                            {sousSeuilLocal ? (
                              <span className="inline-flex items-center gap-[0.125rem] bg-rose-100 text-rose-700 px-[0.375rem] py-[0.0625rem] rounded-md text-[0.625rem] font-bold">
                                <AlertTriangle className="w-[0.5rem] h-[0.5rem]" /> Bas
                              </span>
                            ) : p.actif ? (
                              <span className="w-[0.5rem] h-[0.5rem] bg-emerald-400 rounded-full inline-block" />
                            ) : (
                              <span className="w-[0.5rem] h-[0.5rem] bg-slate-300 rounded-full inline-block" />
                            )}
                          </td>
                          <td className="px-[0.5rem] py-[0.5rem]" onClick={(e) => e.stopPropagation()}>
                            <ActionMenu actions={[
                              { label: "Modifier", icon: <Pencil className="w-[0.75rem] h-[0.75rem]" />, onClick: () => openEdit(p) },
                              { label: "Dupliquer", icon: <Copy className="w-[0.75rem] h-[0.75rem]" />, onClick: () => { resetForm(); setForm((f) => ({ ...f, code: "", nom: `${p.nom} (copie)`, description: p.description ?? "", categoriePieceId: p.categoriePieceId ?? "", uniteId: p.uniteId ?? "", seuilMin: String(p.seuilMin), prixUnitaire: p.prixUnitaire != null ? String(p.prixUnitaire) : "", emplacement: p.emplacement ?? "", fournisseurId: p.fournisseurId ?? "" })); setPanelMode("create"); setPanelOpen(true); } },
                              { label: p.actif ? "Désactiver" : "Réactiver", icon: p.actif ? <ToggleLeft className="w-[0.75rem] h-[0.75rem]" /> : <ToggleRight className="w-[0.75rem] h-[0.75rem]" />, onClick: () => handleToggleActif(p) },
                              { label: "Supprimer", icon: <Trash2 className="w-[0.75rem] h-[0.75rem]" />, onClick: () => setConfirmDelete(p), danger: true },
                            ]} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-[1rem] py-[0.625rem] border-t border-slate-200 bg-slate-50/50 text-[0.75rem] text-slate-500">
                  <span>{pagination.total} résultat(s) — page {pagination.page}/{pagination.totalPages}</span>
                  <div className="flex gap-[0.25rem]">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-[0.375rem] rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors">
                      <ChevronLeft className="w-[0.875rem] h-[0.875rem]" />
                    </button>
                    <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages} className="p-[0.375rem] rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors">
                      <ChevronRight className="w-[0.875rem] h-[0.875rem]" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Slide Panel — Create / Edit */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        titre={panelMode === "create" ? "Nouvelle pièce" : `Modifier — ${selectedPiece?.code}`}
        sousTitre={panelMode === "edit" ? selectedPiece?.nom : undefined}
        largeur="max-w-[34rem]"
        footer={
          <div className="flex items-center justify-end gap-[0.5rem]">
            <button onClick={() => setPanelOpen(false)} className="px-[0.875rem] py-[0.4375rem] border border-slate-300 rounded-xl text-[0.8125rem] hover:bg-slate-100 transition-colors">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.code || !form.nom} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.4375rem] bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-[0.8125rem] font-semibold transition-colors">
              {saving && <Loader2 className="w-[0.875rem] h-[0.875rem] animate-spin" />}
              {panelMode === "create" ? "Créer" : "Enregistrer"}
            </button>
          </div>
        }
      >
        <div className="space-y-[1rem]">
          {/* Section: Identification */}
          <fieldset>
            <legend className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-[0.5rem]">Identification</legend>
            <div className="grid grid-cols-2 gap-[0.5rem]">
              <Field label="Code pièce" id="code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} required placeholder="EX: RAL-001" />
              <Field label="Nom" id="nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required placeholder="Description de la pièce" />
            </div>
            <div className="mt-[0.5rem]">
              <Field label="Description" id="description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} placeholder="Détails supplémentaires…" />
            </div>
          </fieldset>

          {/* Section: Classification */}
          <fieldset>
            <legend className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-[0.5rem]">Classification</legend>
            <div className="grid grid-cols-2 gap-[0.5rem]">
              <SelectField label="Catégorie" id="catId" value={form.categoriePieceId} onChange={(v) => setForm({ ...form, categoriePieceId: v })} options={categories.map((c) => ({ value: c.id, label: c.nom }))} placeholder="Aucune" />
              <SelectField label="Unité" id="uniteId" value={form.uniteId} onChange={(v) => setForm({ ...form, uniteId: v })} options={unites.map((u) => ({ value: u.id, label: `${u.unite} (×${u.qtePar})` }))} placeholder="Aucune" />
            </div>
            <div className="grid grid-cols-2 gap-[0.5rem] mt-[0.5rem]">
              <Field label="Couleur" id="couleur" value={form.couleur} onChange={(v) => setForm({ ...form, couleur: v })} placeholder="Noir, Blanc…" />
              <SelectField label="Fournisseur principal" id="fournId" value={form.fournisseurId} onChange={(v) => setForm({ ...form, fournisseurId: v })} options={fournisseurs.map((f) => ({ value: f.id, label: f.nom }))} placeholder="Aucun" />
            </div>
          </fieldset>

          {/* Section: Inventaire */}
          <fieldset>
            <legend className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-[0.5rem]">Inventaire</legend>
            <div className="grid grid-cols-3 gap-[0.5rem]">
              <Field label="Quantité totale" id="quantite" value={form.quantite} onChange={(v) => setForm({ ...form, quantite: v })} type="number" />
              <Field label="Seuil min" id="seuilMin" value={form.seuilMin} onChange={(v) => setForm({ ...form, seuilMin: v })} type="number" />
              <Field label="Seuil max" id="seuilMax" value={form.seuilMax} onChange={(v) => setForm({ ...form, seuilMax: v })} type="number" placeholder="—" />
            </div>
            <div className="grid grid-cols-2 gap-[0.5rem] mt-[0.5rem]">
              <Field label="Empl. 1 (qté)" id="inv1" value={form.inventaireEmplacement1} onChange={(v) => setForm({ ...form, inventaireEmplacement1: v })} type="number" />
              <Field label="Empl. 2 (qté)" id="inv2" value={form.inventaireEmplacement2} onChange={(v) => setForm({ ...form, inventaireEmplacement2: v })} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-[0.5rem] mt-[0.5rem]">
              <Field label="Emplacement 1" id="empl1" value={form.emplacement} onChange={(v) => setForm({ ...form, emplacement: v })} placeholder="Magasin A" />
              <Field label="Emplacement 2" id="empl2" value={form.emplacement2} onChange={(v) => setForm({ ...form, emplacement2: v })} placeholder="Magasin B" />
            </div>
          </fieldset>

          {/* Section: Prix & Peinture */}
          <fieldset>
            <legend className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider mb-[0.5rem]">Prix & Peinture</legend>
            <div className="grid grid-cols-2 gap-[0.5rem]">
              <Field label="Prix unitaire ($)" id="prix" value={form.prixUnitaire} onChange={(v) => setForm({ ...form, prixUnitaire: v })} type="number" placeholder="0.00" />
              <Field label="Code pièce non peinte" id="codeNP" value={form.codePieceNonPeinte} onChange={(v) => setForm({ ...form, codePieceNonPeinte: v })} placeholder="REF-NP" />
            </div>
            <div className="flex gap-[1rem] mt-[0.75rem]">
              <ToggleField label="Pièce peinte" checked={form.piecePeinte} onChange={(v) => setForm({ ...form, piecePeinte: v })} />
              <ToggleField label="Active" checked={form.actif} onChange={(v) => setForm({ ...form, actif: v })} />
            </div>
          </fieldset>
        </div>
      </SlidePanel>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        titre="Supprimer cette pièce ?"
        message={`La pièce "${confirmDelete?.code} — ${confirmDelete?.nom}" sera supprimée ou désactivée si des mouvements existent.`}
        labelConfirm="Supprimer"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </div>
  );
}