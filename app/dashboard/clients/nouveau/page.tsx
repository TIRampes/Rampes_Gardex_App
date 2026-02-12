"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, MapPin, Loader2, X } from "lucide-react";

const clientTypes = [
  { value: "ENTREPRENEUR", label: "Entrepreneur" },
  { value: "RESIDENTIEL", label: "Résidentiel" },
  { value: "DISTRIBUTEUR", label: "Distributeur" },
  { value: "AMBASSADEUR", label: "Ambassadeur" },
];

export default function NouveauClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    type: "ENTREPRENEUR" as const,
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

  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      if (mapRef.current) {
        const map = new window.google.maps.Map(mapRef.current, { center: { lat: 45.5017, lng: -73.5673 }, zoom: 10 });
        placesService.current = new window.google.maps.places.PlacesService(map);
      }
    }
  }, []);

  const handleAddressChange = (value: string) => {
    setAddressInput(value);
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
        }
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
          let streetNumber = "", streetName = "", city = "", province = "", country = "", postalCode = "";
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
      }
    );
  };

  const addEmail = () => setFormData((prev) => ({ ...prev, emails: [...prev.emails, ""] }));
  const removeEmail = (index: number) => setFormData((prev) => ({ ...prev, emails: prev.emails.filter((_, i) => i !== index) }));
  const updateEmail = (index: number, value: string) => setFormData((prev) => ({ ...prev, emails: prev.emails.map((e, i) => (i === index ? value : e)) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, emails: formData.emails.filter((e) => e.trim() !== "") }),
      });
      if (res.ok) {
        router.push("/dashboard/clients");
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la création");
      }
    } catch {
      alert("Erreur lors de la création du client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Nouveau client</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Ajouter un nouveau client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Nom et Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><span className="text-red-500">*</span> Nom du client</label>
            <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} placeholder="Nom de l'entreprise ou du client" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-gray-900 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type de client</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white">
              {clientTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Adresse avec Google Maps */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><span className="text-red-500">*</span> Adresse</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" value={addressInput} onChange={(e) => handleAddressChange(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} placeholder="Commencez à taper une adresse..." className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" required />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
              {suggestions.map((s) => (
                <button key={s.place_id} type="button" onClick={() => handleSelectAddress(s)} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-900 dark:text-white text-sm truncate">{s.description}</span>
                </button>
              ))}
            </div>
          )}
          <div ref={mapRef} className="hidden" />
        </div>

        {/* Info adresse extraite */}
        {formData.ville && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div><p className="text-xs text-gray-500">Ville</p><p className="font-medium text-gray-900 dark:text-white">{formData.ville}</p></div>
            <div><p className="text-xs text-gray-500">Province</p><p className="font-medium text-gray-900 dark:text-white">{formData.province || "—"}</p></div>
            <div><p className="text-xs text-gray-500">Pays</p><p className="font-medium text-gray-900 dark:text-white">{formData.pays || "—"}</p></div>
            <div><p className="text-xs text-gray-500">Code Postal</p><p className="font-medium text-gray-900 dark:text-white">{formData.codePostal || "—"}</p></div>
          </div>
        )}

        {/* Préférences de communication */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Préférences de communication</label>
          <div className="flex flex-wrap gap-4">
            <Toggle label="Texto" checked={formData.communicationTexto} onChange={(c) => setFormData({ ...formData, communicationTexto: c })} />
            <Toggle label="Courriel" checked={formData.communicationCourriel} onChange={(c) => setFormData({ ...formData, communicationCourriel: c })} />
            <Toggle label="Téléphone" checked={formData.communicationTelephone} onChange={(c) => setFormData({ ...formData, communicationTelephone: c })} />
          </div>
        </div>

        {/* Téléphones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><span className="text-red-500">*</span> Téléphone</label>
            <input type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} placeholder="514-555-0000" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cellulaire</label>
            <input type="tel" value={formData.cellulaire} onChange={(e) => setFormData({ ...formData, cellulaire: e.target.value })} placeholder="514-555-0000" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fax</label>
            <input type="tel" value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} placeholder="514-555-0000" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" />
          </div>
        </div>

        {/* Personne contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"><span className="text-red-500">*</span> Personne contact</label>
          <input type="text" value={formData.personne_Contact} onChange={(e) => setFormData({ ...formData, personne_Contact: e.target.value })} placeholder="Nom de la personne contact" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" required />
        </div>

        {/* Emails */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Courriels</label>
            <button type="button" onClick={addEmail} className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>+ Ajouter</button>
          </div>
          <div className="space-y-2">
            {formData.emails.map((email, i) => (
              <div key={i} className="flex gap-2">
                <input type="email" value={email} onChange={(e) => updateEmail(i, e.target.value)} placeholder={`Courriel ${i + 1}`} className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white" />
                {formData.emails.length > 1 && <button type="button" onClick={() => removeEmail(i)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><X size={20} /></button>}
              </div>
            ))}
          </div>
        </div>

        {/* Commentaires */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaires</label>
          <textarea value={formData.commentaires} onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })} placeholder="Notes..." rows={4} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white resize-none" />
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={() => router.back()} className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">Annuler</button>
          <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`relative w-12 h-6 rounded-full transition-colors ${checked ? "bg-[var(--color-primary)]" : "bg-gray-300 dark:bg-gray-600"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </label>
  );
}