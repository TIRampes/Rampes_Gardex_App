"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, Package, User, MapPin, Calendar, DollarSign,
  Ruler, Factory, ShoppingCart, AlertTriangle, FileText, Plus, Trash2,
  Building2, Layers, ChevronDown, CheckCircle2, Paintbrush,
  Truck, Wrench, Clock, MessageCircle
} from "lucide-react";
import { useConfig } from "@/app/context/ConfigContext";
import AddressAutocomplete from "@/app/components/commandes/Addressautocomplete";
import FormulaireAchatModal from "@/app/components/commandes/FormulaireAchatModal";
import { getTypeAchat } from "@/lib/fournisseurs-config";
import type { TypeAchatConfig } from "@/lib/fournisseurs-config";

// ---------- TYPES ----------
interface Client {
  id: string;
  nom: string;
  type: string;
  adresse: string;
  telephone: string;
  personne_Contact: string;
  emails: string[];
}

interface Representant {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
}

interface Fournisseur {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
}

interface Balcon {
  id?: string;
  nom: string;
  numeroPhase: number;
  piedsLineaires: number;
  poteaux: number;
  coutBalcon?: number;
  prixTotal?: number;
  produit?: boolean;
  installationTerminee?: boolean;
  reprise?: boolean;
  notes?: string;
  datePrevue?: string;
  prixVenteInstallation?: number;
  mesure?: string;
  plan?: string;
  planApprobationEnvoyeLe?: string;
  envoyeProduction?: string;
  termine?: string;
  installation?: string;
}

interface PurchaseItem {
  id: string;
  phaseNumero?: number;
  typeAchat: string;
  supplierId: string;
  statut: string;
  dateEnvoie: string;
  dateReception: string;
  quantiteNonRecue: number;
  formValues: Record<string, any>;
  notes: string;
}

// ---------- CONSTANTES ----------
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
  { value: "APPROBATION_PLAN", label: "Approbation plan", symbol: "AP", color: "text-purple-600" },
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
];

const COULEUR_OPTIONS = [
  { value: "", label: "— Sélectionner —" },
  { value: "NOIR", label: "Noir" },
  { value: "BLANC", label: "Blanc" },
  { value: "BRUN_COMMERCIALE", label: "Brun commerciale" },
  { value: "GRIS_CHARBON", label: "Gris charbon" },
  { value: "ARGILE", label: "Argile" },
  { value: "SPECIALE", label: "Spéciale" },
  { value: "GRIS_METALLIQUE", label: "Gris métallique" },
  { value: "AUTRE", label: "Autre" },
];

const STATUT_LIVRAISON_OPTIONS = [
  { value: "N_A", label: "N/A" },
  { value: "LIVRE", label: "Livré" },
];

const TYPE_ACHAT_OPTIONS = [
  { value: "FIBRE", label: "Fibre" },
  { value: "LIMONS", label: "Limons" },
  { value: "VERRES", label: "Verres" },
  { value: "COLONNES", label: "Colonnes" },
  { value: "PEINTURE", label: "Peinture" },
  { value: "ATTACHES", label: "Attaches" },
  { value: "PLANCHER_ALUMINIUM", label: "Plancher aluminium" },
  { value: "EUROFORGINGS", label: "EuroForgings" },
  { value: "PEINTURE_DJ", label: "Peinture DJ" },
  { value: "VERRE_LEPAGE", label: "Verre Lepage" },
  { value: "STRUCTURE", label: "Structure d'achat" }, // <-- Ajout du type Structure
];

const PIEDS_LINEAIRES_FACTEURS = [
  { key: "piedsLineairesBarrotin", label: "Barrotin", facteur: 1.25 },
  { key: "piedsLineairesVerre", label: "Verre", facteur: 1 },
  { key: "piedsLineairesMur", label: "Mur", facteur: 4 },
  { key: "piedsLineairesMainDouble", label: "Main double", facteur: 2.25 },
  { key: "piedsLineairesGardexVision", label: "Gardex Vision", facteur: 1 },
  { key: "piedsLineairesGardexUrbaine", label: "Gardex Urbaine", facteur: 2 },
  { key: "piedsLineairesGardexOptimum", label: "Gardex Optimum", facteur: 0.75 },
];

