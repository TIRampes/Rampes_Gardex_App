"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, Package, User, MapPin, Calendar, DollarSign,
  Ruler, Factory, ShoppingCart, AlertTriangle, FileText, Plus, Trash2,
  Building2, Layers, ChevronDown, CheckCircle2, Info, Paintbrush,
  Truck, Wrench, Clock, MessageCircle, RefreshCw, Hash, Send, X
} from "lucide-react";
import { useConfig } from "@/app/context/ConfigContext";

// Types
interface Client { id: string; nom: string; type: string; adresse: string; telephone: string; cellulaire?: string; emails: string[]; }
interface Representant { id: string; nom: string; email?: string; telephone?: string; }
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
interface Commande {
  id: string;
  numero: string;
  reference?: string;
  clientId: string;
  client: Client;
  representantId?: string;
  representant?: Representant;
  typeCommande: string;
  service: string;
  statut: string;
  adresse: string;
  commentaireAdresse?: string;
  couleur?: string;
  couleurPersonnalisee?: string;
  reprise: boolean;
  ancienneCommandeNumero?: string;
  nombreBalcons?: number;
  nombrePhases?: number;
  piedsLineairesEstime?: number;
  piedsLineairesReels?: number;
  dateEntree: string;
  dateProduction?: string;
  datePrevue?: string;
  datePriseMesure?: string;
  dateLivraison?: string;
  prixTotal: number;
  prixVenteInstallation: number;
  prixVenteMateriaux: number;
  piedsLineairesBarrotin: number;
  piedsLineairesVerre: number;
  piedsLineairesMur: number;
  piedsLineairesMainDouble: number;
  piedsLineairesGardexVision: number;
  piedsLineairesGardexUrbaine: number;
  piedsLineairesGardexOptimum: number;
  nombrePoteaux: number;
  tempsEstimeInstallation: number;
  piedsCarresFibre?: number;
  piedsRampesBarrotin: number;
  piedsRampesVerre: number;
  piedsRampesMurIntimite: number;
  piedsRampesMainDouble: number;
  piedsRampesGardexVision: number;
  piedsRampesGardexVisionUrbaine: number;
  piedsRampesGardexVisionOptimum: number;
  utiliserCalculAuto: boolean;
  structure: boolean;
  mesure?: string;
  mesureDonneeLe?: string;
  plan?: string;
  envoyeProduction?: string;
  productionTerminee?: string;
  termine?: string;
  statutLivraison: string;
  installation?: string;
  enProduction: boolean;
  achatFibre?: string;
  dateEnvoieFibre?: string;
  dateReceptionFibre?: string;
  quantiteNonRecueFibre?: number;
  achatLimons?: string;
  dateEnvoieLimons?: string;
  dateReceptionLimons?: string;
  quantiteNonRecueLimons?: number;
  achatVerres?: string;
  dateEnvoieVerres?: string;
  dateReceptionVerre?: string;
  quantiteNonRecueVerres?: number;
  achatColonnes?: string;
  dateEnvoieColonnes?: string;
  dateReceptionColonnes?: string;
  quantiteNonRecueColonnes?: number;
  achatPeinture?: string;
  dateEnvoiePeinture?: string;
  dateReceptionPeinture?: string;
  quantiteNonRecuePeinture?: number;
  achatAttaches?: string;
  dateEnvoieAttaches?: string;
  dateReceptionAttaches?: string;
  quantiteNonRecueAttaches?: number;
  achatPlancherAluminium?: string;
  dateEnvoiePlancherAluminium?: string;
  dateReceptionPlancherAluminium?: string;
  quantiteNonRecuePlancherAluminium?: number;
  avertissementClient?: string;
  avertissementPriseMesure?: string;
  commentaire?: string;
  balcons: Balcon[];
  structuresAchat: StructureAchat[];
}

