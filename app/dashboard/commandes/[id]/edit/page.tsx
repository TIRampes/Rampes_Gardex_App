"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, Package, User, MapPin, Calendar, DollarSign,
  Ruler, Factory, ShoppingCart, AlertTriangle, FileText, Building2, Layers,
  ChevronDown, CheckCircle2, Info
} from "lucide-react";

// Types et constantes (mêmes que nouveau/page.tsx)
interface Client { id: string; nom: string; type: string; adresse: string; }
interface Representant { id: string; nom: string; }
interface Balcon {
  id?: string; nom: string; numeroPhase: number; piedsLineaires: number;
  poteaux: number; produit: boolean; installationTerminee: boolean; reprise: boolean;
}

const CODE_PRODUCTION_OPTIONS = [
  { value: "", label: "— Sélectionner —", symbol: "", color: "" },
  { value: "COMPLETE", label: "Complété", symbol: "✓", color: "text-green-600" },
  { value: "ATTENTE_CLIENT", label: "Attente client", symbol: "At.C", color: "text-orange-600" },
  { value: "NON_APPLICABLE", label: "Non applicable", symbol: "N/A", color: "text-gray-500" },
  { value: "PARTIEL", label: "Partiel", symbol: "P", color: "text-blue-600" },
  { value: "DOSSIER_MESUREUR", label: "Dossier mesureur", symbol: "D", color: "text-purple-600" },
  { value: "MODIFICATION", label: "Modification", symbol: "M", color: "text-yellow-600" },
  { value: "ATTENTE_CAROL_CONFIRM", label: "Attente Carol confirmation", symbol: "C-C", color: "text-pink-600" },
  { value: "ATTENTE_CAROL_MESURE", label: "Attente Carol mesure", symbol: "C-RM", color: "text-pink-600" },
  { value: "BACK_ORDER", label: "Back order", symbol: "B/O", color: "text-red-600" },
  { value: "ATTENTE_REPRESENTANT", label: "Attente représentant", symbol: "At.Rep", color: "text-indigo-600" },
];

const STATUT_ACHAT_OPTIONS = [
  { value: "", label: "— Sélectionner —", symbol: "", color: "" },
  { value: "A_FAIRE", label: "À faire", symbol: "①", color: "text-gray-600" },
  { value: "FAIT", label: "Fait", symbol: "✓", color: "text-green-600" },
  { value: "RECEPTIONNE", label: "Réceptionné", symbol: "R", color: "text-blue-600" },
  { value: "PRET_A_RAMASSER", label: "Prêt à ramasser", symbol: "P", color: "text-purple-600" },
  { value: "BACK_ORDER", label: "Back order", symbol: "B/O", color: "text-red-600" },
];

const STATUT_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "COMPLETEE", label: "Complétée" },
  { value: "ANNULEE", label: "Annulée" },
];

