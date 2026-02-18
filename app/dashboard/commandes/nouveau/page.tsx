"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, Package, User, MapPin, Calendar, DollarSign,
  Ruler, Factory, ShoppingCart, AlertTriangle, FileText, Plus, Trash2,
  Building2, Layers, ChevronDown, CheckCircle2, Info
} from "lucide-react";

// Types
interface Client { id: string; nom: string; type: string; adresse: string; telephone: string; }
interface Representant { id: string; nom: string; }
interface Balcon {
  nom: string; numeroPhase: number; piedsLineaires: number; poteaux: number;
  tempsInstallation: number; produit: boolean; installationTerminee: boolean;
}

// Mappings des codes de production
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

const AVERTISSEMENT_CLIENT_OPTIONS = [
  { value: "", label: "— Aucun —", symbol: "" },
  { value: "CONF_REP", label: "Confirmé par représentant", symbol: "Conf.Rep" },
  { value: "CONF_CLIENT", label: "Confirmé par client", symbol: "Conf.Client" },
  { value: "ATT_REP_CLIENT", label: "Attente réponse", symbol: "Att.Rep.Client" },
];

const AVERTISSEMENT_MESURE_OPTIONS = [
  { value: "", label: "— Aucun —", symbol: "" },
  { value: "PRESENCE_CLIENT", label: "Présence client requise", symbol: "👤 Client" },
  { value: "PRESENCE_REPRESENTANT", label: "Présence représentant requise", symbol: "👔 Rep." },
];

const TYPE_COMMANDE_OPTIONS = [
  { value: "STANDARD", label: "Standard", description: "Commande standard simple" },
  { value: "COMMERCIAL", label: "Commercial", description: "Projet commercial multi-balcons" },
  { value: "MULTI_PHASE", label: "Multi-Phase", description: "Projet en plusieurs phases" },
  { value: "MULTIPLAN", label: "Multiplan", description: "Projet avec plusieurs plans" },
];

const SERVICE_OPTIONS = [
  { value: "INSTALLATION", label: "Installation", icon: "🔧" },
  { value: "LIVRAISON", label: "Livraison", icon: "🚚" },
  { value: "CUEILLETTE", label: "Cueillette", icon: "📦" },
  { value: "TRANSPORT", label: "Transport", icon: "🚛" },
  { value: "MESURE", label: "Mesure", icon: "📏" },
];

const ACTIVITE_OPTIONS = [
  { value: "INSTALLATION", label: "Installation" },
  { value: "LIVRAISON", label: "Livraison" },
  { value: "CUEILLETTE", label: "Cueillette" },
  { value: "TRANSPORT", label: "Transport" },
];

