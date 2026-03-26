// app/components/commandes/PurchaseSection.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Download } from "lucide-react";

export interface Fournisseur {
  id: string; nom: string; email?: string; telephone?: string;
  typeAchat?: string; formulaireNom?: string | null;
}

export interface PurchaseItem {
  id: string; phaseNumero?: number; typeAchat: string;
  supplierId: string; supplierName: string; statut: string;
  dateEnvoie: string; dateReception: string; quantiteNonRecue: number;
  formValues: Record<string, any>; notes: string;
}

const TYPE_ACHAT_OPTIONS = [
  { value: "FIBRE", label: "Fibre" }, { value: "LIMONS", label: "Limons" },
  { value: "VERRES", label: "Verres" }, { value: "COLONNES", label: "Colonnes" },
  { value: "PEINTURE", label: "Peinture" }, { value: "ATTACHES", label: "Attaches" },
  { value: "PLANCHER_ALUMINIUM", label: "Plancher aluminium" },
  { value: "EUROFORGINGS", label: "EuroForgings" }, { value: "PEINTURE_DJ", label: "Peinture DJ" },
  { value: "VERRE_LEPAGE", label: "Verre Lepage" }, { value: "AUTRE", label: "Autre" },
  { value: "STRUCTURE", label: "Structure d'achat" },
];

const STATUT_ACHAT_OPTIONS = [
  { value: "", label: "— Sélectionner —", symbol: "" },
  { value: "A_FAIRE", label: "À faire", symbol: "①" },
  { value: "FAIT", label: "Fait", symbol: "✓" },
  { value: "RECEPTIONNE", label: "Réceptionné", symbol: "R" },
  { value: "PRET_A_RAMASSER", label: "Prêt à ramasser", symbol: "P" },
  { value: "BACK_ORDER", label: "Back order", symbol: "B/O" },
];

interface Props {
  purchases: PurchaseItem[];
  setPurchases: React.Dispatch<React.SetStateAction<PurchaseItem[]>>;
  balcons: { nom: string; numeroPhase: number }[];
  allFournisseurs: Fournisseur[];
}

