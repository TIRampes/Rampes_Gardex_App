"use client";

import { GoogleMap, LoadScript } from "@react-google-maps/api";

interface MapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  width?: string;
  height?: string;
}

export default function GoogleMapComponent({
  center = { lat: 45.5017, lng: -73.5673 }, // Montréal par défaut
  zoom = 12,
  width = "100%",
  height = "400px",
}: MapProps) {
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={["places"]}
    >
      <GoogleMap
        mapContainerStyle={{ width, height }}
        center={center}
        zoom={zoom}
      >
        {/* Tu peux ajouter des markers ici */}
      </GoogleMap>
    </LoadScript>
  );
}
