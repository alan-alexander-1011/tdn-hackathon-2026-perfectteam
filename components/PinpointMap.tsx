'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icon paths break under webpack/Next.js bundling.
// Safe to run even if RouteMap.tsx already patched this elsewhere.
// @ts-expect-error -- _getIconUrl is not in the public types but exists at runtime
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface PinpointMapProps {
  position: LatLng;
  onChange: (pos: LatLng) => void;
}

// Lets the user click anywhere on the map to move the pin.
function ClickToMove({ onChange }: { onChange: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Re-centers the map whenever the position changes from outside
// (e.g. the user re-taps "Use my location").
function Recenter({ position }: { position: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.lat, position.lng]);
  return null;
}

export default function PinpointMap({ position, onChange }: PinpointMapProps) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#babbf1;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      }),
    []
  );

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: '260px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker
          position={[position.lat, position.lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              onChange({ lat: latlng.lat, lng: latlng.lng });
            },
          }}
        />
        <ClickToMove onChange={onChange} />
        <Recenter position={position} />
      </MapContainer>
      <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50">
        Kéo ghim hoặc chạm vào bản đồ để chỉnh vị trí chính xác hơn.
      </p>
    </div>
  );
}