export default function PurchaseSection({ purchases, setPurchases, balcons, allFournisseurs }: Props) {
  const [cache, setCache] = useState<Record<string, Fournisseur[]>>({});
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const fetchForType = useCallback(async (type: string) => {
    if (type === "STRUCTURE" || type === "AUTRE" || cache[type]) return;
    setLoadingType(type);
    try {
      const res = await fetch(`/api/fournisseurs?typeAchat=${type}&actif=true`);
      if (res.ok) { const d = await res.json(); setCache(p => ({ ...p, [type]: d })); }
    } catch {} finally { setLoadingType(null); }
  }, [cache]);

  useEffect(() => {
    const types = [...new Set(purchases.map(p => p.typeAchat).filter(t => t !== "STRUCTURE" && t !== "AUTRE"))];
    types.forEach(t => fetchForType(t));
  }, []); // eslint-disable-line

  const add = () => {
    setPurchases(p => [...p, { id: Date.now().toString(), phaseNumero: balcons[0]?.numeroPhase || 0, typeAchat: "FIBRE", supplierId: "", supplierName: "", statut: "A_FAIRE", dateEnvoie: "", dateReception: "", quantiteNonRecue: 0, formValues: {}, notes: "" }]);
    fetchForType("FIBRE");
  };
  const upd = (i: number, f: keyof PurchaseItem, v: any) => setPurchases(p => p.map((x, j) => j === i ? { ...x, [f]: v } : x));
  const del = (i: number) => setPurchases(p => p.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Achats ({purchases.length})</h4>
        <button type="button" onClick={add} className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm"><Plus size={16} />Ajouter</button>
      </div>
      {purchases.map((p, idx) => {
        const isSt = p.typeAchat === "STRUCTURE";
        const list = cache[p.typeAchat] || allFournisseurs;
        const sel = list.find(f => f.id === p.supplierId);
        return (
          <div key={p.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select value={p.typeAchat} onChange={e => { upd(idx, "typeAchat", e.target.value); upd(idx, "supplierId", ""); upd(idx, "supplierName", ""); fetchForType(e.target.value); }} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm">
                    {TYPE_ACHAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phase / Balcon</label>
                  <select value={p.phaseNumero ?? 0} onChange={e => upd(idx, "phaseNumero", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm">
                    <option value={0}>— Global —</option>
                    {balcons.map(b => <option key={b.numeroPhase} value={b.numeroPhase}>{b.nom}</option>)}
                  </select>
                </div>
                {!isSt && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fournisseur {loadingType === p.typeAchat && <span className="text-blue-500">(…)</span>}</label>
                    <select value={p.supplierId} onChange={e => { const f = list.find(x => x.id === e.target.value); upd(idx, "supplierId", e.target.value); upd(idx, "supplierName", f?.nom || ""); }} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm">
                      <option value="">— Sélectionner —</option>
                      {list.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => del(idx)} className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
            {sel?.formulaireNom && (
              <a href={`/api/fournisseurs/${p.supplierId}/formulaire`} download className="mb-3 inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"><Download size={16} />Télécharger : {sel.formulaireNom}</a>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div><label className="block text-xs text-gray-500 mb-1">Statut</label><select value={p.statut} onChange={e => upd(idx, "statut", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm">{STATUT_ACHAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.symbol} {o.label}</option>)}</select></div>
              <div><label className="block text-xs text-gray-500 mb-1">Date envoi</label><input type="date" value={p.dateEnvoie} onChange={e => upd(idx, "dateEnvoie", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Date réception</label><input type="date" value={p.dateReception} onChange={e => upd(idx, "dateReception", e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Qté non reçue</label><input type="number" min={0} value={p.quantiteNonRecue} onChange={e => upd(idx, "quantiteNonRecue", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" /></div>
            </div>
            {isSt && <div className="mt-3"><label className="block text-xs text-gray-500 mb-1">Nom structure</label><input type="text" value={p.formValues?.nom || ""} onChange={e => upd(idx, "formValues", { ...p.formValues, nom: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" /></div>}
            <div className="mt-3"><label className="block text-xs text-gray-500 mb-1">Notes</label><textarea value={p.notes} onChange={e => upd(idx, "notes", e.target.value)} rows={2} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm resize-none" /></div>
          </div>
        );
      })}
    </div>
  );
}

export function purchasesToApiData(purchases: PurchaseItem[]) {
  return {
    achatsPhase: purchases.filter(p => p.typeAchat !== "STRUCTURE").map(p => ({
      phaseNumero: p.phaseNumero || 0, typeAchat: p.typeAchat, statut: p.statut || "A_FAIRE",
      dateEnvoie: p.dateEnvoie || null, dateReception: p.dateReception || null,
      quantiteNonRecue: p.quantiteNonRecue || 0, notes: p.notes || null,
      codeProduit: p.formValues?.codeProduit || null, description: p.formValues?.description || null,
      quantite: p.formValues?.quantite || null, prixUnitaire: p.formValues?.prixUnitaire || null,
      couleur: p.formValues?.couleur || null, epaisseur: p.formValues?.epaisseur || null,
      typeVerre: p.formValues?.typeVerre || null, longueur: p.formValues?.longueur || null,
      hauteur: p.formValues?.hauteur || null,
      details: { ...p.formValues, fournisseurId: p.supplierId || null, fournisseurNom: p.supplierName || null },
    })),
    structuresAchat: purchases.filter(p => p.typeAchat === "STRUCTURE").map(p => ({
      nom: p.formValues?.nom || "Structure", statutAchat: p.statut || "A_FAIRE",
      dateEnvoie: p.dateEnvoie || null, dateReception: p.dateReception || null,
      quantiteNonRecue: p.quantiteNonRecue || 0, phase: p.phaseNumero || null,
    })),
  };
}

export function apiDataToPurchases(achatPhases: any[], structuresAchat: any[]): PurchaseItem[] {
  const fmt = (d: any) => d ? new Date(d).toISOString().split("T")[0] : "";
  const items: PurchaseItem[] = [];
  (achatPhases || []).forEach((a: any) => items.push({
    id: a.id || String(Date.now() + Math.random()), phaseNumero: a.phaseNumero, typeAchat: a.typeAchat,
    supplierId: a.details?.fournisseurId || "", supplierName: a.details?.fournisseurNom || "",
    statut: a.statut || "A_FAIRE", dateEnvoie: fmt(a.dateEnvoie), dateReception: fmt(a.dateReception),
    quantiteNonRecue: a.quantiteNonRecue || 0, notes: a.notes || "",
    formValues: { codeProduit: a.codeProduit, description: a.description, quantite: a.quantite, prixUnitaire: a.prixUnitaire, couleur: a.couleur, epaisseur: a.epaisseur, typeVerre: a.typeVerre, longueur: a.longueur, hauteur: a.hauteur, ...(a.details || {}) },
  }));
  (structuresAchat || []).forEach((s: any) => items.push({
    id: s.id || String(Date.now() + Math.random()), phaseNumero: s.phase || 0, typeAchat: "STRUCTURE",
    supplierId: "", supplierName: "", statut: s.statutAchat || "A_FAIRE",
    dateEnvoie: fmt(s.dateEnvoie), dateReception: fmt(s.dateReception),
    quantiteNonRecue: s.quantiteNonRecue || 0, formValues: { nom: s.nom }, notes: "",
  }));
  return items;
}