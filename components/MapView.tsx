'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icon paths break under webpack/Next.js bundling.
// Standard fix: point them at the CDN copies instead.
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

interface MapViewProps {
  center: LatLng;
  incidents?: any[];
  routeCoordinates?: LatLng[];
  myLocation?: LatLng | null;
  /** Pinpoint used as the destination for directions -- everyone can set this. */
  destinationPin?: LatLng | null;
  /** Pinpoint used to report an incident at an arbitrary location -- admin only. */
  reportPin?: LatLng | null;
  onMapClick?: (pos: LatLng) => void;
}

// Auto-zooms/pans the map to fit the drawn route whenever it changes.
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

function ClickHandler({ onClick }: { onClick?: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const incidentIcon = L.divIcon({
  className: '',
  html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
  iconSize: [14, 14],
});

const myLocationIcon = L.divIcon({
  className: '',
  html: '<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>',
  iconSize: [16, 16],
});

const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#6366f1;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const reportPinIcon = L.divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#f97316;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

export default function MapView({
  center,
  incidents = [],
  routeCoordinates = [],
  myLocation,
  destinationPin,
  reportPin,
  onMapClick,
}: MapViewProps) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {incidents.map((incident, idx) => (
        <Marker key={idx} position={[incident.coordinates.lat, incident.coordinates.lng]} icon={incidentIcon}>
          <Popup>
            {incident.type}
            {incident.note ? ` — ${incident.note}` : ''}
          </Popup>
        </Marker>
      ))}

      {myLocation && (
        <Marker position={[myLocation.lat, myLocation.lng]} icon={myLocationIcon}>
          <Popup>Vị trí của bạn (GPS)</Popup>
        </Marker>
      )}

      {destinationPin && (
        <Marker
          position={[destinationPin.lat, destinationPin.lng]}
          icon={destinationIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = e.target.getLatLng();
              onMapClick?.({ lat: ll.lat, lng: ll.lng });
            },
          }}
        >
          <Popup>Điểm đến</Popup>
        </Marker>
      )}

      {reportPin && (
        <Marker
          position={[reportPin.lat, reportPin.lng]}
          icon={reportPinIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = e.target.getLatLng();
              onMapClick?.({ lat: ll.lat, lng: ll.lng });
            },
          }}
        >
          <Popup>Vị trí báo cáo (admin)</Popup>
        </Marker>
      )}

      {routeCoordinates.length > 0 && (
        <>
          <Polyline
            positions={routeCoordinates.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#6366f1', weight: 6, opacity: 0.9 }}
          />
          <FitBounds points={routeCoordinates} />
        </>
      )}

      <ClickHandler onClick={onMapClick} />
    </MapContainer>
  );
}
