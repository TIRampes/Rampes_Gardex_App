"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, Package, User, MapPin, Calendar, DollarSign,
  Ruler, Factory, ShoppingCart, AlertTriangle, FileText, Plus, Trash2,
  Building2, Layers, ChevronDown, CheckCircle2, Info, Paintbrush,
  Truck, Wrench, Clock, MessageCircle, RefreshCw, Hash
} from "lucide-react";

// Types
interface Client { id: string; nom: string; type: string; adresse: string; telephone: string; }
interface Representant { id: string; nom: string; }
interface Balcon {
  id?: string;
  nom: string; 
  numeroPhase: number; 
  piedsLineaires: number; 
  poteaux: number;
  coutBalcon: number;
  prixTotal: number;
  produit: boolean; 
  installationTerminee: boolean;
  reprise: boolean;
  notes?: string;
}
interface StructureAchat {
  id?: string;
  nom: string;
  statutAchat: string;
  dateEnvoie?: string;
  dateReception?: string;
  quantiteNonRecue?: number;
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
];

// Options de couleur
const COULEUR_OPTIONS = [
  { value: "", label: "— Sélectionner —" },
  { value: "NOIR", label: "Noir", bg: "bg-gray-900", text: "text-white" },
  { value: "BLANC", label: "Blanc", bg: "bg-gray-100", text: "text-gray-900" },
  { value: "BRUN_COMMERCIALE", label: "Brun commerciale", bg: "bg-amber-800", text: "text-white" },
  { value: "GRIS_CHARBON", label: "Gris charbon", bg: "bg-gray-700", text: "text-white" },
  { value: "ARGILE", label: "Argile", bg: "bg-amber-200", text: "text-amber-900" },
  { value: "SPECIALE", label: "Spéciale", bg: "bg-purple-600", text: "text-white" },
  { value: "GRIS_METALLIQUE", label: "Gris métallique", bg: "bg-gray-400", text: "text-gray-900" },
  { value: "AUTRE", label: "Autre", bg: "bg-blue-400", text: "text-white" },
];

// Options pour statut livraison
const STATUT_LIVRAISON_OPTIONS = [
  { value: "N_A", label: "N/A" },
  { value: "LIVRE", label: "Livré" },
];

// Facteurs pour pieds linéaires
const PIEDS_LINEAIRES_FACTEURS = [
  { key: "piedsLineairesBarrotin", label: "Barrotin", facteur: 1.25 },
  { key: "piedsLineairesVerre", label: "Verre", facteur: 1 },
  { key: "piedsLineairesMur", label: "Mur", facteur: 4 },
  { key: "piedsLineairesMainDouble", label: "Main double", facteur: 2.25 },
  { key: "piedsLineairesGardexVision", label: "Gardex Vision", facteur: 1 },
  { key: "piedsLineairesGardexUrbaine", label: "Gardex Urbaine", facteur: 2 },
  { key: "piedsLineairesGardexOptimum", label: "Gardex Optimum", facteur: 0.75 },
];

