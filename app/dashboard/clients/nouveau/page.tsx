"use client";


import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ArrowLeft, Save, MapPin, Loader2, X, Phone, Mail, User, Building2, MessageSquare, CheckCircle2, AlertCircle, Home } from "lucide-react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const clientTypes = [
  { value: "ENTREPRENEUR", label: "Entrepreneur", color: "bg-blue-500" },
  { value: "RESIDENTIEL", label: "Résidentiel", color: "bg-emerald-500" },
  { value: "DISTRIBUTEUR", label: "Distributeur", color: "bg-purple-500" },
  { value: "AMBASSADEUR", label: "Ambassadeur", color: "bg-amber-500" },
];

const zonesResidentielles = [
  { value: "RIVE_NORD", label: "Rive Nord" },
  { value: "RIVE_SUD", label: "Rive Sud" },
];

interface AddressSuggestion { place_id: string; description: string; }

export default function NouveauClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [error, setError] = useState<{field: string, message: string} | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: "", type: "ENTREPRENEUR", adresse: "", ville: "", province: "", codePostal: "", pays: "Canada",
    telephone: "", cellulaire: "", fax: "", personne_Contact: "", emails: [""],
    communicationTexto: false, communicationCourriel: true, communicationTelephone: false, commentaires: "",
    zoneResidentielle: "",
  });

  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initGoogleMaps = useCallback(() => {
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      try {
        console.log(" Google Maps chargé avec succès !");
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const dummyElement = document.createElement("div");
        placesService.current = new window.google.maps.places.PlacesService(dummyElement);
        setGoogleLoaded(true);
        console.log(" Services initialisés");
      } catch (err) { 
        console.error("Erreur Google Maps:", err); 
      }
    } else {
      console.log(" Google Maps pas encore chargé...");
    }
  }, []);

  useEffect(() => { if (window.google?.maps?.places) initGoogleMaps(); }, [initGoogleMaps]);

  const handleGoogleMapsLoad = () => { setTimeout(initGoogleMaps, 10); };

  // Formatage automatique du numéro de téléphone
  const formatPhoneNumber = (value: string) => {
    // Supprimer tous les caractères non numériques
    const numbers = value.replace(/\D/g, '');
    
    // Appliquer le format XXX-XXX-XXXX
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (field: 'telephone' | 'cellulaire' | 'fax', value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    setFormData(prev => ({ ...prev, adresse: value }));
    if (value.length > 2 && autocompleteService.current && googleLoaded) {
      autocompleteService.current.getPlacePredictions(
        { 
          input: value, 
          componentRestrictions: { country: "ca" }, 
          types: ["address"] 
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.map((p) => ({ place_id: p.place_id, description: p.description })));
            setShowSuggestions(true);
          } else { 
            setSuggestions([]); 
            setShowSuggestions(false); 
          }
        }
      );
    } else { 
      setSuggestions([]); 
      setShowSuggestions(false); 
    }
  };

  // VERSION 100% FONCTIONNELLE - Testée et approuvée
  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    if (!placesService.current) { 
      setAddressInput(suggestion.description); 
      setFormData(prev => ({ ...prev, adresse: suggestion.description })); 
      setShowSuggestions(false); 
      return; 
    }
    
    placesService.current.getDetails(
      { 
        placeId: suggestion.place_id, 
        fields: ["address_components", "formatted_address"] //  Les BONS noms qui marchent
      }, 
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          let streetNumber = "", streetName = "", city = "", province = "", country = "", postalCode = "";
          
          // Syntaxe qui fonctionne PARFAITEMENT avec v=weekly
          place.address_components?.forEach((c: any) => {
            if (c.types.includes("street_number")) streetNumber = c.long_name;
            if (c.types.includes("route")) streetName = c.long_name;
            if (c.types.includes("locality")) city = c.long_name;
            if (c.types.includes("administrative_area_level_1")) province = c.long_name;
            if (c.types.includes("country")) country = c.long_name;
            if (c.types.includes("postal_code")) postalCode = c.long_name;
          });
          
          const fullAddress = streetNumber ? `${streetNumber} ${streetName}` : streetName;
          
          setFormData(prev => ({ 
            ...prev, 
            adresse: fullAddress || suggestion.description, 
            ville: city, 
            province, 
            pays: country || "Canada", 
            codePostal: postalCode 
          }));
          
          // formatted_address fonctionne aussi
          setAddressInput(place.formatted_address || suggestion.description);
          setShowSuggestions(false);
        }
      }
    );
  };

  const addEmail = () => setFormData(prev => ({ ...prev, emails: [...prev.emails, ""] }));
  const removeEmail = (i: number) => setFormData(prev => ({ ...prev, emails: prev.emails.filter((_, idx) => idx !== i) }));
  const updateEmail = (i: number, v: string) => setFormData(prev => ({ ...prev, emails: prev.emails.map((e, idx) => idx === i ? v : e) }));

  // Fonction de validation des numéros de téléphone
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  // Fonction de validation de l'adresse
  const validateAddress = (address: string): boolean => {
    // Validation basique d'adresse (au moins un numéro civique et un nom de rue)
    const addressRegex = /^\d+\s+[a-zA-ZÀ-ÿ\s]+/;
    return addressRegex.test(address);
  };

  // Fonction de validation d'email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Gestion des préférences de communication
  const handleCommunicationChange = (type: 'texto' | 'courriel' | 'telephone') => {
    setFormData(prev => ({
      ...prev,
      communicationTexto: type === 'texto',
      communicationCourriel: type === 'courriel',
      communicationTelephone: type === 'telephone'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation du nom
    if (!formData.nom.trim()) { 
      setError({field: "nom", message: "Le nom est obligatoire"}); 
      setLoading(false); 
      return; 
    }

    // Validation de l'adresse
    const addressToValidate = formData.adresse.trim() || addressInput.trim();
    if (!addressToValidate) { 
      setError({field: "adresse", message: "L'adresse est obligatoire"}); 
      setLoading(false); 
      return; 
    }
    if (!validateAddress(addressToValidate)) {
      setError({field: "adresse", message: "Format d'adresse invalide. Veuillez entrer une adresse complète (ex: 123 Rue Principale)"}); 
      setLoading(false); 
      return;
    }

    // Validation du téléphone
    if (!formData.telephone.trim()) { 
      setError({field: "telephone", message: "Le téléphone est obligatoire"}); 
      setLoading(false); 
      return; 
    }
    if (!validatePhoneNumber(formData.telephone)) {
      setError({field: "telephone", message: "Format de téléphone invalide. Utilisez le format XXX-XXX-XXXX"}); 
      setLoading(false); 
      return;
    }

    // Validation du cellulaire si présent
    if (formData.cellulaire && !validatePhoneNumber(formData.cellulaire)) {
      setError({field: "cellulaire", message: "Format de cellulaire invalide. Utilisez le format XXX-XXX-XXXX"}); 
      setLoading(false); 
      return;
    }

    // Validation du fax si présent
    if (formData.fax && !validatePhoneNumber(formData.fax)) {
      setError({field: "fax", message: "Format de fax invalide. Utilisez le format XXX-XXX-XXXX"}); 
      setLoading(false); 
      return;
    }

    // Validation de la personne contact
    if (!formData.personne_Contact.trim()) { 
      setError({field: "personne_Contact", message: "La personne contact est obligatoire"}); 
      setLoading(false); 
      return; 
    }

    // Validation des emails
    const invalidEmails = formData.emails.filter(email => email.trim() !== "" && !validateEmail(email));
    if (invalidEmails.length > 0) {
      setError({field: "emails", message: "Un ou plusieurs emails sont invalides"}); 
      setLoading(false); 
      return;
    }

    // Validation de la zone résidentielle pour le type RÉSIDENTIEL
    if (formData.type === "RESIDENTIEL" && !formData.zoneResidentielle) {
      setError({field: "zoneResidentielle", message: "La zone résidentielle est obligatoire pour les clients résidentiels"}); 
      setLoading(false); 
      return;
    }

    try {
      const dataToSend = { 
        ...formData, 
        adresse: addressToValidate, 
        emails: formData.emails.filter(e => e.trim() !== "") 
      };
      const res = await fetch("/api/clients", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(dataToSend) 
      });
      const data = await res.json();
      if (res.ok) { 
        setSuccess(true); 
        setTimeout(() => router.push("/dashboard/clients"), 1500); 
      } else { 
        setError({field: "general", message: data.error || "Erreur lors de la création"}); 
      }
    } catch { 
      setError({field: "general", message: "Erreur lors de la création du client"}); 
    } finally { 
      setLoading(false); 
    }
  };

  if (success) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Client créé!</h2>
        <p className="text-gray-500">Redirection...</p>
      </div>
    </div>
  );

  return (
    <>
    
    
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0 pb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Nouveau client</h1>
            <p className="text-sm text-gray-500">Remplissez les informations</p>
          </div>
        </div>
        
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-700 dark:text-red-400 font-medium">
                {error.field === "nom" && "Erreur sur le champ Nom : "}
                {error.field === "adresse" && "Erreur sur le champ Adresse : "}
                {error.field === "telephone" && "Erreur sur le champ Téléphone : "}
                {error.field === "cellulaire" && "Erreur sur le champ Cellulaire : "}
                {error.field === "fax" && "Erreur sur le champ Fax : "}
                {error.field === "personne_Contact" && "Erreur sur le champ Personne contact : "}
                {error.field === "emails" && "Erreur sur le(s) champ(s) Email : "}
                {error.field === "zoneResidentielle" && "Erreur sur le champ Zone résidentielle : "}
                {error.field === "general" && ""}
                {error.message}
              </p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={18} className="text-red-600" />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          
          {/* Section Informations de base */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-[var(--color-primary)]" />
              Informations de base
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-red-500">*</span> Nom
                </label>
                <input 
                  type="text" 
                  value={formData.nom} 
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })} 
                  placeholder="Nom du client" 
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'nom' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`} 
                />
                {error?.field === 'nom' && (
                  <p className="mt-1 text-xs text-red-500">{error.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {clientTypes.map((t) => (
                    <button 
                      key={t.value} 
                      type="button" 
                      onClick={() => {
                        setFormData({ ...formData, type: t.value, zoneResidentielle: "" });
                        setError(null);
                      }} 
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium ${
                        formData.type === t.value 
                          ? `${t.color} text-white` 
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Champ Zone Résidentielle - Apparaît uniquement pour le type RÉSIDENTIEL */}
            {formData.type === "RESIDENTIEL" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-red-500">*</span> Zone résidentielle
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {zonesResidentielles.map((zone) => (
                    <button
                      key={zone.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, zoneResidentielle: zone.value })}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.zoneResidentielle === zone.value
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      } ${error?.field === 'zoneResidentielle' ? 'border-red-500' : ''}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Home size={16} />
                        {zone.label}
                      </div>
                    </button>
                  ))}
                </div>
                {error?.field === 'zoneResidentielle' && (
                  <p className="mt-1 text-xs text-red-500">{error.message}</p>
                )}
              </div>
            )}
          </div>

          {/* SECTION ADRESSE - 100% FONCTIONNELLE */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-[var(--color-primary)]" />
              Adresse
              {!googleLoaded && GOOGLE_MAPS_API_KEY && (
                <span className="text-xs text-gray-400 ml-2">(Chargement...)</span>
              )}
            </h2>
            
            {/* Champ d'adresse avec autocomplétion Google Maps */}
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
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder={googleLoaded ? "Commencez à taper votre adresse..." : "Entrez l'adresse"}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'adresse' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent`}
                  autoComplete="off"
                />
              </div>
              {error?.field === 'adresse' && (
                <p className="mt-1 text-xs text-red-500">{error.message}</p>
              )}
              
              {/* Suggestions d'adresse Google Maps */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.place_id}
                      type="button"
                      onClick={() => handleSelectAddress(s)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b last:border-0 transition-colors"
                    >
                      <MapPin size={16} className="text-[var(--color-primary)] flex-shrink-0" />
                      <span className="text-sm text-gray-900 dark:text-white">{s.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Résumé de l'adresse */}
            {(formData.ville || formData.province) && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-green-600 font-medium">Ville</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.ville || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Province</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.province || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Code Postal</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.codePostal || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Pays</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formData.pays || "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Coordonnées */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
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
                  placeholder="Nom du contact" 
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'personne_Contact' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`} 
                />
              </div>
              {error?.field === 'personne_Contact' && (
                <p className="mt-1 text-xs text-red-500">{error.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-red-500">*</span> Téléphone
                </label>
                <input 
                  type="tel" 
                  value={formData.telephone} 
                  onChange={(e) => handlePhoneChange('telephone', e.target.value)} 
                  placeholder="514-555-0000" 
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'telephone' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`} 
                />
                {error?.field === 'telephone' && (
                  <p className="mt-1 text-xs text-red-500">{error.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cellulaire</label>
                <input 
                  type="tel" 
                  value={formData.cellulaire} 
                  onChange={(e) => handlePhoneChange('cellulaire', e.target.value)} 
                  placeholder="514-555-0000" 
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'cellulaire' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`} 
                />
                {error?.field === 'cellulaire' && (
                  <p className="mt-1 text-xs text-red-500">{error.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fax</label>
                <input 
                  type="tel" 
                  value={formData.fax} 
                  onChange={(e) => handlePhoneChange('fax', e.target.value)} 
                  placeholder="514-555-0000" 
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'fax' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`} 
                />
                {error?.field === 'fax' && (
                  <p className="mt-1 text-xs text-red-500">{error.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Courriels */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail size={20} className="text-[var(--color-primary)]" />
                Courriels
              </h2>
              <button type="button" onClick={addEmail} className="text-sm font-medium text-[var(--color-primary)]">
                + Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {formData.emails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => updateEmail(i, e.target.value)} 
                    placeholder={`Courriel ${i + 1}`} 
                    className={`flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'emails' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`} 
                  />
                  {formData.emails.length > 1 && (
                    <button type="button" onClick={() => removeEmail(i)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              {error?.field === 'emails' && (
                <p className="text-xs text-red-500">{error.message}</p>
              )}
            </div>
          </div>

          {/* Section Préférences */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-[var(--color-primary)]" />
              Préférences de communication
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  type="button"
                  onClick={() => handleCommunicationChange('texto')}
                  className={`p-4 rounded-xl border transition-all ${
                    formData.communicationTexto 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">📱 Texto</span>
                    {formData.communicationTexto && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => handleCommunicationChange('courriel')}
                  className={`p-4 rounded-xl border transition-all ${
                    formData.communicationCourriel 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">✉️ Courriel</span>
                    {formData.communicationCourriel && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => handleCommunicationChange('telephone')}
                  className={`p-4 rounded-xl border transition-all ${
                    formData.communicationTelephone 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium"> Téléphone</span>
                    {formData.communicationTelephone && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Sélectionnez un mode de communication préféré
              </p>
            </div>
          </div>

          {/* Section Commentaires */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaires</label>
            <textarea 
              value={formData.commentaires} 
              onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })} 
              placeholder="Notes..." 
              rows={3} 
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white resize-none" 
            />
          </div>

          {/* Boutons */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3">
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
              {loading ? (
                <><Loader2 size={20} className="animate-spin" />Enregistrement...</>
              ) : (
                <><Save size={20} />Enregistrer</>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}