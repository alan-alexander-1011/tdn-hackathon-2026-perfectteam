'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icon paths break under webpack/Next.js bundling.
// This is the standard fix: point them at the CDN copies instead.
// @ts-expect-error -- _getIconUrl is not in the public types but exists at runtime
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteMapProps {
  center: LatLng;
  incidents?: any[];
  routeCoordinates?: LatLng[];
  originMarker?: LatLng;
  destinationMarker?: LatLng;
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

const incidentIcon = L.divIcon({
  className: '',
  html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
  iconSize: [14, 14],
});

export default function RouteMap({
  center,
  incidents = [],
  routeCoordinates = [],
  originMarker,
  destinationMarker,
}: RouteMapProps) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {incidents.map((incident, idx) => (
        <Marker
          key={idx}
          position={[incident.coordinates.lat, incident.coordinates.lng]}
          icon={incidentIcon}
        >
          <Popup>{incident.type}</Popup>
        </Marker>
      ))}

      {originMarker && (
        <Marker position={[originMarker.lat, originMarker.lng]}>
          <Popup>Điểm đi</Popup>
        </Marker>
      )}
      {destinationMarker && (
        <Marker position={[destinationMarker.lat, destinationMarker.lng]}>
          <Popup>Điểm đến</Popup>
        </Marker>
      )}

      {routeCoordinates.length > 0 && (
        <>
          <Polyline
            positions={routeCoordinates.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#babbf1', weight: 6, opacity: 0.9 }}
          />
          <FitBounds points={routeCoordinates} />
        </>
      )}
    </MapContainer>
  );
}