// Helper pour arrondir à l'unité
const roundToUnit = (val: number) => Math.round(val);

// Constante pour délai mesure (14 jours avant date prévue)
const DELAI_MESURE = 14;

export default function NouvelleCommandePage() {
  const router = useRouter();
  const { config, loading: configLoading } = useConfig();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("general");
  const [formulaireModal, setFormulaireModal] = useState<{ isOpen: boolean; config: TypeAchatConfig | null; phaseName?: string }>({ isOpen: false, config: null });

  // Formulaire principal
  const [formData, setFormData] = useState({
    numero: "",
    clientId: "",
    representantId: "",
    reference: "",
    typeCommande: "STANDARD",
    service: "INSTALLATION",
    statut: "ACTIVE",
    adresse: "",
    commentaireAdresse: "",
    couleur: "",
    couleurPersonnalisee: "",
    reprise: false,
    ancienneCommandeNumero: "",
    nombreBalcons: 0,
    nombrePhases: 0,
    piedsLineairesEstime: 0,
    piedsLineairesReels: 0,
    dateEntree: new Date().toISOString().split("T")[0],
    datePrevue: "",
    dateProduction: "",
    datePriseMesure: "",           // <-- ajout
    dateLivraison: "",
    prixTotal: 0,
    prixVenteInstallation: 0,
    prixVenteMateriaux: 0,
    piedsLineairesBarrotin: 0,
    piedsLineairesVerre: 0,
    piedsLineairesMur: 0,
    piedsLineairesMainDouble: 0,
    piedsLineairesGardexVision: 0,
    piedsLineairesGardexUrbaine: 0,
    piedsLineairesGardexOptimum: 0,
    nombrePoteaux: 0,
    tempsEstimeInstallation: 0,
    piedsCarresFibre: 0,
    piedsRampesBarrotin: 0,
    piedsRampesVerre: 0,
    piedsRampesMurIntimite: 0,
    piedsRampesMainDouble: 0,
    piedsRampesGardexVision: 0,
    piedsRampesGardexVisionUrbaine: 0,
    piedsRampesGardexVisionOptimum: 0,
    utiliserCalculAuto: true,
    structure: false,
    mesure: "",
    mesureDonneeLe: "",
    plan: "",
    planApprobationEnvoyeLe: "",
    envoyeProduction: "",
    productionTerminee: "",
    termine: "",
    statutLivraison: "N_A",
    installation: "",
    enProduction: false,
    // Achats globaux (pour compatibilité)
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
    avertissementClient: "",
    avertissementPriseMesure: "",
    commentaire: "",
  });

  const [balcons, setBalcons] = useState<Balcon[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);

  // Charger les listes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, repsRes, fournisseursRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/representants"),
          fetch("/api/fournisseurs"),
        ]);
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (repsRes.ok) setRepresentants(await repsRes.json());
        if (fournisseursRes.ok) setFournisseurs(await fournisseursRes.json());
      } catch (err) {
        console.error("Erreur chargement:", err);
      }
    };
    fetchData();
  }, []);

  // Calculs pieds linéaires (arrondis)
  const piedsLineairesTotaux = useMemo(() => {
    let total = 0;
    total += (formData.piedsLineairesBarrotin || 0) * 1.25;
    total += (formData.piedsLineairesVerre || 0) * 1;
    total += (formData.piedsLineairesMur || 0) * 4;
    total += (formData.piedsLineairesMainDouble || 0) * 2.25;
    total += (formData.piedsLineairesGardexVision || 0) * 1;
    total += (formData.piedsLineairesGardexUrbaine || 0) * 2;
    total += (formData.piedsLineairesGardexOptimum || 0) * 0.75;
    return roundToUnit(total);
  }, [
    formData.piedsLineairesBarrotin,
    formData.piedsLineairesVerre,
    formData.piedsLineairesMur,
    formData.piedsLineairesMainDouble,
    formData.piedsLineairesGardexVision,
    formData.piedsLineairesGardexUrbaine,
    formData.piedsLineairesGardexOptimum,
  ]);

  // Temps installation calculé
  const tempsInstallationCalcule = useMemo(() => {
    if (!config) return 0;
    if (formData.prixVenteInstallation <= 0) return 0;
    const temps = (formData.prixVenteInstallation / config.coutHeureInstallation) * config.facteurTempsInstallation;
    return Math.round(temps * 10) / 10;
  }, [formData.prixVenteInstallation, config]);

  useEffect(() => {
    if (formData.utiliserCalculAuto) {
      setFormData(prev => ({ ...prev, tempsEstimeInstallation: tempsInstallationCalcule }));
    }
  }, [formData.utiliserCalculAuto, tempsInstallationCalcule]);

  // Calcul automatique des dates : dateProduction = datePrevue - 7 jours, datePriseMesure = datePrevue - 14 jours
  useEffect(() => {
    if (formData.datePrevue) {
      const datePrev = new Date(formData.datePrevue);
      const dateProd = new Date(datePrev);
      dateProd.setDate(dateProd.getDate() - 7);
      const dateMesure = new Date(datePrev);
      dateMesure.setDate(dateMesure.getDate() - DELAI_MESURE);
      setFormData(prev => ({
        ...prev,
        dateProduction: dateProd.toISOString().split("T")[0],
        datePriseMesure: dateMesure.toISOString().split("T")[0],
        dateLivraison: prev.datePrevue,
      }));
    } else {
      setFormData(prev => ({ ...prev, dateProduction: "", datePriseMesure: "", dateLivraison: "" }));
    }
  }, [formData.datePrevue]);

  // Calcul prix matériaux
  useEffect(() => {
    const materiaux = Math.max(0, (formData.prixTotal || 0) - (formData.prixVenteInstallation || 0));
    setFormData(prev => ({ ...prev, prixVenteMateriaux: materiaux }));
  }, [formData.prixTotal, formData.prixVenteInstallation]);

  // Générer les balcons
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
        datePrevue: "",
        prixTotal: 0,
        prixVenteInstallation: 0,
        mesure: "",
        plan: "",
        planApprobationEnvoyeLe: "",
        envoyeProduction: "",
        termine: "",
        installation: "",
      }));
      setBalcons(newBalcons);
    } else if (formData.typeCommande === "STANDARD") {
      setBalcons([]);
    }
  }, [formData.typeCommande, formData.nombreBalcons, formData.nombrePhases]);

  // Remplir adresse si client sélectionné
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client && !formData.adresse) {
        setFormData(prev => ({ ...prev, adresse: client.adresse }));
      }
    }
  }, [formData.clientId, clients]);

  // Gestion des achats unifiés
  const addPurchase = () => {
    setPurchases(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        phaseNumero: balcons.length > 0 ? balcons[0].numeroPhase : undefined,
        typeAchat: "FIBRE",
        supplierId: "",
        statut: "A_FAIRE",
        dateEnvoie: "",
        dateReception: "",
        quantiteNonRecue: 0,
        formValues: {},
        notes: "",
      },
    ]);
  };

  const updatePurchase = (index: number, field: keyof PurchaseItem, value: any) => {
    setPurchases(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const removePurchase = (index: number) => {
    setPurchases(prev => prev.filter((_, i) => i !== index));
  };

  const updateBalcon = (index: number, field: keyof Balcon, value: any) => {
    setBalcons(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);
    setLoading(true);

    if (!formData.numero.trim()) { setError("Le numéro est obligatoire"); setLoading(false); return; }
    if (!formData.clientId) { setError("Le client est obligatoire"); setLoading(false); return; }
    if (!formData.adresse.trim()) { setError("L'adresse est obligatoire"); setLoading(false); return; }

    // Transformer purchases en achatsPhase et structuresAchat
    const achatsPhase = purchases
      .filter(p => p.typeAchat !== "STRUCTURE")
      .map(p => ({
        phaseNumero: p.phaseNumero,
        typeAchat: p.typeAchat,
        statut: p.statut,
        dateEnvoie: p.dateEnvoie,
        dateReception: p.dateReception,
        quantiteNonRecue: p.quantiteNonRecue,
        codeProduit: p.formValues?.codeProduit,
        description: p.formValues?.description,
        quantite: p.formValues?.quantite,
        prixUnitaire: p.formValues?.prixUnitaire,
        couleur: p.formValues?.couleur,
        epaisseur: p.formValues?.epaisseur,
        typeVerre: p.formValues?.typeVerre,
        longueur: p.formValues?.longueur,
        hauteur: p.formValues?.hauteur,
        notes: p.notes,
        details: p.formValues,
      }));

    const structuresAchat = purchases
      .filter(p => p.typeAchat === "STRUCTURE")
      .map(p => ({
        nom: p.formValues?.nom || "Structure",
        statutAchat: p.statut,
        dateEnvoie: p.dateEnvoie,
        dateReception: p.dateReception,
        quantiteNonRecue: p.quantiteNonRecue,
        phase: p.phaseNumero,
      }));

    const dataToSend = {
      ...formData,
      balcons: balcons.length > 0 ? balcons : undefined,
      achatsPhase: achatsPhase.length > 0 ? achatsPhase : undefined,
      structuresAchat: structuresAchat.length > 0 ? structuresAchat : undefined,
      representantId: formData.representantId || null,
      couleur: formData.couleur || null,
      couleurPersonnalisee: formData.couleur === "AUTRE" ? formData.couleurPersonnalisee : null,
      mesure: formData.mesure || null,
      plan: formData.plan || null,
      planApprobationEnvoyeLe: formData.planApprobationEnvoyeLe || null,
      envoyeProduction: formData.envoyeProduction || null,
      productionTerminee: formData.productionTerminee || null,
      termine: formData.termine || null,
      installation: formData.installation || null,
      avertissementClient: formData.avertissementClient || null,
      avertissementPriseMesure: formData.avertissementPriseMesure || null,
    };

    try {
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
        if (data.fieldErrors && Array.isArray(data.fieldErrors)) {
          setFieldErrors(data.fieldErrors);
        }
      }
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
          {fieldErrors.length > 0 && (
            <ul className="mt-3 ml-8 space-y-1">
              {fieldErrors.map((fe, i) => (
                <li key={i} className="text-[0.8125rem] text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span>{fe.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
        <Section icon={<Package />} title="Informations générales" isOpen={activeSection === "general"} onToggle={() => setActiveSection(activeSection === "general" ? null : "general")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Numéro
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Client
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                <option value="">— Sélectionner —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Représentant</label>
              <select
                value={formData.representantId}
                onChange={(e) => setFormData({ ...formData, representantId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                <option value="">— Aucun —</option>
                {representants.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Référence</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                {SERVICE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur</label>
              <select
                value={formData.couleur}
                onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                {COULEUR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {formData.couleur === "AUTRE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur personnalisée</label>
                <input
                  type="text"
                  value={formData.couleurPersonnalisee}
                  onChange={(e) => setFormData({ ...formData, couleurPersonnalisee: e.target.value })}
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
                </button>
              ))}
            </div>
          </div>

          {/* Reprise */}
          <div className="mt-4">
            <label className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <input
                type="checkbox"
                checked={formData.reprise}
                onChange={(e) => setFormData({ ...formData, reprise: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium text-orange-700">Cette commande est une reprise</span>
            </label>
          </div>
          {formData.reprise && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ancienne commande</label>
              <input
                type="text"
                value={formData.ancienneCommandeNumero}
                onChange={(e) => setFormData({ ...formData, ancienneCommandeNumero: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
          )}

          {/* Nombre de balcons/phases */}
          {formData.typeCommande === "COMMERCIAL" && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <label className="block text-sm font-medium text-purple-700 mb-2">
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
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <label className="block text-sm font-medium text-orange-700 mb-2">
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

          {/* Tableau des balcons */}
          {balcons.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-2 py-2 text-left">Nom</th>
                    <th className="px-2 py-2 text-left">Pieds lin.</th>
                    <th className="px-2 py-2 text-left">Poteaux</th>
                    <th className="px-2 py-2 text-left">Date prévue</th>
                    <th className="px-2 py-2 text-left">Prix total</th>
                    <th className="px-2 py-2 text-left">Prix install</th>
                    <th className="px-2 py-2 text-left">Mesure</th>
                    <th className="px-2 py-2 text-left">Plan</th>
                    <th className="px-2 py-2 text-left">Date envoi plan</th>
                    <th className="px-2 py-2 text-left">Env. prod</th>
                    <th className="px-2 py-2 text-left">Term.</th>
                    <th className="px-2 py-2 text-left">Install.</th>
                  </tr>
                </thead>
                <tbody>
                  {balcons.map((b, i) => (
                    <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={b.nom}
                          onChange={(e) => updateBalcon(i, "nom", e.target.value)}
                          className="w-24 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          value={b.piedsLineaires}
                          onChange={(e) => updateBalcon(i, "piedsLineaires", parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          value={b.poteaux}
                          onChange={(e) => updateBalcon(i, "poteaux", parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={b.datePrevue || ""}
                          onChange={(e) => updateBalcon(i, "datePrevue", e.target.value)}
                          className="w-32 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={b.prixTotal || 0}
                          onChange={(e) => updateBalcon(i, "prixTotal", parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={b.prixVenteInstallation || 0}
                          onChange={(e) => updateBalcon(i, "prixVenteInstallation", parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={b.mesure || ""}
                          onChange={(e) => updateBalcon(i, "mesure", e.target.value)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        >
                          {CODE_PRODUCTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.symbol}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={b.plan || ""}
                          onChange={(e) => updateBalcon(i, "plan", e.target.value)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        >
                          {CODE_PRODUCTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.symbol}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={b.planApprobationEnvoyeLe || ""}
                          onChange={(e) => updateBalcon(i, "planApprobationEnvoyeLe", e.target.value)}
                          className="w-32 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={b.envoyeProduction || ""}
                          onChange={(e) => updateBalcon(i, "envoyeProduction", e.target.value)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        >
                          {CODE_PRODUCTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.symbol}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={b.termine || ""}
                          onChange={(e) => updateBalcon(i, "termine", e.target.value)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        >
                          {CODE_PRODUCTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.symbol}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={b.installation || ""}
                          onChange={(e) => updateBalcon(i, "installation", e.target.value)}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border rounded-lg"
                        >
                          {CODE_PRODUCTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.symbol}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Adresse avec autocomplétion */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="text-red-500">*</span> Adresse
            </label>
            <AddressAutocomplete
              value={formData.adresse}
              onChange={(addr) => setFormData({ ...formData, adresse: addr })}
              error={fieldErrors.find(e => e.field === 'adresse')?.message}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaire adresse</label>
            <input
              type="text"
              value={formData.commentaireAdresse}
              onChange={(e) => setFormData({ ...formData, commentaireAdresse: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaire général</label>
            <textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none"
            />
          </div>
        </Section>

        {/* SECTION 2: DATES ET PRIX */}
        <Section icon={<Calendar />} title="Dates et Prix" isOpen={activeSection === "dates"} onToggle={() => setActiveSection(activeSection === "dates" ? null : "dates")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date entrée</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date production (auto)</label>
              <input
                type="date"
                value={formData.dateProduction}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date mesure (auto)</label>
              <input
                type="date"
                value={formData.datePriseMesure}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semaine prévue</label>
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 font-semibold">
                {formData.datePrevue ? `S${Math.ceil(((new Date(formData.datePrevue).getTime() - new Date(new Date(formData.datePrevue).getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}` : "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix total ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.prixTotal}
                onChange={(e) => setFormData({ ...formData, prixTotal: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix installation ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.prixVenteInstallation}
                onChange={(e) => setFormData({ ...formData, prixVenteInstallation: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prix matériaux (auto)</label>
              <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold text-gray-900 dark:text-white">
                {formData.prixVenteMateriaux.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Temps installation estimé (h)</label>
              <input
                type="number"
                step="0.1"
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
                <span className="text-sm">Calcul automatique</span>
              </label>
            </div>
          </div>
        </Section>

        {/* SECTION 3: PIEDS LINÉAIRES ET POTEAUX */}
        <Section icon={<Ruler />} title="Pieds linéaires et Poteaux" isOpen={activeSection === "rampes"} onToggle={() => setActiveSection(activeSection === "rampes" ? null : "rampes")}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {PIEDS_LINEAIRES_FACTEURS.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{f.label} (×{f.facteur})</label>
                <input
                  type="number"
                  min="0"
                  value={formData[f.key as keyof typeof formData] as number || 0}
                  onChange={(e) => setFormData({ ...formData, [f.key]: parseInt(e.target.value) || 0 })}
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
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-700">Total (avec facteurs)</span>
              <span className="text-2xl font-bold text-purple-700">{piedsLineairesTotaux} pi</span>
            </div>
          </div>
        </Section>

        {/* SECTION 4: PRODUCTION */}
        <Section icon={<Factory />} title="Production" isOpen={activeSection === "production"} onToggle={() => setActiveSection(activeSection === "production" ? null : "production")}>
          {/* 1. Mesure */}
          <div className="mb-4">
            <p className="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">① Prise de mesure</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SymbolSelect label="Mesure" value={formData.mesure} onChange={(v) => setFormData({ ...formData, mesure: v })} options={CODE_PRODUCTION_OPTIONS} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mesure donnée le</label>
                <input
                  type="date"
                  value={formData.mesureDonneeLe}
                  onChange={(e) => setFormData({ ...formData, mesureDonneeLe: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* 2. Plan & approbation */}
          <div className="mb-4">
            <p className="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">② Plan &amp; approbation</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SymbolSelect label="Plan" value={formData.plan} onChange={(v) => setFormData({ ...formData, plan: v })} options={CODE_PRODUCTION_OPTIONS} />
              {formData.plan === "APPROBATION_PLAN" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date d'envoi pour approbation</label>
                  <input
                    type="date"
                    value={formData.planApprobationEnvoyeLe}
                    onChange={(e) => setFormData({ ...formData, planApprobationEnvoyeLe: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Production */}
          <div className="mb-4">
            <p className="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">③ Production</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SymbolSelect label="Envoyé production" value={formData.envoyeProduction} onChange={(v) => setFormData({ ...formData, envoyeProduction: v })} options={CODE_PRODUCTION_OPTIONS} />
              <SymbolSelect label="Production terminée" value={formData.productionTerminee} onChange={(v) => setFormData({ ...formData, productionTerminee: v })} options={CODE_PRODUCTION_OPTIONS} />
              <SymbolSelect label="Terminé" value={formData.termine} onChange={(v) => setFormData({ ...formData, termine: v })} options={CODE_PRODUCTION_OPTIONS} />
            </div>
          </div>

          {/* 4. Livraison & Installation */}
          <div>
            <p className="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">④ Livraison &amp; Installation</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut livraison</label>
                <select
                  value={formData.statutLivraison}
                  onChange={(e) => setFormData({ ...formData, statutLivraison: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                >
                  {STATUT_LIVRAISON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <SymbolSelect label="Installation" value={formData.installation} onChange={(v) => setFormData({ ...formData, installation: v })} options={CODE_PRODUCTION_OPTIONS} />
            </div>
          </div>
        </Section>

        {/* SECTION 5: ACHATS UNIFIÉE */}
        <Section icon={<ShoppingCart />} title="Achats" isOpen={activeSection === "achats"} onToggle={() => setActiveSection(activeSection === "achats" ? null : "achats")}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Liste des achats</h4>
              <button
                type="button"
                onClick={addPurchase}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm"
              >
                <Plus size={16} />
                Ajouter un achat
              </button>
            </div>

            {purchases.map((purchase, idx) => {
              const typeConfig = getTypeAchat(purchase.typeAchat);
              const phaseOptions = balcons.map(b => ({ value: b.numeroPhase, label: b.nom }));
              const isStructure = purchase.typeAchat === "STRUCTURE";
              return (
                <div key={purchase.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                      <div>
                        <label className="block text-xs text-gray-500">Type d'achat</label>
                        <select
                          value={purchase.typeAchat}
                          onChange={(e) => updatePurchase(idx, "typeAchat", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                        >
                          {TYPE_ACHAT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Phase / Balcon / Plan</label>
                        <select
                          value={purchase.phaseNumero || ""}
                          onChange={(e) => updatePurchase(idx, "phaseNumero", parseInt(e.target.value) || undefined)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                        >
                          <option value="">— Global —</option>
                          {phaseOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      {!isStructure && (
                        <div>
                          <label className="block text-xs text-gray-500">Fournisseur</label>
                          <select
                            value={purchase.supplierId}
                            onChange={(e) => updatePurchase(idx, "supplierId", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                          >
                            <option value="">— Sélectionner —</option>
                            {fournisseurs.map(f => (
                              <option key={f.id} value={f.id}>{f.nom}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePurchase(idx)}
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Champs communs */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-gray-500">Statut</label>
                      <select
                        value={purchase.statut}
                        onChange={(e) => updatePurchase(idx, "statut", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                      >
                        {STATUT_ACHAT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.symbol} {opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Date d'envoi</label>
                      <input
                        type="date"
                        value={purchase.dateEnvoie}
                        onChange={(e) => updatePurchase(idx, "dateEnvoie", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Date de réception</label>
                      <input
                        type="date"
                        value={purchase.dateReception}
                        onChange={(e) => updatePurchase(idx, "dateReception", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Quantité non reçue</label>
                      <input
                        type="number"
                        min="0"
                        value={purchase.quantiteNonRecue}
                        onChange={(e) => updatePurchase(idx, "quantiteNonRecue", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Champs spécifiques */}
                  {isStructure ? (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500">Nom de la structure</label>
                      <input
                        type="text"
                        value={purchase.formValues?.nom || ""}
                        onChange={(e) => updatePurchase(idx, "formValues", { ...purchase.formValues, nom: e.target.value })}
                        placeholder="Nom de la structure"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      {typeConfig && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setFormulaireModal({
                              isOpen: true,
                              config: typeConfig,
                              phaseName: balcons.find(b => b.numeroPhase === purchase.phaseNumero)?.nom,
                            })}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center gap-2"
                          >
                            <FileText size={16} />
                            Ouvrir le formulaire d'achat
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  <div className="mt-3">
                    <label className="block text-xs text-gray-500">Notes</label>
                    <textarea
                      value={purchase.notes}
                      onChange={(e) => updatePurchase(idx, "notes", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* SECTION 6: AVERTISSEMENTS */}
        <Section icon={<AlertTriangle />} title="Avertissements" isOpen={activeSection === "avertissements"} onToggle={() => setActiveSection(activeSection === "avertissements" ? null : "avertissements")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SymbolSelect label="Avertissement client" value={formData.avertissementClient} onChange={(v) => setFormData({ ...formData, avertissementClient: v })} options={AVERTISSEMENT_CLIENT_OPTIONS} />
            <SymbolSelect label="Avertissement prise de mesure" value={formData.avertissementPriseMesure} onChange={(v) => setFormData({ ...formData, avertissementPriseMesure: v })} options={AVERTISSEMENT_MESURE_OPTIONS} />
          </div>
        </Section>

        {/* Boutons de soumission */}
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

      {/* Modal formulaire fournisseur */}
      {formulaireModal.config && (
        <FormulaireAchatModal
          isOpen={formulaireModal.isOpen}
          onClose={() => setFormulaireModal({ isOpen: false, config: null })}
          config={formulaireModal.config}
          commandeNumero={formData.numero}
          phaseName={formulaireModal.phaseName}
        />
      )}
    </div>
  );
}

// Composants auxiliaires
function Section({ icon, title, isOpen, onToggle, children }: {
  icon: React.ReactNode;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center text-[var(--color-primary)]">
            {icon}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
}

function SymbolSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; symbol: string; color?: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.symbol ? `${o.symbol} - ${o.label}` : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}