export default function NouvelleCommandePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("general");
  const [config, setConfig] = useState({ coutHeureInstallation: 160, facteurTempsInstallation: 0.7 });

  // Form data
  const [formData, setFormData] = useState({
    // Général
    numero: "",
    clientId: "",
    representantId: "",
    reference: "",
    typeCommande: "STANDARD",
    service: "INSTALLATION",
    adresse: "",
    commentaireAdresse: "",

    // Couleur
    couleur: "",
    couleurPersonnalisee: "",

    // Reprise
    reprise: false,
    ancienneCommandeNumero: "",

    // Commercial / Multi-Phase / Multiplan
    nombreBalcons: 0,
    nombrePhases: 0,
    piedsLineairesEstime: 0,
    piedsLineairesReels: 0,

    // Dates
    dateEntree: new Date().toISOString().split("T")[0],
    dateProduction: "",
    datePrevue: "",
    datePriseMesure: "",
    dateLivraison: "",

    // Prix
    prixTotal: 0,
    prixVenteInstallation: 0,
    prixVenteMateriaux: 0, // sera calculé automatiquement

    // Pieds linéaires par type
    piedsLineairesBarrotin: 0,
    piedsLineairesVerre: 0,
    piedsLineairesMur: 0,
    piedsLineairesMainDouble: 0,
    piedsLineairesGardexVision: 0,
    piedsLineairesGardexUrbaine: 0,
    piedsLineairesGardexOptimum: 0,
    nombrePoteaux: 0,

    // Anciens champs pour compatibilité
    tempsEstimeInstallation: 0,
    piedsCarresFibre: 0,
    piedsRampesBarrotin: 0,
    piedsRampesVerre: 0,
    piedsRampesMurIntimite: 0,
    piedsRampesMainDouble: 0,
    piedsRampesGardexVision: 0,
    piedsRampesGardexVisionUrbaine: 0,
    piedsRampesGardexVisionOptimum: 0,

    // Temps installation auto
    utiliserCalculAuto: false,

    // Production
    structure: false,
    mesure: "",
    mesureDonneeLe: "",
    plan: "",
    envoyeProduction: "",
    productionTerminee: "",
    termine: "",
    statutLivraison: "N_A",
    installation: "",

    // Achats avec nouveaux champs
    achatFibre: "",
    dateEnvoieFibre: "",
    dateReceptionFibre: "",
    quantiteNonRecueFibre: 0,

    achatLimons: "",
    dateEnvoieLimons: "",
    dateReceptionLimons: "",
    quantiteNonRecueLimons: 0,

    achatVerres: "",
    dateEnvoieVerres: "",
    dateReceptionVerre: "",
    quantiteNonRecueVerres: 0,

    achatColonnes: "",
    dateEnvoieColonnes: "",
    dateReceptionColonnes: "",
    quantiteNonRecueColonnes: 0,

    achatPeinture: "",
    dateEnvoiePeinture: "",
    dateReceptionPeinture: "",
    quantiteNonRecuePeinture: 0,

    achatAttaches: "",
    dateEnvoieAttaches: "",
    dateReceptionAttaches: "",
    quantiteNonRecueAttaches: 0,

    achatPlancherAluminium: "",
    dateEnvoiePlancherAluminium: "",
    dateReceptionPlancherAluminium: "",
    quantiteNonRecuePlancherAluminium: 0,

    // Avertissements
    avertissementClient: "",
    avertissementPriseMesure: "",

    // Commentaire (dans infos générales)
    commentaire: "",
  });

  const [balcons, setBalcons] = useState<Balcon[]>([]);
  const [structuresAchat, setStructuresAchat] = useState<StructureAchat[]>([]);
  const [showStructureForm, setShowStructureForm] = useState(false);

  // Charger clients, représentants et config
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, repsRes, configRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/representants"),
          fetch("/api/configurations"),
        ]);
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (repsRes.ok) setRepresentants(await repsRes.json());
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig({
            coutHeureInstallation: configData.coutHeureInstallation || 160,
            facteurTempsInstallation: configData.facteurTempsInstallation || 0.7,
          });
        }
      } catch (err) {
        console.error("Erreur chargement:", err);
      }
    };
    fetchData();
  }, []);

  // Calculer prix matériaux = prix total - prix installation
  useEffect(() => {
    const materiaux = Math.max(0, (formData.prixTotal || 0) - (formData.prixVenteInstallation || 0));
    setFormData(prev => ({ ...prev, prixVenteMateriaux: materiaux }));
  }, [formData.prixTotal, formData.prixVenteInstallation]);

  // Calculer date production = date prévue - 7 jours
  useEffect(() => {
    if (formData.datePrevue) {
      const datePrev = new Date(formData.datePrevue);
      const dateProd = new Date(datePrev);
      dateProd.setDate(dateProd.getDate() - 7);
      setFormData(prev => ({
        ...prev,
        dateProduction: dateProd.toISOString().split("T")[0],
        dateLivraison: prev.datePrevue, // livraison = date prévue (inchangé)
      }));
    } else {
      setFormData(prev => ({ ...prev, dateProduction: "", dateLivraison: "" }));
    }
  }, [formData.datePrevue]);

  // Calculer les pieds linéaires totaux avec facteurs
  const piedsLineairesTotaux = useMemo(() => {
    let total = 0;
    total += (formData.piedsLineairesBarrotin || 0) * 1.25;
    total += (formData.piedsLineairesVerre || 0) * 1;
    total += (formData.piedsLineairesMur || 0) * 4;
    total += (formData.piedsLineairesMainDouble || 0) * 2.25;
    total += (formData.piedsLineairesGardexVision || 0) * 1;
    total += (formData.piedsLineairesGardexUrbaine || 0) * 2;
    total += (formData.piedsLineairesGardexOptimum || 0) * 0.75;
    return Math.round(total * 100) / 100;
  }, [
    formData.piedsLineairesBarrotin,
    formData.piedsLineairesVerre,
    formData.piedsLineairesMur,
    formData.piedsLineairesMainDouble,
    formData.piedsLineairesGardexVision,
    formData.piedsLineairesGardexUrbaine,
    formData.piedsLineairesGardexOptimum,
  ]);

  // Calculer le temps d'installation auto (utilisé quand la checkbox est cochée)
  const tempsInstallationCalcule = useMemo(() => {
    if (formData.prixVenteInstallation <= 0) return 0;
    return (formData.prixVenteInstallation / config.coutHeureInstallation) * config.facteurTempsInstallation;
  }, [formData.prixVenteInstallation, config]);

  // Appliquer le calcul auto si la case est cochée
  useEffect(() => {
    if (formData.utiliserCalculAuto) {
      setFormData(prev => ({ ...prev, tempsEstimeInstallation: tempsInstallationCalcule }));
    }
  }, [formData.utiliserCalculAuto, tempsInstallationCalcule]);

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
        coutBalcon: 0,
        prixTotal: 0,
        produit: false,
        installationTerminee: false,
        reprise: false,
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

  const addStructure = () => {
    setStructuresAchat(prev => [
      ...prev,
      {
        nom: `Structure ${prev.length + 1}`,
        statutAchat: "A_FAIRE",
        dateEnvoie: "",
        dateReception: "",
        quantiteNonRecue: 0,
      },
    ]);
  };

  const updateStructure = (index: number, field: keyof StructureAchat, value: any) => {
    setStructuresAchat(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeStructure = (index: number) => {
    setStructuresAchat(prev => prev.filter((_, i) => i !== index));
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
        prixTotal: formData.prixTotal,
        piedsLineairesRampes: piedsLineairesTotaux,
        balcons: balcons.length > 0 ? balcons : undefined,
        structuresAchat: structuresAchat.length > 0 ? structuresAchat : undefined,
        // Convertir les valeurs vides en null
        representantId: formData.representantId || null,
        couleur: formData.couleur || null,
        couleurPersonnalisee: formData.couleur === "AUTRE" ? formData.couleurPersonnalisee : null,
        mesure: formData.mesure || null,
        plan: formData.plan || null,
        envoyeProduction: formData.envoyeProduction || null,
        productionTerminee: formData.productionTerminee || null,
        termine: formData.termine || null,
        installation: formData.installation || null,
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

            {/* Couleur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur</label>
              <select
                value={formData.couleur}
                onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                {COULEUR_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Couleur personnalisée si AUTRE */}
            {formData.couleur === "AUTRE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Couleur personnalisée
                </label>
                <input
                  type="text"
                  value={formData.couleurPersonnalisee}
                  onChange={(e) => setFormData({ ...formData, couleurPersonnalisee: e.target.value })}
                  placeholder="Entrez la couleur"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            )}
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

          {/* Reprise */}
          <div className="mt-4">
            <label className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <input
                type="checkbox"
                checked={formData.reprise}
                onChange={(e) => setFormData({ ...formData, reprise: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Cette commande est une reprise
              </span>
            </label>
          </div>

          {/* Numéro ancienne commande si reprise */}
          {formData.reprise && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numéro de l'ancienne commande
              </label>
              <input
                type="text"
                value={formData.ancienneCommandeNumero}
                onChange={(e) => setFormData({ ...formData, ancienneCommandeNumero: e.target.value })}
                placeholder="CMD-2024-001"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
          )}

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
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Coût</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Prix total</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">Produit</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">Installé</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">Reprise</th>
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
                          value={b.coutBalcon}
                          onChange={(e) => updateBalcon(i, "coutBalcon", parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={b.prixTotal}
                          onChange={(e) => updateBalcon(i, "prixTotal", parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
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
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={b.reprise}
                          onChange={(e) => updateBalcon(i, "reprise", e.target.checked)}
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
                    <td className="px-3 py-2">{balcons.reduce((sum, b) => sum + b.coutBalcon, 0)} $</td>
                    <td className="px-3 py-2">{balcons.reduce((sum, b) => sum + b.prixTotal, 0)} $</td>
                    <td className="px-3 py-2 text-center">{balcons.filter(b => b.produit).length}/{balcons.length}</td>
                    <td className="px-3 py-2 text-center">{balcons.filter(b => b.installationTerminee).length}/{balcons.length}</td>
                    <td className="px-3 py-2 text-center">{balcons.filter(b => b.reprise).length}/{balcons.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Adresse avec commentaire */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="text-red-500">*</span> Adresse
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Rechercher une adresse..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
          </div>

          {/* Commentaire adresse */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commentaire pour l'adresse
            </label>
            <input
              type="text"
              value={formData.commentaireAdresse}
              onChange={(e) => setFormData({ ...formData, commentaireAdresse: e.target.value })}
              placeholder="Ex: Sonner à la porte 2, code: 1234..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
            />
          </div>

          {/* Commentaire général */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commentaire général
            </label>
            <textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder="Notes et remarques générales..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none"
            />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Date prévue
              </label>
              <input
                type="date"
                value={formData.datePrevue}
                onChange={(e) => setFormData({ ...formData, datePrevue: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de production (auto)
              </label>
              <input
                type="date"
                value={formData.dateProduction}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Prix total ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3 text-gray-400" size={20} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.prixTotal}
                  onChange={(e) => setFormData({ ...formData, prixTotal: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Prix installation ($)
              </label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix matériaux (auto)</label>
              <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formData.prixVenteMateriaux.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                </span>
              </div>
            </div>
          </div>

          {/* Temps d'installation */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temps d'installation estimé (heures)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.tempsEstimeInstallation}
                onChange={(e) => setFormData({ ...formData, tempsEstimeInstallation: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.utiliserCalculAuto}
                  onChange={(e) => setFormData({ ...formData, utiliserCalculAuto: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Calcul automatique (basé sur le prix installation)
                </span>
              </label>
            </div>
          </div>
        </Section>

        {/* SECTION 3: PIEDS LINÉAIRES ET POTEAUX */}
        <Section
          icon={<Ruler />}
          title="Pieds linéaires et Poteaux"
          description="Dimensions avec facteurs automatiques"
          isOpen={activeSection === "rampes"}
          onToggle={() => setActiveSection(activeSection === "rampes" ? null : "rampes")}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {PIEDS_LINEAIRES_FACTEURS.map(item => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {item.label} (facteur: {item.facteur})
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData[item.key as keyof typeof formData] as number || 0}
                  onChange={(e) => setFormData({ ...formData, [item.key]: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de poteaux</label>
              <input
                type="number"
                min="0"
                value={formData.nombrePoteaux}
                onChange={(e) => setFormData({ ...formData, nombrePoteaux: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
          </div>

          {/* Total calculé */}
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Pieds linéaires totaux (avec facteurs)
              </span>
              <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {piedsLineairesTotaux} pi
              </span>
            </div>
          </div>

          {/* Champ caché pour la compatibilité */}
          <input type="hidden" value={piedsLineairesTotaux} />
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

            {/* Statut livraison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut livraison</label>
              <select
                value={formData.statutLivraison}
                onChange={(e) => setFormData({ ...formData, statutLivraison: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                {STATUT_LIVRAISON_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Installation */}
            <SymbolSelect
              label="Installation"
              value={formData.installation}
              onChange={(v) => setFormData({ ...formData, installation: v })}
              options={CODE_PRODUCTION_OPTIONS}
            />

            {/* La checkbox "En production" a été retirée */}
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
            <AchatField 
              label="Fibre" 
              statut={formData.achatFibre}
              dateEnvoie={formData.dateEnvoieFibre}
              dateReception={formData.dateReceptionFibre}
              quantiteNonRecue={formData.quantiteNonRecueFibre}
              onStatutChange={(v) => setFormData({ ...formData, achatFibre: v })}
              onDateEnvoieChange={(v) => setFormData({ ...formData, dateEnvoieFibre: v })}
              onDateReceptionChange={(v) => setFormData({ ...formData, dateReceptionFibre: v })}
              onQuantiteChange={(v) => setFormData({ ...formData, quantiteNonRecueFibre: v })}
            />
            <AchatField 
              label="Limons" 
              statut={formData.achatLimons}
              dateEnvoie={formData.dateEnvoieLimons}
              dateReception={formData.dateReceptionLimons}
              quantiteNonRecue={formData.quantiteNonRecueLimons}
              onStatutChange={(v) => setFormData({ ...formData, achatLimons: v })}
              onDateEnvoieChange={(v) => setFormData({ ...formData, dateEnvoieLimons: v })}
              onDateReceptionChange={(v) => setFormData({ ...formData, dateReceptionLimons: v })}
              onQuantiteChange={(v) => setFormData({ ...formData, quantiteNonRecueLimons: v })}
            />
            <AchatField 
              label="Verres" 
              statut={formData.achatVerres}
              dateEnvoie={formData.dateEnvoieVerres}
              dateReception={formData.dateReceptionVerre}
              quantiteNonRecue={formData.quantiteNonRecueVerres}
              onStatutChange={(v) => setFormData({ ...formData, achatVerres: v })}
              onDateEnvoieChange={(v) => setFormData({ ...formData, dateEnvoieVerres: v })}
              onDateReceptionChange={(v) => setFormData({ ...formData, dateReceptionVerre: v })}
              onQuantiteChange={(v) => setFormData({ ...formData, quantiteNonRecueVerres: v })}
            />
            <AchatField 
              label="Colonnes" 
              statut={formData.achatColonnes}
              dateEnvoie={formData.dateEnvoieColonnes}
              dateReception={formData.dateReceptionColonnes}
              quantiteNonRecue={formData.quantiteNonRecueColonnes}
              onStatutChange={(v) => setFormData({ ...formData, achatColonnes: v })}
              onDateEnvoieChange={(v) => setFormData({ ...formData, dateEnvoieColonnes: v })}
              onDateReceptionChange={(v) => setFormData({ ...formData, dateReceptionColonnes: v })}
              onQuantiteChange={(v) => setFormData({ ...formData, quantiteNonRecueColonnes: v })}
            />
            <AchatField 
              label="Peinture" 
              statut={formData.achatPeinture}
              dateEnvoie={formData.dateEnvoiePeinture}
              dateReception={formData.dateReceptionPeinture}
              quantiteNonRecue={formData.quantiteNonRecuePeinture}
              onStatutChange={(v) => setFormData({ ...formData, achatPeinture: v })}
              onDateEnvoieChange={(v) => setFormData({ ...formData, dateEnvoiePeinture: v })}
              onDateReceptionChange={(v) => setFormData({ ...formData, dateReceptionPeinture: v })}
              onQuantiteChange={(v) => setFormData({ ...formData, quantiteNonRecuePeinture: v })}
            />
            <AchatField 
              label="Attaches" 
              statut={formData.achatAttaches}
              dateEnvoie={formData.dateEnvoieAttaches}
              dateReception={formData.dateReceptionAttaches}
              quantiteNonRecue={formData.quantiteNonRecueAttaches}
              onStatutChange={(v) => setFormData({ ...formData, achatAttaches: v })}
              onDateEnvoieChange={(v) => setFormData({ ...formData, dateEnvoieAttaches: v })}
              onDateReceptionChange={(v) => setFormData({ ...formData, dateReceptionAttaches: v })}
              onQuantiteChange={(v) => setFormData({ ...formData, quantiteNonRecueAttaches: v })}
            />
            <AchatField 
              label="Plancher aluminium" 
              statut={formData.achatPlancherAluminium}
              dateEnvoie={formData.dateEnvoiePlancherAluminium}
              dateReception={formData.dateReceptionPlancherAluminium}
              quantiteNonRecue={formData.quantiteNonRecuePlancherAluminium}
              onStatutChange={(v) => setFormData({ ...formData, achatPlancherAluminium: v })}
              onDateEnvoieChange={(v) => setFormData({ ...formData, dateEnvoiePlancherAluminium: v })}
              onDateReceptionChange={(v) => setFormData({ ...formData, dateReceptionPlancherAluminium: v })}
              onQuantiteChange={(v) => setFormData({ ...formData, quantiteNonRecuePlancherAluminium: v })}
            />
          </div>

          {/* Option structure */}
          <div className="mt-4">
            <label className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <input
                type="checkbox"
                checked={formData.structure}
                onChange={(e) => setFormData({ ...formData, structure: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Ajouter des structures d'achat manuellement
              </span>
            </label>
          </div>

          {/* Structures d'achat */}
          {formData.structure && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Structures d'achat</h4>
                <button
                  type="button"
                  onClick={addStructure}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 rounded-lg text-sm font-medium"
                >
                  <Plus size={16} />
                  Ajouter une structure
                </button>
              </div>

              {structuresAchat.map((structure, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={structure.nom}
                      onChange={(e) => updateStructure(index, "nom", e.target.value)}
                      placeholder="Nom de la structure"
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeStructure(index)}
                      className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Statut</label>
                      <select
                        value={structure.statutAchat}
                        onChange={(e) => updateStructure(index, "statutAchat", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      >
                        {STATUT_ACHAT_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.symbol} {o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date d'envoi</label>
                      <input
                        type="date"
                        value={structure.dateEnvoie || ""}
                        onChange={(e) => updateStructure(index, "dateEnvoie", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date de réception</label>
                      <input
                        type="date"
                        value={structure.dateReception || ""}
                        onChange={(e) => updateStructure(index, "dateReception", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Quantité non reçue</label>
                      <input
                        type="number"
                        min="0"
                        value={structure.quantiteNonRecue || 0}
                        onChange={(e) => updateStructure(index, "quantiteNonRecue", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

// Composant Achat avec labels explicites
function AchatField({ 
  label, statut, dateEnvoie, dateReception, quantiteNonRecue,
  onStatutChange, onDateEnvoieChange, onDateReceptionChange, onQuantiteChange 
}: {
  label: string;
  statut: string;
  dateEnvoie: string;
  dateReception: string;
  quantiteNonRecue: number;
  onStatutChange: (v: string) => void;
  onDateEnvoieChange: (v: string) => void;
  onDateReceptionChange: (v: string) => void;
  onQuantiteChange: (v: number) => void;
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{label}</label>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Statut</label>
          <select
            value={statut}
            onChange={(e) => onStatutChange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            {STATUT_ACHAT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.symbol ? `${o.symbol} - ${o.label}` : o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date d'envoi</label>
          <input
            type="date"
            value={dateEnvoie}
            onChange={(e) => onDateEnvoieChange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date de réception</label>
          <input
            type="date"
            value={dateReception}
            onChange={(e) => onDateReceptionChange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quantité non reçue</label>
          <input
            type="number"
            min="0"
            value={quantiteNonRecue || 0}
            onChange={(e) => onQuantiteChange(parseInt(e.target.value) || 0)}
            placeholder="ex: 5"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  );
}