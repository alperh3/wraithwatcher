'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom pin marker icon
const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: #FF9F40;
        border: 3px solid #000;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 16px;
          font-weight: bold;
        ">
          📍
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

interface LocationMapProps {
  onLocationSelect: (location: string, lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (location: string, lat: number, lng: number) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      try {
        // Reverse geocoding to get location name
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
        );
        const data = await response.json();
        
        let locationName = 'Unknown Location';
        if (data.display_name) {
          const parts = data.display_name.split(', ');
          locationName = parts.slice(0, 2).join(', ');
        }
        
        onLocationSelect(locationName, lat, lng);
      } catch (error) {
        console.error('Error getting location name:', error);
        onLocationSelect(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, lat, lng);
      }
    },
  });
  
  return null;
}

export default function LocationMap({ onLocationSelect }: LocationMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Add a longer delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isClient || typeof window === 'undefined' || !isMapReady) {
    return (
      <div className="h-96 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Default center (US center)
  const center: [number, number] = [39.8283, -98.5795];

  const handleLocationSelect = (location: string, lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    onLocationSelect(location, lat, lng);
  };

  return (
    <div className="w-full">
      <MapContainer
        center={center}
        zoom={4}
        style={{ height: '400px', width: '100%' }}
        className="rounded-lg"
        key={`location-map-${isMapReady}`}
        whenReady={() => {
          // Map is ready
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createPinIcon()}
          />
        )}
      </MapContainer>
      <p className="mt-2 text-sm text-gray-600">
        Click on the map to select the location of your sighting
      </p>
    </div>
  );
}
