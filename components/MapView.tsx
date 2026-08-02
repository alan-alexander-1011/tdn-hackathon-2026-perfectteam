'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { INCIDENT_TYPES, IncidentType } from '@/services/incidentTypes';

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
  /** Pinpoint used as the destination for directions. */
  destinationPin?: LatLng | null;
  /** Pinpoint used to place a new incident report -- anyone can set this. */
  reportPin?: LatLng | null;
  /** Category of the report being placed, used to color the reportPin marker. */
  reportType?: IncidentType;
  onMapClick?: (pos: LatLng) => void;
}

// Auto-zooms/pans the map to fit the drawn route whenever it changes.
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
}

// Re-centers the map when the target changes from outside user interaction
// (e.g. "Use my location", a geocoded search result).
function RecenterOnce({ target }: { target: LatLng | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], Math.max(map.getZoom(), 15));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.lat, target?.lng]);
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

function incidentIcon(type: IncidentType) {
  const meta = INCIDENT_TYPES[type];
  const color = meta?.color || '#6b7280';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.45);"></div>`,
    iconSize: [16, 16],
  });
}

const myLocationIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:18px;height:18px;"><div style="position:absolute;inset:-6px;background:rgba(59,130,246,0.25);border-radius:50%;"></div><div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div></div>',
  iconSize: [18, 18],
});

const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#4f46e5;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function reportPinIcon(type: IncidentType | undefined) {
  const color = type ? INCIDENT_TYPES[type]?.color : '#f97316';
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color || '#f97316'};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

export default function MapView({
  center,
  incidents = [],
  routeCoordinates = [],
  myLocation,
  destinationPin,
  reportPin,
  reportType,
  onMapClick,
}: MapViewProps) {
  const destIcon = useMemo(() => destinationIcon, []);

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {incidents.map((incident, idx) => (
        <Marker
          key={incident._id ? String(incident._id) : idx}
          position={[incident.coordinates.lat, incident.coordinates.lng]}
          icon={incidentIcon(incident.type)}
        >
          <Popup>
            <span className="font-medium">
              {INCIDENT_TYPES[incident.type as IncidentType]?.icon} {INCIDENT_TYPES[incident.type as IncidentType]?.label || incident.type}
            </span>
            {incident.note ? <><br />{incident.note}</> : null}
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
          icon={destIcon}
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
          icon={reportPinIcon(reportType)}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = e.target.getLatLng();
              onMapClick?.({ lat: ll.lat, lng: ll.lng });
            },
          }}
        >
          <Popup>Vị trí báo cáo</Popup>
        </Marker>
      )}

      {routeCoordinates.length > 0 && (
        <>
          <Polyline
            positions={routeCoordinates.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#4f46e5', weight: 6, opacity: 0.85 }}
          />
          <FitBounds points={routeCoordinates} />
        </>
      )}

      {!routeCoordinates.length && <RecenterOnce target={destinationPin || reportPin || null} />}

      <ClickHandler onClick={onMapClick} />
    </MapContainer>
  );
}