export default function NouvelleCommandePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Général
    numero: "",
    clientId: "",
    representantId: "",
    reference: "",
    typeCommande: "STANDARD",
    service: "INSTALLATION",
    activite: "INSTALLATION",
    adresse: "",

    // Commercial / Multi-Phase / Multiplan
    nombreBalcons: 0,
    nombrePhases: 0,

    // Dates
    dateEntree: new Date().toISOString().split("T")[0],
    dateProduction: "",
    datePrevue: "",
    dateLivraison: "",

    // Prix
    prixVenteMateriaux: 0,
    prixVenteInstallation: 0,

    // Rampes
    tempsEstimeInstallation: 0,
    piedsCarresFibre: 0,
    piedsRampesBarrotin: 0,
    piedsRampesVerre: 0,
    piedsRampesMurIntimite: 0,
    piedsRampesMainDouble: 0,
    piedsRampesGardexVision: 0,
    piedsRampesGardexVisionUrbaine: 0,
    piedsRampesGardexVisionOptimum: 0,
    piedsLineairesRampes: 0,
    nombrePoteaux: 0,

    // Production
    structure: false,
    couleur: "",
    mesure: "",
    mesureDonneeLe: "",
    plan: "",
    envoyeProduction: "",
    productionTerminee: "",
    termine: "",
    livraison: "",
    enProduction: false,

    // Achats
    achatFibre: "",
    dateReceptionFibre: "",
    achatLimons: "",
    dateReceptionLimons: "",
    achatVerres: "",
    dateReceptionVerre: "",
    achatColonnes: "",
    dateReceptionColonnes: "",
    achatPeinture: "",
    dateReceptionPeinture: "",
    achatAttaches: "",
    dateReceptionAttaches: "",
    achatPlancherAluminium: "",
    dateReceptionPlancherAluminium: "",

    // Avertissements
    avertissementClient: "",
    avertissementPriseMesure: "",

    // Notes
    commentaire: "",
  });

  const [balcons, setBalcons] = useState<Balcon[]>([]);

  // Charger clients et représentants
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, repsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/representants"),
        ]);
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (repsRes.ok) setRepresentants(await repsRes.json());
      } catch (err) {
        console.error("Erreur chargement:", err);
      }
    };
    fetchData();
  }, []);

  // Calculer prix total
  const prixTotal = useMemo(() => {
    return (formData.prixVenteMateriaux || 0) + (formData.prixVenteInstallation || 0);
  }, [formData.prixVenteMateriaux, formData.prixVenteInstallation]);

  // Auto-calculer dates quand dateProduction change
  useEffect(() => {
    if (formData.dateProduction) {
      const dateProd = new Date(formData.dateProduction);
      const datePrevue = new Date(dateProd);
      datePrevue.setDate(datePrevue.getDate() - 7);
      
      setFormData(prev => ({
        ...prev,
        datePrevue: datePrevue.toISOString().split("T")[0],
        dateLivraison: datePrevue.toISOString().split("T")[0],
      }));
    }
  }, [formData.dateProduction]);

  // Générer les balcons/phases quand le nombre change
  useEffect(() => {
    const count = formData.typeCommande === "COMMERCIAL" 
      ? formData.nombreBalcons 
      : formData.nombrePhases;
    
    if (count > 0 && (formData.typeCommande !== "STANDARD")) {
      const prefix = formData.typeCommande === "COMMERCIAL" ? "Balcon" : 
                     formData.typeCommande === "MULTI_PHASE" ? "Phase" : "Plan";
      
      const newBalcons: Balcon[] = Array.from({ length: count }, (_, i) => ({
        nom: `${prefix} ${i + 1}`,
        numeroPhase: i + 1,
        piedsLineaires: 0,
        poteaux: 0,
        tempsInstallation: 0,
        produit: false,
        installationTerminee: false,
      }));
      setBalcons(newBalcons);
    } else if (formData.typeCommande === "STANDARD") {
      setBalcons([]);
    }
  }, [formData.typeCommande, formData.nombreBalcons, formData.nombrePhases]);

  // Mettre l'adresse du client sélectionné
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client && !formData.adresse) {
        setFormData(prev => ({ ...prev, adresse: client.adresse }));
      }
    }
  }, [formData.clientId, clients]);

  const updateBalcon = (index: number, field: keyof Balcon, value: number | boolean | string) => {
    setBalcons(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!formData.numero.trim()) { setError("Le numéro est obligatoire"); setLoading(false); return; }
    if (!formData.clientId) { setError("Le client est obligatoire"); setLoading(false); return; }
    if (!formData.adresse.trim()) { setError("L'adresse est obligatoire"); setLoading(false); return; }

    try {
      const dataToSend = {
        ...formData,
        prixTotal,
        balcons: balcons.length > 0 ? balcons : undefined,
        // Convertir les valeurs vides en null
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

      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/commandes"), 1500);
      } else {
        setError(data.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Commande créée!</h2>
          <p className="text-gray-500">Redirection...</p>
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Nouvelle commande</h1>
          <p className="text-sm text-gray-500">Créer une nouvelle commande</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
        <Section
          icon={<Package />}
          title="Informations générales"
          description="Numéro, client, type de commande"
          isOpen={activeSection === "general" || activeSection === null}
          onToggle={() => setActiveSection(activeSection === "general" ? null : "general")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Numéro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Numéro de commande
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="CMD-2024-001"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>

            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Client
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                <option value="">— Sélectionner un client —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            {/* Représentant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Représentant</label>
              <select
                value={formData.representantId}
                onChange={(e) => setFormData({ ...formData, representantId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                <option value="">— Aucun —</option>
                {representants.map(r => (
                  <option key={r.id} value={r.id}>{r.nom}</option>
                ))}
              </select>
            </div>

            {/* Référence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Référence</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Référence client"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                {SERVICE_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                ))}
              </select>
            </div>

            {/* Activité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activité</label>
              <select
                value={formData.activite}
                onChange={(e) => setFormData({ ...formData, activite: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                {ACTIVITE_OPTIONS.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type de commande */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Type de commande</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TYPE_COMMANDE_OPTIONS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, typeCommande: t.value, nombreBalcons: 0, nombrePhases: 0 })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.typeCommande === t.value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="font-semibold text-gray-900 dark:text-white">{t.label}</span>
                  <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre de balcons/phases selon le type */}
          {formData.typeCommande === "COMMERCIAL" && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                <Building2 className="inline w-4 h-4 mr-1" /> Nombre de balcons
              </label>
              <input
                type="number"
                min="0"
                value={formData.nombreBalcons}
                onChange={(e) => setFormData({ ...formData, nombreBalcons: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-xl"
              />
            </div>
          )}

          {(formData.typeCommande === "MULTI_PHASE" || formData.typeCommande === "MULTIPLAN") && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                <Layers className="inline w-4 h-4 mr-1" /> 
                Nombre de {formData.typeCommande === "MULTI_PHASE" ? "phases" : "plans"}
              </label>
              <input
                type="number"
                min="0"
                value={formData.nombrePhases}
                onChange={(e) => setFormData({ ...formData, nombrePhases: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-2 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 rounded-xl"
              />
            </div>
          )}

          {/* Tableau des balcons/phases */}
          {balcons.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {formData.typeCommande === "COMMERCIAL" ? "Balcon" : formData.typeCommande === "MULTI_PHASE" ? "Phase" : "Plan"}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Pieds linéaires</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Poteaux</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Temps installation</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">Produit</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">Installé</th>
                  </tr>
                </thead>
                <tbody>
                  {balcons.map((b, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={b.nom}
                          onChange={(e) => updateBalcon(i, "nom", e.target.value)}
                          className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={b.piedsLineaires}
                          onChange={(e) => updateBalcon(i, "piedsLineaires", parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={b.poteaux}
                          onChange={(e) => updateBalcon(i, "poteaux", parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={b.tempsInstallation}
                          onChange={(e) => updateBalcon(i, "tempsInstallation", parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={b.produit}
                          onChange={(e) => updateBalcon(i, "produit", e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={b.installationTerminee}
                          onChange={(e) => updateBalcon(i, "installationTerminee", e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2">{balcons.reduce((sum, b) => sum + b.piedsLineaires, 0)}</td>
                    <td className="px-3 py-2">{balcons.reduce((sum, b) => sum + b.poteaux, 0)}</td>
                    <td className="px-3 py-2">{balcons.reduce((sum, b) => sum + b.tempsInstallation, 0)}h</td>
                    <td className="px-3 py-2 text-center">{balcons.filter(b => b.produit).length}/{balcons.length}</td>
                    <td className="px-3 py-2 text-center">{balcons.filter(b => b.installationTerminee).length}/{balcons.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Adresse */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="text-red-500">*</span> Adresse d'installation
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3 text-gray-400" size={20} />
              <textarea
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Adresse complète"
                rows={2}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none"
              />
            </div>
          </div>
        </Section>

        {/* SECTION 2: DATES ET PRIX */}
        <Section
          icon={<Calendar />}
          title="Dates et Prix"
          description="Planning et tarification"
          isOpen={activeSection === "dates"}
          onToggle={() => setActiveSection(activeSection === "dates" ? null : "dates")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date d'entrée</label>
              <input
                type="date"
                value={formData.dateEntree}
                onChange={(e) => setFormData({ ...formData, dateEntree: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date de production</label>
              <input
                type="date"
                value={formData.dateProduction}
                onChange={(e) => setFormData({ ...formData, dateProduction: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date prévue / Livraison
                <Info className="inline w-4 h-4 ml-1 text-gray-400"  />
              </label>
              <input
                type="date"
                value={formData.datePrevue}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semaine prévue
              </label>
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 font-semibold">
                {formData.datePrevue ? `S${Math.ceil(((new Date(formData.datePrevue).getTime() - new Date(new Date(formData.datePrevue).getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}` : "—"}
              </div>
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix vente matériaux ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3 text-gray-400" size={20} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.prixVenteMateriaux}
                  onChange={(e) => setFormData({ ...formData, prixVenteMateriaux: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix vente installation ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3 text-gray-400" size={20} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.prixVenteInstallation}
                  onChange={(e) => setFormData({ ...formData, prixVenteInstallation: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix total ($)</label>
              <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {prixTotal.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION 3: RAMPES ET MESURES */}
        <Section
          icon={<Ruler />}
          title="Rampes et Mesures"
          description="Dimensions et quantités"
          isOpen={activeSection === "rampes"}
          onToggle={() => setActiveSection(activeSection === "rampes" ? null : "rampes")}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <InputField label="Temps installation (h)" value={formData.tempsEstimeInstallation} onChange={(v) => setFormData({ ...formData, tempsEstimeInstallation: v })} />
            <InputField label="Pieds carrés fibre" value={formData.piedsCarresFibre} onChange={(v) => setFormData({ ...formData, piedsCarresFibre: v })} />
            <InputField label="Pieds rampes barrotin" value={formData.piedsRampesBarrotin} onChange={(v) => setFormData({ ...formData, piedsRampesBarrotin: v })} />
            <InputField label="Pieds rampes verre" value={formData.piedsRampesVerre} onChange={(v) => setFormData({ ...formData, piedsRampesVerre: v })} />
            <InputField label="Pieds mur intimité" value={formData.piedsRampesMurIntimite} onChange={(v) => setFormData({ ...formData, piedsRampesMurIntimite: v })} />
            <InputField label="Pieds main double" value={formData.piedsRampesMainDouble} onChange={(v) => setFormData({ ...formData, piedsRampesMainDouble: v })} />
            <InputField label="Pieds Gardex Vision" value={formData.piedsRampesGardexVision} onChange={(v) => setFormData({ ...formData, piedsRampesGardexVision: v })} />
            <InputField label="Pieds Gardex Urbaine" value={formData.piedsRampesGardexVisionUrbaine} onChange={(v) => setFormData({ ...formData, piedsRampesGardexVisionUrbaine: v })} />
            <InputField label="Pieds Gardex Optimum" value={formData.piedsRampesGardexVisionOptimum} onChange={(v) => setFormData({ ...formData, piedsRampesGardexVisionOptimum: v })} />
            <InputField label="Pieds linéaires total" value={formData.piedsLineairesRampes} onChange={(v) => setFormData({ ...formData, piedsLineairesRampes: v })} />
            <InputField label="Nombre de poteaux" value={formData.nombrePoteaux} onChange={(v) => setFormData({ ...formData, nombrePoteaux: v })} />
          </div>
        </Section>

        {/* SECTION 4: PRODUCTION */}
        <Section
          icon={<Factory />}
          title="Production"
          description="Suivi de la production"
          isOpen={activeSection === "production"}
          onToggle={() => setActiveSection(activeSection === "production" ? null : "production")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur</label>
              <input
                type="text"
                value={formData.couleur}
                onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                placeholder="Ex: Blanc, Noir, Bronze..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>

            <SymbolSelect
              label="Mesure"
              value={formData.mesure}
              onChange={(v) => setFormData({ ...formData, mesure: v })}
              options={CODE_PRODUCTION_OPTIONS}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mesure donnée le</label>
              <input
                type="date"
                value={formData.mesureDonneeLe}
                onChange={(e) => setFormData({ ...formData, mesureDonneeLe: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>

            <SymbolSelect
              label="Plan"
              value={formData.plan}
              onChange={(v) => setFormData({ ...formData, plan: v })}
              options={CODE_PRODUCTION_OPTIONS}
            />

            <SymbolSelect
              label="Envoyé production"
              value={formData.envoyeProduction}
              onChange={(v) => setFormData({ ...formData, envoyeProduction: v })}
              options={CODE_PRODUCTION_OPTIONS}
            />

            <SymbolSelect
              label="Production terminée"
              value={formData.productionTerminee}
              onChange={(v) => setFormData({ ...formData, productionTerminee: v })}
              options={CODE_PRODUCTION_OPTIONS}
            />

            <SymbolSelect
              label="Terminé"
              value={formData.termine}
              onChange={(v) => setFormData({ ...formData, termine: v })}
              options={CODE_PRODUCTION_OPTIONS}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut livraison</label>
              <input
                type="text"
                value={formData.livraison}
                onChange={(e) => setFormData({ ...formData, livraison: e.target.value })}
                placeholder="Ex: En cours, Livré..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                id="enProduction"
                checked={formData.enProduction}
                onChange={(e) => setFormData({ ...formData, enProduction: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="enProduction" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                En production
              </label>
            </div>
          </div>
        </Section>

        {/* SECTION 5: ACHATS */}
        <Section
          icon={<ShoppingCart />}
          title="Achats"
          description="Suivi des commandes fournisseurs"
          isOpen={activeSection === "achats"}
          onToggle={() => setActiveSection(activeSection === "achats" ? null : "achats")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AchatField label="Fibre" value={formData.achatFibre} date={formData.dateReceptionFibre}
              onChange={(v) => setFormData({ ...formData, achatFibre: v })}
              onDateChange={(v) => setFormData({ ...formData, dateReceptionFibre: v })} />
            <AchatField label="Limons" value={formData.achatLimons} date={formData.dateReceptionLimons}
              onChange={(v) => setFormData({ ...formData, achatLimons: v })}
              onDateChange={(v) => setFormData({ ...formData, dateReceptionLimons: v })} />
            <AchatField label="Verres" value={formData.achatVerres} date={formData.dateReceptionVerre}
              onChange={(v) => setFormData({ ...formData, achatVerres: v })}
              onDateChange={(v) => setFormData({ ...formData, dateReceptionVerre: v })} />
            <AchatField label="Colonnes" value={formData.achatColonnes} date={formData.dateReceptionColonnes}
              onChange={(v) => setFormData({ ...formData, achatColonnes: v })}
              onDateChange={(v) => setFormData({ ...formData, dateReceptionColonnes: v })} />
            <AchatField label="Peinture" value={formData.achatPeinture} date={formData.dateReceptionPeinture}
              onChange={(v) => setFormData({ ...formData, achatPeinture: v })}
              onDateChange={(v) => setFormData({ ...formData, dateReceptionPeinture: v })} />
            <AchatField label="Attaches" value={formData.achatAttaches} date={formData.dateReceptionAttaches}
              onChange={(v) => setFormData({ ...formData, achatAttaches: v })}
              onDateChange={(v) => setFormData({ ...formData, dateReceptionAttaches: v })} />
            <AchatField label="Plancher aluminium" value={formData.achatPlancherAluminium} date={formData.dateReceptionPlancherAluminium}
              onChange={(v) => setFormData({ ...formData, achatPlancherAluminium: v })}
              onDateChange={(v) => setFormData({ ...formData, dateReceptionPlancherAluminium: v })} />
          </div>
        </Section>

        {/* SECTION 6: AVERTISSEMENTS */}
        <Section
          icon={<AlertTriangle />}
          title="Avertissements"
          description="Notifications et alertes"
          isOpen={activeSection === "avertissements"}
          onToggle={() => setActiveSection(activeSection === "avertissements" ? null : "avertissements")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SymbolSelect
              label="Avertissement client"
              value={formData.avertissementClient}
              onChange={(v) => setFormData({ ...formData, avertissementClient: v })}
              options={AVERTISSEMENT_CLIENT_OPTIONS}
            />
            <SymbolSelect
              label="Avertissement prise de mesure"
              value={formData.avertissementPriseMesure}
              onChange={(v) => setFormData({ ...formData, avertissementPriseMesure: v })}
              options={AVERTISSEMENT_MESURE_OPTIONS}
            />
          </div>
        </Section>

        {/* SECTION 7: COMMENTAIRES */}
        <Section
          icon={<FileText />}
          title="Commentaires"
          description="Notes et remarques"
          isOpen={activeSection === "commentaires"}
          onToggle={() => setActiveSection(activeSection === "commentaires" ? null : "commentaires")}
        >
          <textarea
            value={formData.commentaire}
            onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
            placeholder="Ajoutez vos notes et commentaires ici..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none"
          />
        </Section>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3.5 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Créer la commande
          </button>
        </div>
      </form>
    </div>
  );
}

// Composant Section collapsible
function Section({ icon, title, description, isOpen, onToggle, children }: {
  icon: React.ReactNode; title: string; description: string;
  isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center text-[var(--color-primary)]">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="p-4 sm:p-5 pt-0 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
}

// Composant InputField numérique
function InputField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <input
        type="number"
        min="0"
        value={value || ""}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
      />
    </div>
  );
}

// Composant Select avec symboles
function SymbolSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string; symbol: string; color?: string }[];
}) {
  const selected = options.find(o => o.value === value);
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl appearance-none pr-10"
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.symbol ? `${o.symbol} - ${o.label}` : o.label}
            </option>
          ))}
        </select>
        {selected && selected.symbol && (
          <span className={`absolute right-10 top-1/2 -translate-y-1/2 font-bold ${selected.color || ""}`}>
            {selected.symbol}
          </span>
        )}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// Composant Achat avec statut et date
function AchatField({ label, value, date, onChange, onDateChange }: {
  label: string; value: string; date: string;
  onChange: (v: string) => void; onDateChange: (v: string) => void;
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{label}</label>
      <div className="space-y-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        >
          {STATUT_ACHAT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.symbol ? `${o.symbol} - ${o.label}` : o.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          placeholder="Date réception"
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        />
      </div>
    </div>
  );
}