const TYPE_COMMANDE_OPTIONS = [
  { value: "STANDARD", label: "Standard" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MULTI_PHASE", label: "Multi-Phase" },
  { value: "MULTIPLAN", label: "Multiplan" },
];

const SERVICE_OPTIONS = [
  { value: "INSTALLATION", label: "🔧 Installation" },
  { value: "LIVRAISON", label: "🚚 Livraison" },
  { value: "CUEILLETTE", label: "📦 Cueillette" },
  { value: "TRANSPORT", label: "🚛 Transport" },
  { value: "MESURE", label: "📏 Mesure" },
];

const AVERTISSEMENT_CLIENT_OPTIONS = [
  { value: "", label: "— Aucun —", symbol: "" },
  { value: "CONF_REP", label: "Confirmé par représentant", symbol: "Conf.Rep" },
  { value: "CONF_CLIENT", label: "Confirmé par client", symbol: "Conf.Client" },
  { value: "ATT_REP_CLIENT", label: "Attente réponse", symbol: "Att.Rep.Client" },
];

const AVERTISSEMENT_MESURE_OPTIONS = [
  { value: "", label: "— Aucun —", symbol: "" },
  { value: "PRESENCE_CLIENT", label: "Présence client requise", symbol: "👤" },
  { value: "PRESENCE_REPRESENTANT", label: "Présence représentant requise", symbol: "👔" },
];

const formatDateForInput = (date?: string) => date ? new Date(date).toISOString().split("T")[0] : "";

export default function EditCommandePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("general");

  const [formData, setFormData] = useState({
    numero: "", clientId: "", representantId: "", reference: "",
    typeCommande: "STANDARD", service: "INSTALLATION", statut: "ACTIVE",
    activite: "INSTALLATION", adresse: "", nombreBalcons: 0, nombrePhases: 0,
    dateEntree: "", dateProduction: "", datePrevue: "", dateLivraison: "",
    prixVenteMateriaux: 0, prixVenteInstallation: 0,
    tempsEstimeInstallation: 0, piedsCarresFibre: 0, piedsRampesBarrotin: 0,
    piedsRampesVerre: 0, piedsRampesMurIntimite: 0, piedsRampesMainDouble: 0,
    piedsRampesGardexVision: 0, piedsRampesGardexVisionUrbaine: 0,
    piedsRampesGardexVisionOptimum: 0, piedsLineairesRampes: 0, nombrePoteaux: 0,
    structure: false, couleur: "", mesure: "", mesureDonneeLe: "", plan: "",
    envoyeProduction: "", productionTerminee: "", termine: "", livraison: "",
    enProduction: false, reprise: false,
    achatFibre: "", dateReceptionFibre: "", achatLimons: "", dateReceptionLimons: "",
    achatVerres: "", dateReceptionVerre: "", achatColonnes: "", dateReceptionColonnes: "",
    achatPeinture: "", dateReceptionPeinture: "", achatAttaches: "", dateReceptionAttaches: "",
    achatPlancherAluminium: "", dateReceptionPlancherAluminium: "",
    avertissementClient: "", avertissementPriseMesure: "", commentaire: "",
  });

  const [balcons, setBalcons] = useState<Balcon[]>([]);

  // Charger données initiales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, repsRes, commandeRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/representants"),
          fetch(`/api/commandes/${params.id}`),
        ]);

        if (clientsRes.ok) setClients(await clientsRes.json());
        if (repsRes.ok) setRepresentants(await repsRes.json());

        if (commandeRes.ok) {
          const c = await commandeRes.json();
          setFormData({
            numero: c.numero || "",
            clientId: c.clientId || "",
            representantId: c.representantId || "",
            reference: c.reference || "",
            typeCommande: c.typeCommande || "STANDARD",
            service: c.service || "INSTALLATION",
            statut: c.statut || "ACTIVE",
            activite: c.activite || "INSTALLATION",
            adresse: c.adresse || "",
            nombreBalcons: c.nombreBalcons || 0,
            nombrePhases: c.nombrePhases || 0,
            dateEntree: formatDateForInput(c.dateEntree),
            dateProduction: formatDateForInput(c.dateProduction),
            datePrevue: formatDateForInput(c.datePrevue),
            dateLivraison: formatDateForInput(c.dateLivraison),
            prixVenteMateriaux: Number(c.prixVenteMateriaux) || 0,
            prixVenteInstallation: Number(c.prixVenteInstallation) || 0,
            tempsEstimeInstallation: c.tempsEstimeInstallation || 0,
            piedsCarresFibre: c.piedsCarresFibre || 0,
            piedsRampesBarrotin: c.piedsRampesBarrotin || 0,
            piedsRampesVerre: c.piedsRampesVerre || 0,
            piedsRampesMurIntimite: c.piedsRampesMurIntimite || 0,
            piedsRampesMainDouble: c.piedsRampesMainDouble || 0,
            piedsRampesGardexVision: c.piedsRampesGardexVision || 0,
            piedsRampesGardexVisionUrbaine: c.piedsRampesGardexVisionUrbaine || 0,
            piedsRampesGardexVisionOptimum: c.piedsRampesGardexVisionOptimum || 0,
            piedsLineairesRampes: c.piedsLineairesRampes || 0,
            nombrePoteaux: c.nombrePoteaux || 0,
            structure: c.structure || false,
            couleur: c.couleur || "",
            mesure: c.mesure || "",
            mesureDonneeLe: formatDateForInput(c.mesureDonneeLe),
            plan: c.plan || "",
            envoyeProduction: c.envoyeProduction || "",
            productionTerminee: c.productionTerminee || "",
            termine: c.termine || "",
            livraison: c.livraison || "",
            enProduction: c.enProduction || false,
            reprise: c.reprise || false,
            achatFibre: c.achatFibre || "",
            dateReceptionFibre: formatDateForInput(c.dateReceptionFibre),
            achatLimons: c.achatLimons || "",
            dateReceptionLimons: formatDateForInput(c.dateReceptionLimons),
            achatVerres: c.achatVerres || "",
            dateReceptionVerre: formatDateForInput(c.dateReceptionVerre),
            achatColonnes: c.achatColonnes || "",
            dateReceptionColonnes: formatDateForInput(c.dateReceptionColonnes),
            achatPeinture: c.achatPeinture || "",
            dateReceptionPeinture: formatDateForInput(c.dateReceptionPeinture),
            achatAttaches: c.achatAttaches || "",
            dateReceptionAttaches: formatDateForInput(c.dateReceptionAttaches),
            achatPlancherAluminium: c.achatPlancherAluminium || "",
            dateReceptionPlancherAluminium: formatDateForInput(c.dateReceptionPlancherAluminium),
            avertissementClient: c.avertissementClient || "",
            avertissementPriseMesure: c.avertissementPriseMesure || "",
            commentaire: c.commentaire || "",
          });

          if (c.balcons) setBalcons(c.balcons);
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  const prixTotal = useMemo(() => (formData.prixVenteMateriaux || 0) + (formData.prixVenteInstallation || 0), [formData.prixVenteMateriaux, formData.prixVenteInstallation]);

  const updateBalcon = (index: number, field: keyof Balcon, value: number | boolean | string) => {
    setBalcons(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        prixTotal,
        balcons: balcons.length > 0 ? balcons : undefined,
        representantId: formData.representantId || null,
        mesure: formData.mesure || null,
        plan: formData.plan || null,
        envoyeProduction: formData.envoyeProduction || null,
        productionTerminee: formData.productionTerminee || null,
        termine: formData.termine || null,
        achatFibre: formData.achatFibre || null,
        achatLimons: formData.achatLimons || null,
        achatVerres: formData.achatVerres || null,
        achatColonnes: formData.achatColonnes || null,
        achatPeinture: formData.achatPeinture || null,
        achatAttaches: formData.achatAttaches || null,
        achatPlancherAluminium: formData.achatPlancherAluminium || null,
        avertissementClient: formData.avertissementClient || null,
        avertissementPriseMesure: formData.avertissementPriseMesure || null,
      };

      const res = await fetch(`/api/commandes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push(`/dashboard/commandes/${params.id}`), 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      setError("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Commande mise à jour!</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Modifier {formData.numero}</h1>
          <p className="text-sm text-gray-500">Mettre à jour la commande</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section Général */}
        <Section icon={<Package />} title="Informations générales" isOpen={activeSection === "general"} onToggle={() => setActiveSection(activeSection === "general" ? null : "general")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Numéro</label>
              <input type="text" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Client</label>
              <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                <option value="">— Sélectionner —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Représentant</label>
              <select value={formData.representantId} onChange={(e) => setFormData({ ...formData, representantId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                <option value="">— Aucun —</option>
                {representants.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                {STATUT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select value={formData.typeCommande} onChange={(e) => setFormData({ ...formData, typeCommande: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                {TYPE_COMMANDE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Service</label>
              <select value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                {SERVICE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Adresse</label>
            <textarea value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} rows={2} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.enProduction} onChange={(e) => setFormData({ ...formData, enProduction: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">En production</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.reprise} onChange={(e) => setFormData({ ...formData, reprise: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Reprise</span>
            </label>
          </div>
        </Section>

        {/* Section Dates */}
        <Section icon={<Calendar />} title="Dates et Prix" isOpen={activeSection === "dates"} onToggle={() => setActiveSection(activeSection === "dates" ? null : "dates")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-2">Date entrée</label><input type="date" value={formData.dateEntree} onChange={(e) => setFormData({ ...formData, dateEntree: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Date production</label><input type="date" value={formData.dateProduction} onChange={(e) => setFormData({ ...formData, dateProduction: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Date prévue</label><input type="date" value={formData.datePrevue} onChange={(e) => setFormData({ ...formData, datePrevue: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Date livraison</label><input type="date" value={formData.dateLivraison} onChange={(e) => setFormData({ ...formData, dateLivraison: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium mb-2">Prix matériaux ($)</label><input type="number" step="0.01" value={formData.prixVenteMateriaux} onChange={(e) => setFormData({ ...formData, prixVenteMateriaux: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Prix installation ($)</label><input type="number" step="0.01" value={formData.prixVenteInstallation} onChange={(e) => setFormData({ ...formData, prixVenteInstallation: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Prix total</label><div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl text-xl font-bold text-green-700">{prixTotal.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</div></div>
          </div>
        </Section>

        {/* Section Rampes */}
        <Section icon={<Ruler />} title="Rampes et Mesures" isOpen={activeSection === "rampes"} onToggle={() => setActiveSection(activeSection === "rampes" ? null : "rampes")}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: "Temps install. (h)", key: "tempsEstimeInstallation" },
              { label: "Pieds carrés fibre", key: "piedsCarresFibre" },
              { label: "Rampes barrotin", key: "piedsRampesBarrotin" },
              { label: "Rampes verre", key: "piedsRampesVerre" },
              { label: "Mur intimité", key: "piedsRampesMurIntimite" },
              { label: "Main double", key: "piedsRampesMainDouble" },
              { label: "Gardex Vision", key: "piedsRampesGardexVision" },
              { label: "Gardex Urbaine", key: "piedsRampesGardexVisionUrbaine" },
              { label: "Gardex Optimum", key: "piedsRampesGardexVisionOptimum" },
              { label: "Pieds linéaires", key: "piedsLineairesRampes" },
              { label: "Nombre poteaux", key: "nombrePoteaux" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-2">{f.label}</label>
                <input type="number" min="0" value={(formData[f.key as keyof typeof formData] as number) || 0} onChange={(e) => setFormData({ ...formData, [f.key]: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
              </div>
            ))}
          </div>
        </Section>

        {/* Section Production */}
        <Section icon={<Factory />} title="Production" isOpen={activeSection === "production"} onToggle={() => setActiveSection(activeSection === "production" ? null : "production")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-2">Couleur</label><input type="text" value={formData.couleur} onChange={(e) => setFormData({ ...formData, couleur: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <SymbolSelect label="Mesure" value={formData.mesure} onChange={(v) => setFormData({ ...formData, mesure: v })} options={CODE_PRODUCTION_OPTIONS} />
            <div><label className="block text-sm font-medium mb-2">Mesure donnée le</label><input type="date" value={formData.mesureDonneeLe} onChange={(e) => setFormData({ ...formData, mesureDonneeLe: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <SymbolSelect label="Plan" value={formData.plan} onChange={(v) => setFormData({ ...formData, plan: v })} options={CODE_PRODUCTION_OPTIONS} />
            <SymbolSelect label="Envoyé production" value={formData.envoyeProduction} onChange={(v) => setFormData({ ...formData, envoyeProduction: v })} options={CODE_PRODUCTION_OPTIONS} />
            <SymbolSelect label="Production terminée" value={formData.productionTerminee} onChange={(v) => setFormData({ ...formData, productionTerminee: v })} options={CODE_PRODUCTION_OPTIONS} />
            <SymbolSelect label="Terminé" value={formData.termine} onChange={(v) => setFormData({ ...formData, termine: v })} options={CODE_PRODUCTION_OPTIONS} />
            <div><label className="block text-sm font-medium mb-2">Statut livraison</label><input type="text" value={formData.livraison} onChange={(e) => setFormData({ ...formData, livraison: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
          </div>
        </Section>

        {/* Section Achats */}
        <Section icon={<ShoppingCart />} title="Achats" isOpen={activeSection === "achats"} onToggle={() => setActiveSection(activeSection === "achats" ? null : "achats")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Fibre", keyStatut: "achatFibre", keyDate: "dateReceptionFibre" },
              { label: "Limons", keyStatut: "achatLimons", keyDate: "dateReceptionLimons" },
              { label: "Verres", keyStatut: "achatVerres", keyDate: "dateReceptionVerre" },
              { label: "Colonnes", keyStatut: "achatColonnes", keyDate: "dateReceptionColonnes" },
              { label: "Peinture", keyStatut: "achatPeinture", keyDate: "dateReceptionPeinture" },
              { label: "Attaches", keyStatut: "achatAttaches", keyDate: "dateReceptionAttaches" },
              { label: "Plancher alu.", keyStatut: "achatPlancherAluminium", keyDate: "dateReceptionPlancherAluminium" },
            ].map(a => (
            <div key={a.keyStatut} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <label className="block text-sm font-semibold mb-2">{a.label}</label>
                <select value={formData[a.keyStatut as keyof typeof formData] as string} onChange={(e) => setFormData({ ...formData, [a.keyStatut]: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm mb-2">
                    {STATUT_ACHAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.symbol ? `${o.symbol} - ${o.label}` : o.label}</option>)}
                </select>
                <input type="date" value={formData[a.keyDate as keyof typeof formData] as string} onChange={(e) => setFormData({ ...formData, [a.keyDate]: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            </div>
            ))}
          </div>
        </Section>

        {/* Section Commentaires */}
        <Section icon={<FileText />} title="Commentaires" isOpen={activeSection === "commentaires"} onToggle={() => setActiveSection(activeSection === "commentaires" ? null : "commentaires")}>
          <textarea value={formData.commentaire} onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })} rows={4} placeholder="Notes et commentaires..." className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none" />
        </Section>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button type="button" onClick={() => router.back()} className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">Annuler</button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}>
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ icon, title, isOpen, onToggle, children }: { icon: React.ReactNode; title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center text-[var(--color-primary)]">{icon}</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
}

function SymbolSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string; symbol: string; color?: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
        {options.map(o => <option key={o.value} value={o.value}>{o.symbol ? `${o.symbol} - ${o.label}` : o.label}</option>)}
      </select>
    </div>
  );
}