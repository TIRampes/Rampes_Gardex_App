"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, MapPin, Loader2, X, Home, MessageSquare, Phone, Mail, User, Building2 } from "lucide-react";

// Définir les types
type ClientType = "ENTREPRENEUR" | "RESIDENTIEL" | "DISTRIBUTEUR" | "AMBASSADEUR";
type ZoneResidentielle = "RIVE_NORD" | "RIVE_SUD";

const clientTypes: { value: ClientType; label: string }[] = [
  { value: "ENTREPRENEUR", label: "Entrepreneur" },
  { value: "RESIDENTIEL", label: "Résidentiel" },
  { value: "DISTRIBUTEUR", label: "Distributeur" },
  { value: "AMBASSADEUR", label: "Ambassadeur" },
];

const zonesResidentielles: { value: ZoneResidentielle; label: string }[] = [
  { value: "RIVE_NORD", label: "Rive Nord" },
  { value: "RIVE_SUD", label: "Rive Sud" },
];

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<{field: string; message: string} | null>(null);
  const [emailErrors, setEmailErrors] = useState<boolean[]>([]); // Pour suivre les erreurs d'email par index
  const [formData, setFormData] = useState({
    nom: "",
    type: "ENTREPRENEUR" as ClientType,
    zoneResidentielle: "" as ZoneResidentielle | "",
    adresse: "",
    ville: "",
    province: "",
    codePostal: "",
    pays: "",
    telephone: "",
    cellulaire: "",
    fax: "",
    personne_Contact: "",
    emails: [""],
    communicationTexto: false,
    communicationCourriel: true,
    communicationTelephone: false,
    commentaires: "",
  });

  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fonction de validation d'email
  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Email vide est acceptable (non requis)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Mettre à jour les erreurs d'email quand les emails changent
  useEffect(() => {
    const errors = formData.emails.map(email => !validateEmail(email));
    setEmailErrors(errors);
  }, [formData.emails]);

  // Vérifier s'il y a des erreurs d'email
  const hasEmailErrors = (): boolean => {
    return formData.emails.some(email => email.trim() !== "" && !validateEmail(email));
  };

  // Fermer les suggestions quand on clique dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchClient();
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      if (mapRef.current) {
        const map = new window.google.maps.Map(mapRef.current, { center: { lat: 45.5017, lng: -73.5673 }, zoom: 10 });
        placesService.current = new window.google.maps.places.PlacesService(map);
      }
    }
  }, [id]);

  // Formatage automatique du téléphone
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (field: "telephone" | "cellulaire" | "fax", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: formatPhoneNumber(value) }));
  };

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          nom: data.nom,
          type: data.type,
          zoneResidentielle: data.zoneResidentielle || "",
          adresse: data.adresse,
          ville: data.ville || "",
          province: data.province || "",
          codePostal: data.codePostal || "",
          pays: data.pays || "",
          telephone: data.telephone,
          cellulaire: data.cellulaire || "",
          fax: data.fax || "",
          personne_Contact: data.personne_Contact,
          emails: data.emails && data.emails.length > 0 ? data.emails : [""],
          communicationTexto: data.communicationTexto,
          communicationCourriel: data.communicationCourriel,
          communicationTelephone: data.communicationTelephone,
          commentaires: data.commentaires || "",
        });
        // Construire l'adresse affichée
        const addressParts = [data.adresse, data.ville, data.province].filter(Boolean);
        setAddressInput(addressParts.join(", "));
      } else {
        router.push("/dashboard/clients");
      }
    } catch {
      router.push("/dashboard/clients");
    } finally {
      setFetching(false);
    }
  };

  // Gestion des préférences de communication (un seul choix possible)
  const handleCommunicationChange = (type: "texto" | "courriel" | "telephone") => {
    setFormData((prev) => ({
      ...prev,
      communicationTexto: type === "texto",
      communicationCourriel: type === "courriel",
      communicationTelephone: type === "telephone",
    }));
  };

  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    setFormData((prev) => ({ ...prev, adresse: value }));
    if (value.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        { input: value, componentRestrictions: { country: "ca" }, types: ["address"] },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        },
      );
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectAddress = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;
    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ["address_components", "formatted_address"] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          let streetNumber = "",
            streetName = "",
            city = "",
            province = "",
            country = "",
            postalCode = "";
          place.address_components?.forEach((c) => {
            if (c.types.includes("street_number")) streetNumber = c.long_name;
            if (c.types.includes("route")) streetName = c.long_name;
            if (c.types.includes("locality")) city = c.long_name;
            if (c.types.includes("administrative_area_level_1")) province = c.long_name;
            if (c.types.includes("country")) country = c.long_name;
            if (c.types.includes("postal_code")) postalCode = c.long_name;
          });
          const fullAddress = streetNumber ? `${streetNumber} ${streetName}` : streetName;
          setFormData((prev) => ({
            ...prev,
            adresse: fullAddress,
            ville: city,
            province: province,
            pays: country,
            codePostal: postalCode,
          }));
          setAddressInput(place.formatted_address || prediction.description);
          setShowSuggestions(false);
        }
      },
    );
  };

  const addEmail = () => {
    setFormData((prev) => ({ ...prev, emails: [...prev.emails, ""] }));
  };

  const removeEmail = (index: number) => {
    setFormData((prev) => ({ ...prev, emails: prev.emails.filter((_, i) => i !== index) }));
  };

  const updateEmail = (index: number, value: string) => {
    setFormData((prev) => ({ ...prev, emails: prev.emails.map((e, i) => (i === index ? value : e)) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validations
    if (!formData.nom.trim()) {
      setError({ field: "nom", message: "Le nom est obligatoire" });
      setLoading(false);
      return;
    }

    if (!formData.telephone.trim()) {
      setError({ field: "telephone", message: "Le téléphone est obligatoire" });
      setLoading(false);
      return;
    }

    if (!formData.personne_Contact.trim()) {
      setError({ field: "personne_Contact", message: "La personne contact est obligatoire" });
      setLoading(false);
      return;
    }

    // Validation zone résidentielle si le type est résidentiel
    if (formData.type === "RESIDENTIEL" && !formData.zoneResidentielle) {
      setError({ field: "zoneResidentielle", message: "La zone résidentielle est obligatoire pour les clients résidentiels" });
      setLoading(false);
      return;
    }

    // VALIDATION DES EMAILS - Nouvelle validation
    const invalidEmails = formData.emails.filter(email => email.trim() !== "" && !validateEmail(email));
    if (invalidEmails.length > 0) {
      setError({ field: "emails", message: "Un ou plusieurs emails ne sont pas valides. Veuillez vérifier le format." });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          emails: formData.emails.filter((e) => e.trim() !== ""),
          zoneResidentielle: formData.type === "RESIDENTIEL" ? formData.zoneResidentielle : null,
        }),
      });

      if (res.ok) {
        router.push(`/dashboard/clients/${id}`);
      } else {
        const error = await res.json();
        setError({ field: "general", message: error.error || "Erreur lors de la modification" });
      }
    } catch {
      setError({ field: "general", message: "Erreur lors de la modification" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 pb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Modifier le client</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{formData.nom}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <div className="text-red-600">
            {error.field === "nom" && "❌ "}
            {error.field === "telephone" && "📞 "}
            {error.field === "personne_Contact" && "👤 "}
            {error.field === "zoneResidentielle" && "🏠 "}
            {error.field === "emails" && "📧 "}
          </div>
          <p className="text-red-700 dark:text-red-400 text-sm flex-1">{error.message}</p>
          <button onClick={() => setError(null)} className="text-red-600">
            <X size={18} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Section Informations de base */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-[var(--color-primary)]" />
            Informations de base
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Nom du client
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === "nom" ? "border-red-500" : "border-gray-200 dark:border-gray-700"} rounded-xl text-gray-900 dark:text-white`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type de client</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as ClientType, zoneResidentielle: "" })
                }
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              >
                {clientTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Zone Résidentielle - Apparaît seulement pour le type RÉSIDENTIEL */}
          {formData.type === "RESIDENTIEL" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Zone résidentielle
              </label>
              <div className="grid grid-cols-2 gap-3">
                {zonesResidentielles.map((zone) => (
                  <button
                    key={zone.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, zoneResidentielle: zone.value })}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      formData.zoneResidentielle === zone.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    } ${error?.field === "zoneResidentielle" ? "border-red-500" : ""}`}
                  >
                    <Home size={18} />
                    <span className="font-medium">{zone.label}</span>
                  </button>
                ))}
              </div>
              {error?.field === "zoneResidentielle" && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
            </div>
          )}
        </div>

        {/* Section Adresse */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-[var(--color-primary)]" />
            Adresse
          </h2>
          <div className="relative" ref={suggestionsRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="text-red-500">*</span> Adresse
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={addressInput}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                required
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.place_id}
                    type="button"
                    onClick={() => handleSelectAddress(s)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b last:border-0"
                  >
                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white text-sm truncate">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
            <div ref={mapRef} className="hidden" />
          </div>

          {/* Info adresse extraite */}
          {formData.ville && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500">Ville</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.ville}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Province</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.province || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pays</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.pays || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Code Postal</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.codePostal || "—"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Section Coordonnées */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Phone size={20} className="text-[var(--color-primary)]" />
            Coordonnées
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="text-red-500">*</span> Personne contact
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.personne_Contact}
                onChange={(e) => setFormData({ ...formData, personne_Contact: e.target.value })}
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                  error?.field === "personne_Contact" ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-xl text-gray-900 dark:text-white`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handlePhoneChange("telephone", e.target.value)}
                placeholder="514-555-0000"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                  error?.field === "telephone" ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                } rounded-xl text-gray-900 dark:text-white`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cellulaire</label>
              <input
                type="tel"
                value={formData.cellulaire}
                onChange={(e) => handlePhoneChange("cellulaire", e.target.value)}
                placeholder="514-555-0000"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fax</label>
              <input
                type="tel"
                value={formData.fax}
                onChange={(e) => handlePhoneChange("fax", e.target.value)}
                placeholder="514-555-0000"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section Préférences de communication */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-[var(--color-primary)]" />
            Préférences de communication
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleCommunicationChange("texto")}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                formData.communicationTexto
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <span className="font-medium">Texto</span>
              </div>
              {formData.communicationTexto && <span className="text-blue-600 text-sm font-medium">✓ Sélectionné</span>}
            </button>

            <button
              type="button"
              onClick={() => handleCommunicationChange("courriel")}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                formData.communicationCourriel
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">✉️</span>
                <span className="font-medium">Courriel</span>
              </div>
              {formData.communicationCourriel && (
                <span className="text-blue-600 text-sm font-medium">✓ Sélectionné</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleCommunicationChange("telephone")}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                formData.communicationTelephone
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">📞</span>
                <span className="font-medium">Téléphone</span>
              </div>
              {formData.communicationTelephone && (
                <span className="text-blue-600 text-sm font-medium">✓ Sélectionné</span>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Un seul mode de communication peut être sélectionné à la fois</p>
        </div>

        {/* Section Emails - AVEC VALIDATION EN TEMPS RÉEL */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Mail size={20} className="text-[var(--color-primary)]" />
              Courriels
            </h2>
            <button
              type="button"
              onClick={addEmail}
              className="text-sm font-medium px-3 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
            >
              + Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {formData.emails.map((email, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(i, e.target.value)}
                    placeholder={`Courriel ${i + 1}`}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                      email.trim() !== "" && !validateEmail(email)
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    } rounded-xl text-gray-900 dark:text-white`}
                  />
                  {email.trim() !== "" && !validateEmail(email) && (
                    <p className="text-xs text-red-500 mt-1">Format d'email invalide</p>
                  )}
                </div>
                {formData.emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmail(i)}
                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {hasEmailErrors() && (
            <p className="text-xs text-red-500 mt-2">Veuillez corriger les emails invalides avant d'enregistrer</p>
          )}
        </div>

        {/* Section Commentaires */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaires</label>
          <textarea
            value={formData.commentaires}
            onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white resize-none"
            placeholder="Notes additionnelles..."
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || hasEmailErrors()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}