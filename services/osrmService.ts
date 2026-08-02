export interface LatLng {
  lat: number;
  lng: number;
}

// Public OSRM demo server -- free, no API key. Rate-limited, so for production
// traffic self-host OSRM and set NEXT_PUBLIC_OSRM_URL to your own instance.
const OSRM_BASE_URL = process.env.NEXT_PUBLIC_OSRM_URL || 'https://router.project-osrm.org';

// Turns a free-text address into coordinates via our /api/geocode proxy
// (which calls OpenStreetMap's Nominatim service).
export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return { lat: data.lat, lng: data.lng };
}

export interface RouteResult {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
}

// Routes through origin -> waypoints (in order, not re-optimized) -> destination,
// same "strictly follow the AI's order" behavior as the old Google Directions call.
export async function getRoute(
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[] = []
): Promise<RouteResult> {
  const coords = [origin, ...waypoints, destination].map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM routing failed');
  const data = await res.json();

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng })),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}