// Options de commentaires prédéfinis
const PREDEFINED_COMMENTS = [
  "Un bris de production nous oblige à repousser votre commande. Nous faisons tout notre possible pour que votre commande soit prête le plus rapidement possible.",
  "Dû aux mauvaises conditions météo des derniers jours, nos installations ont été retardées. Nous sommes donc contraints de retarder votre installation.",
  "Étant donné le retard d'un de nos fournisseurs, nous devons repousser la date de livraison de votre commande. Soyez assuré que dès que notre fournisseur nous livrera, votre commande sera produite en priorité.",
  "La prise de mesure a été retardée. La nouvelle date sera attribuée selon les délais en vigueur en ce moment.",
  "Pour des raisons hors de notre contrôle, nous devons déplacer votre installation à une date ultérieure.",
  "Dossier encore en attente d'une réponse du client.",
  "Date de délai non respectée",
  "Autre"
];

// Mapping codes production (copié depuis la page de création)
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

const STATUT_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "COMPLETEE", label: "Complétée" },
  { value: "ANNULEE", label: "Annulée" },
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

const formatDateForInput = (date?: string) => date ? new Date(date).toISOString().split("T")[0] : "";

export default function EditCommandePage() {
  const router = useRouter();
  const params = useParams();
  const { config, loading: configLoading } = useConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>("general");
  const [originalDatePrevue, setOriginalDatePrevue] = useState<string | null>(null);
  const [originalCommande, setOriginalCommande] = useState<Commande | null>(null);

  // États pour le modal d'avis de changement de date
  const [showDateChangeModal, setShowDateChangeModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [customComment, setCustomComment] = useState("");
  const [sendToClientSms, setSendToClientSms] = useState(true);
  const [sendToClientEmail, setSendToClientEmail] = useState(true);
  const [sendToRepresentantEmail, setSendToRepresentantEmail] = useState(true);
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");

  // Formulaire
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
    dateEntree: "",
    dateProduction: "",
    datePrevue: "",
    datePriseMesure: "",
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
    utiliserCalculAuto: false,
    structure: false,
    mesure: "",
    mesureDonneeLe: "",
    plan: "",
    envoyeProduction: "",
    productionTerminee: "",
    termine: "",
    statutLivraison: "N_A",
    installation: "",
    enProduction: false,
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
  const [structuresAchat, setStructuresAchat] = useState<StructureAchat[]>([]);

  // Charger clients, représentants et commande
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
          setOriginalCommande(c);
          setOriginalDatePrevue(c.datePrevue || null);
          setFormData({
            numero: c.numero || "",
            clientId: c.clientId || "",
            representantId: c.representantId || "",
            reference: c.reference || "",
            typeCommande: c.typeCommande || "STANDARD",
            service: c.service || "INSTALLATION",
            statut: c.statut || "ACTIVE",
            adresse: c.adresse || "",
            commentaireAdresse: c.commentaireAdresse || "",
            couleur: c.couleur || "",
            couleurPersonnalisee: c.couleurPersonnalisee || "",
            reprise: c.reprise || false,
            ancienneCommandeNumero: c.ancienneCommandeNumero || "",
            nombreBalcons: c.nombreBalcons || 0,
            nombrePhases: c.nombrePhases || 0,
            piedsLineairesEstime: c.piedsLineairesEstime || 0,
            piedsLineairesReels: c.piedsLineairesReels || 0,
            dateEntree: formatDateForInput(c.dateEntree),
            dateProduction: formatDateForInput(c.dateProduction),
            datePrevue: formatDateForInput(c.datePrevue),
            datePriseMesure: formatDateForInput(c.datePriseMesure),
            dateLivraison: formatDateForInput(c.dateLivraison),
            prixTotal: Number(c.prixTotal) || 0,
            prixVenteInstallation: Number(c.prixVenteInstallation) || 0,
            prixVenteMateriaux: Number(c.prixVenteMateriaux) || 0,
            piedsLineairesBarrotin: c.piedsLineairesBarrotin || 0,
            piedsLineairesVerre: c.piedsLineairesVerre || 0,
            piedsLineairesMur: c.piedsLineairesMur || 0,
            piedsLineairesMainDouble: c.piedsLineairesMainDouble || 0,
            piedsLineairesGardexVision: c.piedsLineairesGardexVision || 0,
            piedsLineairesGardexUrbaine: c.piedsLineairesGardexUrbaine || 0,
            piedsLineairesGardexOptimum: c.piedsLineairesGardexOptimum || 0,
            nombrePoteaux: c.nombrePoteaux || 0,
            tempsEstimeInstallation: c.tempsEstimeInstallation || 0,
            piedsCarresFibre: c.piedsCarresFibre || 0,
            piedsRampesBarrotin: c.piedsRampesBarrotin || 0,
            piedsRampesVerre: c.piedsRampesVerre || 0,
            piedsRampesMurIntimite: c.piedsRampesMurIntimite || 0,
            piedsRampesMainDouble: c.piedsRampesMainDouble || 0,
            piedsRampesGardexVision: c.piedsRampesGardexVision || 0,
            piedsRampesGardexVisionUrbaine: c.piedsRampesGardexVisionUrbaine || 0,
            piedsRampesGardexVisionOptimum: c.piedsRampesGardexVisionOptimum || 0,
            utiliserCalculAuto: c.utiliserCalculAuto || false,
            structure: c.structure || false,
            mesure: c.mesure || "",
            mesureDonneeLe: formatDateForInput(c.mesureDonneeLe),
            plan: c.plan || "",
            envoyeProduction: c.envoyeProduction || "",
            productionTerminee: c.productionTerminee || "",
            termine: c.termine || "",
            statutLivraison: c.statutLivraison || "N_A",
            installation: c.installation || "",
            enProduction: c.enProduction || false,
            achatFibre: c.achatFibre || "",
            dateEnvoieFibre: formatDateForInput(c.dateEnvoieFibre),
            dateReceptionFibre: formatDateForInput(c.dateReceptionFibre),
            quantiteNonRecueFibre: c.quantiteNonRecueFibre || 0,
            achatLimons: c.achatLimons || "",
            dateEnvoieLimons: formatDateForInput(c.dateEnvoieLimons),
            dateReceptionLimons: formatDateForInput(c.dateReceptionLimons),
            quantiteNonRecueLimons: c.quantiteNonRecueLimons || 0,
            achatVerres: c.achatVerres || "",
            dateEnvoieVerres: formatDateForInput(c.dateEnvoieVerres),
            dateReceptionVerre: formatDateForInput(c.dateReceptionVerre),
            quantiteNonRecueVerres: c.quantiteNonRecueVerres || 0,
            achatColonnes: c.achatColonnes || "",
            dateEnvoieColonnes: formatDateForInput(c.dateEnvoieColonnes),
            dateReceptionColonnes: formatDateForInput(c.dateReceptionColonnes),
            quantiteNonRecueColonnes: c.quantiteNonRecueColonnes || 0,
            achatPeinture: c.achatPeinture || "",
            dateEnvoiePeinture: formatDateForInput(c.dateEnvoiePeinture),
            dateReceptionPeinture: formatDateForInput(c.dateReceptionPeinture),
            quantiteNonRecuePeinture: c.quantiteNonRecuePeinture || 0,
            achatAttaches: c.achatAttaches || "",
            dateEnvoieAttaches: formatDateForInput(c.dateEnvoieAttaches),
            dateReceptionAttaches: formatDateForInput(c.dateReceptionAttaches),
            quantiteNonRecueAttaches: c.quantiteNonRecueAttaches || 0,
            achatPlancherAluminium: c.achatPlancherAluminium || "",
            dateEnvoiePlancherAluminium: formatDateForInput(c.dateEnvoiePlancherAluminium),
            dateReceptionPlancherAluminium: formatDateForInput(c.dateReceptionPlancherAluminium),
            quantiteNonRecuePlancherAluminium: c.quantiteNonRecuePlancherAluminium || 0,
            avertissementClient: c.avertissementClient || "",
            avertissementPriseMesure: c.avertissementPriseMesure || "",
            commentaire: c.commentaire || "",
          });
          if (c.balcons) setBalcons(c.balcons);
          if (c.structuresAchat) setStructuresAchat(c.structuresAchat);
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

  // Calculs
  const prixTotal = useMemo(() => {
    return (formData.prixTotal || 0);
  }, [formData.prixTotal]);

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

  const tempsInstallationCalcule = useMemo(() => {
    if (!config) return 0;
    if (formData.prixVenteInstallation <= 0) return 0;
    return (formData.prixVenteInstallation / config.coutHeureInstallation) * config.facteurTempsInstallation;
  }, [formData.prixVenteInstallation, config]);

  useEffect(() => {
    if (formData.utiliserCalculAuto) {
      setFormData(prev => ({ ...prev, tempsEstimeInstallation: tempsInstallationCalcule }));
    }
  }, [formData.utiliserCalculAuto, tempsInstallationCalcule]);

  useEffect(() => {
    if (formData.datePrevue) {
      const datePrev = new Date(formData.datePrevue);
      const dateProd = new Date(datePrev);
      dateProd.setDate(dateProd.getDate() - 7);
      setFormData(prev => ({
        ...prev,
        dateProduction: dateProd.toISOString().split("T")[0],
        dateLivraison: prev.datePrevue,
      }));
    } else {
      setFormData(prev => ({ ...prev, dateProduction: "", dateLivraison: "" }));
    }
  }, [formData.datePrevue]);

  useEffect(() => {
    const materiaux = Math.max(0, (formData.prixTotal || 0) - (formData.prixVenteInstallation || 0));
    setFormData(prev => ({ ...prev, prixVenteMateriaux: materiaux }));
  }, [formData.prixTotal, formData.prixVenteInstallation]);

  const updateBalcon = (index: number, field: keyof Balcon, value: any) => {
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

  const handleAddEmail = () => {
    if (newEmail && /^\S+@\S+\.\S+$/.test(newEmail)) {
      setAdditionalEmails([...additionalEmails, newEmail]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setAdditionalEmails(additionalEmails.filter(e => e !== email));
  };

  const handleCommentToggle = (comment: string) => {
    if (comment === "Autre") {
      // Pour "Autre", on ne le met pas dans selectedComments, on utilise customComment
      return;
    }
    setSelectedComments(prev =>
      prev.includes(comment) ? prev.filter(c => c !== comment) : [...prev, comment]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.numero.trim()) { setError("Le numéro est obligatoire"); return; }
    if (!formData.clientId) { setError("Le client est obligatoire"); return; }
    if (!formData.adresse.trim()) { setError("L'adresse est obligatoire"); return; }

    // Vérifier si la date prévue a changé
    if (originalDatePrevue !== formData.datePrevue) {
      // Ouvrir le modal avec les données actuelles
      setPendingFormData({ ...formData, balcons, structuresAchat });
      setShowDateChangeModal(true);
    } else {
      // Pas de changement de date, soumettre directement
      await submitForm(formData);
    }
  };

  const submitForm = async (dataToSend: any) => {
    setSaving(true);
    try {
      const payload = {
        ...dataToSend,
        prixTotal: dataToSend.prixTotal,
        piedsLineairesRampes: piedsLineairesTotaux,
        balcons: balcons.length > 0 ? balcons : undefined,
        structuresAchat: structuresAchat.length > 0 ? structuresAchat : undefined,
        representantId: dataToSend.representantId || null,
        couleur: dataToSend.couleur || null,
        couleurPersonnalisee: dataToSend.couleur === "AUTRE" ? dataToSend.couleurPersonnalisee : null,
        mesure: dataToSend.mesure || null,
        plan: dataToSend.plan || null,
        envoyeProduction: dataToSend.envoyeProduction || null,
        productionTerminee: dataToSend.productionTerminee || null,
        termine: dataToSend.termine || null,
        installation: dataToSend.installation || null,
        achatFibre: dataToSend.achatFibre || null,
        achatLimons: dataToSend.achatLimons || null,
        achatVerres: dataToSend.achatVerres || null,
        achatColonnes: dataToSend.achatColonnes || null,
        achatPeinture: dataToSend.achatPeinture || null,
        achatAttaches: dataToSend.achatAttaches || null,
        achatPlancherAluminium: dataToSend.achatPlancherAluminium || null,
        avertissementClient: dataToSend.avertissementClient || null,
        avertissementPriseMesure: dataToSend.avertissementPriseMesure || null,
      };

      const res = await fetch(`/api/commandes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push(`/dashboard/commandes/${params.id}`), 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleSendNotification = async () => {
    // Construire le commentaire complet
    let fullComment = selectedComments.join(" ");
    if (customComment.trim()) {
      fullComment += (fullComment ? " " : "") + customComment.trim();
    }
    if (!fullComment) fullComment = "Changement de date sans raison spécifiée.";

    // Destinataires
    const client = clients.find(c => c.id === formData.clientId);
    const representant = representants.find(r => r.id === formData.representantId);

    const toSms = sendToClientSms && client?.telephone ? [client.telephone] : [];
    const toEmails = [];
    if (sendToClientEmail && client?.emails?.length) toEmails.push(...client.emails);
    if (sendToRepresentantEmail && representant?.email) toEmails.push(representant.email);
    toEmails.push(...additionalEmails);

    // Préparer les données pour l'API
    const notificationData = {
      commande: {
        numero: formData.numero,
        reference: formData.reference,
        clientNom: client?.nom,
        representantNom: representant?.nom,
        representantEmail: representant?.email,
        representantTelephone: representant?.telephone,
        ville: client?.adresse?.split('\n')[0] || "", // approximation
        typeCommande: formData.typeCommande,
        couleur: formData.couleur === "AUTRE" ? formData.couleurPersonnalisee : formData.couleur,
        ancienneDate: originalDatePrevue,
        nouvelleDate: formData.datePrevue,
        raison: fullComment,
        enProduction: originalCommande?.enProduction || false,
      },
      toSms,
      toEmails,
    };

    try {
      const res = await fetch("/api/notifications/date-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      });
      if (!res.ok) {
        console.error("Erreur envoi notification");
      }
    } catch (err) {
      console.error("Erreur réseau notification", err);
    } finally {
      // Soumettre le formulaire
      setShowDateChangeModal(false);
      await submitForm(pendingFormData);
    }
  };

  const handleSaveWithoutNotification = async () => {
    setShowDateChangeModal(false);
    await submitForm(pendingFormData);
  };

  if (loading || configLoading) {
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
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
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

          {/* Couleur */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Couleur</label>
              <select value={formData.couleur} onChange={(e) => setFormData({ ...formData, couleur: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                {COULEUR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {formData.couleur === "AUTRE" && (
              <div>
                <label className="block text-sm font-medium mb-2">Couleur personnalisée</label>
                <input type="text" value={formData.couleurPersonnalisee} onChange={(e) => setFormData({ ...formData, couleurPersonnalisee: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
              </div>
            )}
          </div>

          {/* Reprise */}
          <div className="mt-4">
            <label className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <input type="checkbox" checked={formData.reprise} onChange={(e) => setFormData({ ...formData, reprise: e.target.checked })} className="w-5 h-5" />
              <span className="text-sm font-medium text-orange-700">Cette commande est une reprise</span>
            </label>
          </div>
          {formData.reprise && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Numéro de l'ancienne commande</label>
              <input type="text" value={formData.ancienneCommandeNumero} onChange={(e) => setFormData({ ...formData, ancienneCommandeNumero: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
            </div>
          )}

          {/* Adresse et commentaires */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Adresse</label>
            <input type="text" value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Commentaire adresse</label>
            <input type="text" value={formData.commentaireAdresse} onChange={(e) => setFormData({ ...formData, commentaireAdresse: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Commentaire général</label>
            <textarea value={formData.commentaire} onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })} rows={3} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.enProduction} onChange={(e) => setFormData({ ...formData, enProduction: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">En production</span>
            </label>
          </div>
        </Section>

        {/* SECTION 2: DATES ET PRIX */}
        <Section icon={<Calendar />} title="Dates et Prix" isOpen={activeSection === "dates"} onToggle={() => setActiveSection(activeSection === "dates" ? null : "dates")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-2">Date entrée</label><input type="date" value={formData.dateEntree} onChange={(e) => setFormData({ ...formData, dateEntree: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Date prévue *</label><input type="date" value={formData.datePrevue} onChange={(e) => setFormData({ ...formData, datePrevue: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Date production (auto)</label><input type="date" value={formData.dateProduction} readOnly className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500" /></div>
            <div><label className="block text-sm font-medium mb-2">Semaine prévue</label><div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 font-semibold">{formData.datePrevue ? `S${Math.ceil(((new Date(formData.datePrevue).getTime() - new Date(new Date(formData.datePrevue).getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}` : "—"}</div></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div><label className="block text-sm font-medium mb-2">Prix total ($)</label><input type="number" step="0.01" value={formData.prixTotal} onChange={(e) => setFormData({ ...formData, prixTotal: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Prix installation ($)</label><input type="number" step="0.01" value={formData.prixVenteInstallation} onChange={(e) => setFormData({ ...formData, prixVenteInstallation: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Prix matériaux (auto)</label><div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xl font-bold text-gray-900 dark:text-white">{formData.prixVenteMateriaux.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}</div></div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Temps installation estimé (h)</label>
              <input type="number" step="0.1" value={formData.tempsEstimeInstallation} onChange={(e) => setFormData({ ...formData, tempsEstimeInstallation: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.utiliserCalculAuto} onChange={(e) => setFormData({ ...formData, utiliserCalculAuto: e.target.checked })} className="w-4 h-4" />
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
                <label className="block text-sm font-medium mb-2">{f.label} (×{f.facteur})</label>
                <input type="number" min="0" value={formData[f.key as keyof typeof formData] as number || 0} onChange={(e) => setFormData({ ...formData, [f.key]: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de poteaux</label>
              <input type="number" min="0" value={formData.nombrePoteaux} onChange={(e) => setFormData({ ...formData, nombrePoteaux: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SymbolSelect label="Mesure" value={formData.mesure} onChange={(v) => setFormData({ ...formData, mesure: v })} options={CODE_PRODUCTION_OPTIONS} />
            <div><label className="block text-sm font-medium mb-2">Mesure donnée le</label><input type="date" value={formData.mesureDonneeLe} onChange={(e) => setFormData({ ...formData, mesureDonneeLe: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl" /></div>
            <SymbolSelect label="Plan" value={formData.plan} onChange={(v) => setFormData({ ...formData, plan: v })} options={CODE_PRODUCTION_OPTIONS} />
            <SymbolSelect label="Envoyé production" value={formData.envoyeProduction} onChange={(v) => setFormData({ ...formData, envoyeProduction: v })} options={CODE_PRODUCTION_OPTIONS} />
            <SymbolSelect label="Production terminée" value={formData.productionTerminee} onChange={(v) => setFormData({ ...formData, productionTerminee: v })} options={CODE_PRODUCTION_OPTIONS} />
            <SymbolSelect label="Terminé" value={formData.termine} onChange={(v) => setFormData({ ...formData, termine: v })} options={CODE_PRODUCTION_OPTIONS} />
            <SymbolSelect label="Installation" value={formData.installation} onChange={(v) => setFormData({ ...formData, installation: v })} options={CODE_PRODUCTION_OPTIONS} />
            <div>
              <label className="block text-sm font-medium mb-2">Statut livraison</label>
              <select value={formData.statutLivraison} onChange={(e) => setFormData({ ...formData, statutLivraison: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                {STATUT_LIVRAISON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* SECTION 5: ACHATS */}
        <Section icon={<ShoppingCart />} title="Achats" isOpen={activeSection === "achats"} onToggle={() => setActiveSection(activeSection === "achats" ? null : "achats")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AchatEditField
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
            <AchatEditField
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
            <AchatEditField
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
            <AchatEditField
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
            <AchatEditField
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
            <AchatEditField
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
            <AchatEditField
              label="Plancher alu."
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
            <label className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <input type="checkbox" checked={formData.structure} onChange={(e) => setFormData({ ...formData, structure: e.target.checked })} className="w-5 h-5" />
              <span className="text-sm font-medium text-purple-700">Ajouter des structures d'achat</span>
            </label>
          </div>

          {/* Structures d'achat */}
          {formData.structure && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Structures d'achat</h4>
                <button type="button" onClick={addStructure} className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm">
                  <Plus size={16} /> Ajouter
                </button>
              </div>
              {structuresAchat.map((s, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <input type="text" value={s.nom} onChange={(e) => updateStructure(i, "nom", e.target.value)} placeholder="Nom" className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
                    <button type="button" onClick={() => removeStructure(i)} className="ml-2 p-2 text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select value={s.statutAchat} onChange={(e) => updateStructure(i, "statutAchat", e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm">
                      {STATUT_ACHAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.symbol} {o.label}</option>)}
                    </select>
                    <input type="date" value={s.dateEnvoie || ""} onChange={(e) => updateStructure(i, "dateEnvoie", e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
                    <input type="date" value={s.dateReception || ""} onChange={(e) => updateStructure(i, "dateReception", e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
                    <input type="number" min="0" value={s.quantiteNonRecue || 0} onChange={(e) => updateStructure(i, "quantiteNonRecue", parseInt(e.target.value) || 0)} placeholder="Qté non reçue" className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* SECTION 6: AVERTISSEMENTS */}
        <Section icon={<AlertTriangle />} title="Avertissements" isOpen={activeSection === "avertissements"} onToggle={() => setActiveSection(activeSection === "avertissements" ? null : "avertissements")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SymbolSelect label="Avertissement client" value={formData.avertissementClient} onChange={(v) => setFormData({ ...formData, avertissementClient: v })} options={AVERTISSEMENT_CLIENT_OPTIONS} />
            <SymbolSelect label="Avertissement mesure" value={formData.avertissementPriseMesure} onChange={(v) => setFormData({ ...formData, avertissementPriseMesure: v })} options={AVERTISSEMENT_MESURE_OPTIONS} />
          </div>
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

      {/* MODAL D'AVIS DE CHANGEMENT DE DATE */}
      {showDateChangeModal && pendingFormData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Avis de changement de date</h3>
              <button onClick={() => setShowDateChangeModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Informations commande */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Commande:</span> <span className="font-medium">{pendingFormData.numero}</span></div>
                <div><span className="text-gray-500">Référence:</span> <span>{pendingFormData.reference || "—"}</span></div>
                <div><span className="text-gray-500">Client:</span> <span className="font-medium">{clients.find(c => c.id === pendingFormData.clientId)?.nom}</span></div>
                <div><span className="text-gray-500">Représentant:</span> <span>{representants.find(r => r.id === pendingFormData.representantId)?.nom || "—"}</span></div>
                <div><span className="text-gray-500">Ville:</span> <span>{clients.find(c => c.id === pendingFormData.clientId)?.adresse?.split('\n')[0] || "—"}</span></div>
                <div><span className="text-gray-500">Type:</span> <span>{pendingFormData.typeCommande}</span></div>
                <div><span className="text-gray-500">Couleur:</span> <span>{pendingFormData.couleur === "AUTRE" ? pendingFormData.couleurPersonnalisee : pendingFormData.couleur || "—"}</span></div>
              </div>
              <div className="mt-2 flex gap-4">
                <div><span className="text-gray-500">Ancienne date:</span> <span className="line-through">{originalDatePrevue ? new Date(originalDatePrevue).toLocaleDateString('fr-CA') : "—"}</span></div>
                <div><span className="text-gray-500">Nouvelle date:</span> <span className="font-bold text-blue-600">{pendingFormData.datePrevue ? new Date(pendingFormData.datePrevue).toLocaleDateString('fr-CA') : "—"}</span></div>
              </div>
            </div>

            {/* Alerte si commande en production */}
            {originalCommande?.enProduction && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Attention: Cette commande est déjà en production. Un changement de date peut avoir un impact important.
                </p>
              </div>
            )}

            {/* Raisons prédéfinies */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Raison du changement (vous pouvez en sélectionner plusieurs)</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {PREDEFINED_COMMENTS.map((comment, idx) => (
                  <label key={idx} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment) || (comment === "Autre" && customComment !== "")}
                      onChange={() => handleCommentToggle(comment)}
                      disabled={comment === "Autre"}
                      className="mt-1"
                    />
                    <span className="text-sm">{comment}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Commentaire personnalisé */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Commentaire personnalisé (si "Autre" est coché ou pour compléter)</label>
              <textarea
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                rows={3}
                placeholder="Écrivez votre message ici..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>

            {/* Destinataires */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Envoyer à :</label>
              <div className="space-y-2">
                {clients.find(c => c.id === pendingFormData.clientId)?.telephone && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={sendToClientSms} onChange={(e) => setSendToClientSms(e.target.checked)} />
                    <span className="text-sm">📱 Client (SMS) : {clients.find(c => c.id === pendingFormData.clientId)?.telephone}</span>
                  </label>
                )}
                {clients.find(c => c.id === pendingFormData.clientId)?.emails?.map((email, idx) => (
                  <label key={idx} className="flex items-center gap-2">
                    <input type="checkbox" checked={sendToClientEmail} onChange={(e) => setSendToClientEmail(e.target.checked)} />
                    <span className="text-sm">📧 Client : {email}</span>
                  </label>
                ))}
                {representants.find(r => r.id === pendingFormData.representantId)?.email && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={sendToRepresentantEmail} onChange={(e) => setSendToRepresentantEmail(e.target.checked)} />
                    <span className="text-sm">📧 Représentant : {representants.find(r => r.id === pendingFormData.representantId)?.email}</span>
                  </label>
                )}
                {/* Emails supplémentaires */}
                {additionalEmails.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm">📧 {email}</span>
                    <button onClick={() => handleRemoveEmail(email)} className="text-red-500 text-xs">Supprimer</button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Ajouter un email"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                  <button onClick={handleAddEmail} className="px-3 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm">Ajouter</button>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSaveWithoutNotification}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
              >
                Modifier sans envoyer d'avis
              </button>
              <button
                onClick={handleSendNotification}
                className="flex-1 px-4 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Send size={18} /> Envoyer l'avis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composants auxiliaires (Section, SymbolSelect, AchatEditField) – identiques à ceux de la page de création
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

function AchatEditField({ label, statut, dateEnvoie, dateReception, quantiteNonRecue, onStatutChange, onDateEnvoieChange, onDateReceptionChange, onQuantiteChange }: {
  label: string; statut: string; dateEnvoie: string; dateReception: string; quantiteNonRecue: number;
  onStatutChange: (v: string) => void; onDateEnvoieChange: (v: string) => void; onDateReceptionChange: (v: string) => void; onQuantiteChange: (v: number) => void;
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
      <label className="block text-sm font-semibold mb-3">{label}</label>
      <div className="space-y-2">
        <select value={statut} onChange={(e) => onStatutChange(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm">
          {STATUT_ACHAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.symbol} {o.label}</option>)}
        </select>
        <div>
          <label className="block text-xs text-gray-500">Date d'envoi</label>
          <input type="date" value={dateEnvoie} onChange={(e) => onDateEnvoieChange(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Date de réception</label>
          <input type="date" value={dateReception} onChange={(e) => onDateReceptionChange(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Quantité non reçue</label>
          <input type="number" min="0" value={quantiteNonRecue || 0} onChange={(e) => onQuantiteChange(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
        </div>
      </div>
    </div>
  );
}