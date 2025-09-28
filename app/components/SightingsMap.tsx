'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { type Sighting } from '../utils/csvParser';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom ghost marker icon
const createGhostIcon = () => {
  return L.divIcon({
    className: 'custom-ghost-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #000;
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        👻
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface SightingsMapProps {
  sightings: Sighting[];
}

export default function SightingsMap({ sightings }: SightingsMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

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
          <div className="text-4xl mb-2">👻</div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Calculate center based on sightings data, fallback to US center
  const center: [number, number] = sightings.length > 0 
    ? [
        sightings.reduce((sum, s) => sum + s.lat, 0) / sightings.length,
        sightings.reduce((sum, s) => sum + s.lng, 0) / sightings.length
      ]
    : [39.8283, -98.5795]; // Geographic center of US

  return (
    <div className="w-full">
      <MapContainer
        center={center}
        zoom={sightings.length > 0 ? 4 : 3}
        style={{ height: '400px', width: '100%' }}
        className="rounded-lg"
        key={`map-${sightings.length}-${isMapReady}`}
        whenReady={() => {
          // Map is ready
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sightings.slice(0, 100).map((sighting) => (
          <Marker
            key={sighting.id}
            position={[sighting.lat, sighting.lng]}
            icon={createGhostIcon()}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                {sighting.image && (
                  <div className="mb-2">
                    <img
                      src={sighting.image}
                      alt="Sighting"
                      className="w-full h-24 object-cover rounded mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  <p><strong>Date:</strong> {sighting.date}</p>
                  <p><strong>Time:</strong> {sighting.time}</p>
                  <p><strong>Type:</strong> {sighting.type}</p>
                  <p><strong>Location:</strong> {sighting.location}</p>
                  <p><strong>Notes:</strong> {sighting.notes}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
