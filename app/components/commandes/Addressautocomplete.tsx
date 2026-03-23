// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: components/AddressAutocomplete.tsx              ║
// ║  NOUVEAU — copier dans components/                        ║
// ║  Utilise NEXT_PUBLIC_GOOGLE_MAPS_API_KEY du .env           ║
// ╚══════════════════════════════════════════════════════════╝

'use client';

import { useState, useRef, useEffect } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

// Charger le script Google Maps une seule fois
let googleMapsLoaded = false;
let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded && (window as any).google?.maps?.places) {
    return Promise.resolve();
  }
  if (googleMapsPromise) return googleMapsPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY manquante');
    return Promise.resolve();
  }

  googleMapsPromise = new Promise((resolve) => {
    if ((window as any).google?.maps?.places) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=CA`;
    script.async = true;
    script.defer = true;
    script.onload = () => { googleMapsLoaded = true; resolve(); };
    script.onerror = () => { console.error('Erreur chargement Google Maps'); resolve(); };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Commencez à taper une adresse...',
  className = '',
  error,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;
    if (!(window as any).google?.maps?.places) return;

    const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'ca' },
      fields: ['formatted_address'],
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    autocompleteRef.current = ac;

    return () => {
      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [ready, onChange]);

  const borderClass = error
    ? 'border-red-400 dark:border-red-500 focus:ring-red-200'
    : 'border-gray-200 dark:border-gray-700 focus:ring-blue-200 focus:border-blue-400';

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl outline-none transition-colors focus:ring-2 ${borderClass} ${className}`}
        autoComplete="off"
      />
      {error && <p className="mt-1 text-[0.75rem] text-red-500">{error}</p>}
    </div>
  );
}