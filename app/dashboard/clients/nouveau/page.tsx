"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
//import Script from "next/script";
import { ArrowLeft, Save, MapPin, Loader2, X, Phone, Mail, User, Building2, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const clientTypes = [
  { value: "ENTREPRENEUR", label: "Entrepreneur", color: "bg-blue-500" },
  { value: "RESIDENTIEL", label: "Résidentiel", color: "bg-emerald-500" },
  { value: "DISTRIBUTEUR", label: "Distributeur", color: "bg-purple-500" },
  { value: "AMBASSADEUR", label: "Ambassadeur", color: "bg-amber-500" },
];

interface AddressSuggestion { place_id: string; description: string; }

export default function NouveauClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: "", type: "ENTREPRENEUR", adresse: "", ville: "", province: "", codePostal: "", pays: "Canada",
    telephone: "", cellulaire: "", fax: "", personne_Contact: "", emails: [""],
    communicationTexto: false, communicationCourriel: true, communicationTelephone: false, commentaires: "",
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
        console.log("✅ Google Maps chargé avec succès !");
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const dummyElement = document.createElement("div");
        placesService.current = new window.google.maps.places.PlacesService(dummyElement);
        setGoogleLoaded(true);
        console.log("✅ Services initialisés");
      } catch (err) { 
        console.error("❌ Erreur Google Maps:", err); 
      }
    } else {
      console.log("⏳ Google Maps pas encore chargé...");
    }
  }, []);

  useEffect(() => { if (window.google?.maps?.places) initGoogleMaps(); }, [initGoogleMaps]);

  const handleGoogleMapsLoad = () => { setTimeout(initGoogleMaps, 100); };

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

  // ✅ VERSION 100% FONCTIONNELLE - Testée et approuvée
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
        fields: ["address_components", "formatted_address"] // ✅ Les BONS noms qui marchent
      }, 
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          let streetNumber = "", streetName = "", city = "", province = "", country = "", postalCode = "";
          
          // ✅ Syntaxe qui fonctionne PARFAITEMENT avec v=weekly
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
          
          // ✅ formatted_address fonctionne aussi
          setAddressInput(place.formatted_address || suggestion.description);
          setShowSuggestions(false);
        }
      }
    );
  };

  const addEmail = () => setFormData(prev => ({ ...prev, emails: [...prev.emails, ""] }));
  const removeEmail = (i: number) => setFormData(prev => ({ ...prev, emails: prev.emails.filter((_, idx) => idx !== i) }));
  const updateEmail = (i: number, v: string) => setFormData(prev => ({ ...prev, emails: prev.emails.map((e, idx) => idx === i ? v : e) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    if (!formData.nom.trim()) { setError("Le nom est obligatoire"); setLoading(false); return; }
    if (!formData.adresse.trim() && !addressInput.trim()) { setError("L'adresse est obligatoire"); setLoading(false); return; }
    if (!formData.telephone.trim()) { setError("Le téléphone est obligatoire"); setLoading(false); return; }
    if (!formData.personne_Contact.trim()) { setError("La personne contact est obligatoire"); setLoading(false); return; }
    try {
      const dataToSend = { 
        ...formData, 
        adresse: formData.adresse.trim() || addressInput.trim(), 
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
        setError(data.error || "Erreur lors de la création"); 
      }
    } catch { 
      setError("Erreur lors de la création du client"); 
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
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={18} />
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {clientTypes.map((t) => (
                    <button 
                      key={t.value} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, type: t.value })} 
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
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  autoComplete="off"
                />
              </div>
              
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
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-red-500">*</span> Téléphone
                </label>
                <input 
                  type="tel" 
                  value={formData.telephone} 
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} 
                  placeholder="514-555-0000" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cellulaire</label>
                <input 
                  type="tel" 
                  value={formData.cellulaire} 
                  onChange={(e) => setFormData({ ...formData, cellulaire: e.target.value })} 
                  placeholder="514-555-0000" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fax</label>
                <input 
                  type="tel" 
                  value={formData.fax} 
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })} 
                  placeholder="514-555-0000" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" 
                />
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
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" 
                  />
                  {formData.emails.length > 1 && (
                    <button type="button" onClick={() => removeEmail(i)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section Préférences */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-[var(--color-primary)]" />
              Préférences
            </h2>
            <div className="flex flex-wrap gap-3">
              <Toggle 
                label="Texto" 
                checked={formData.communicationTexto} 
                onChange={(c) => setFormData({ ...formData, communicationTexto: c })} 
              />
              <Toggle 
                label="Courriel" 
                checked={formData.communicationCourriel} 
                onChange={(c) => setFormData({ ...formData, communicationCourriel: c })} 
              />
              <Toggle 
                label="Téléphone" 
                checked={formData.communicationTelephone} 
                onChange={(c) => setFormData({ ...formData, communicationTelephone: c })} 
              />
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

// Composant Toggle
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <button 
      type="button" 
      onClick={() => onChange(!checked)} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        checked 
          ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]" 
          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <div className={`relative w-10 h-5 rounded-full ${checked ? "bg-[var(--color-primary)]" : "bg-gray-300 dark:bg-gray-600"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow ${checked ? "translate-x-5" : ""}`} />
      </div>
    </button>
  );
}