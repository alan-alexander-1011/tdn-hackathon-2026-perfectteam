'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { analyzeRouteWithAI } from '@/services/aiPythonService';
import { getRoute, geocodeAddress, LatLng } from '@/services/osrmService';

// react-leaflet touches `window`, so it must never render on the server.
const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false });

const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 }; // TP. Hồ Chí Minh

export default function DirectionsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [originMarker, setOriginMarker] = useState<LatLng | undefined>();
  const [destinationMarker, setDestinationMarker] = useState<LatLng | undefined>();
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/incidents')
      .then((res) => res.json())
      .then(setIncidents)
      .catch(console.error);
  }, []);

  const handleRouteSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    setError('');

    try {
      // Origin: try browser GPS first, fall back to the default city center.
      const origin = await new Promise<LatLng>((resolve) => {
        if (!navigator.geolocation) return resolve(DEFAULT_CENTER);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(DEFAULT_CENTER)
        );
      });

      const destination = await geocodeAddress(searchQuery);
      if (!destination) {
        setError('Không tìm thấy địa điểm này.');
        setLoading(false);
        return;
      }

      const aiData = await analyzeRouteWithAI({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        currentIncidents: incidents,
      });

      setAiInsights(aiData.upgradeRecommendations || []);

      const route = await getRoute(origin, destination, aiData.recommendedWaypoints || []);
      setRouteCoordinates(route.coordinates);
      setOriginMarker(origin);
      setDestinationMarker(destination);
    } catch (err) {
      console.error(err);
      setError('Không thể tính toán tuyến đường. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-gray-100 overflow-hidden">
      <div className="absolute top-0 left-0 w-full p-4 z-[1000] flex flex-col gap-2">
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex items-center justify-center bg-white rounded-xl shadow-lg px-3 text-gray-500 hover:text-primary-dark"
            title="Trang chủ"
          >
            🏠
          </Link>
          <form onSubmit={handleRouteSearch} className="flex-1 flex gap-2 bg-white rounded-xl shadow-lg p-2">
            <input
              type="text"
              placeholder="Bạn muốn đến đâu?"
              className="flex-1 px-4 py-2 outline-none text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-dark active:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors font-semibold disabled:opacity-60"
            >
              {loading ? '...' : 'Đi'}
            </button>
          </form>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-white/95 rounded-lg px-3 py-2 shadow inline-block w-fit">{error}</p>
        )}
      </div>

      <RouteMap
        center={DEFAULT_CENTER}
        incidents={incidents}
        routeCoordinates={routeCoordinates}
        originMarker={originMarker}
        destinationMarker={destinationMarker}
      />

      <div className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 z-[1000]">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2 text-gray-800">Chi tiết tuyến đường</h2>

        {aiInsights.length > 0 ? (
          <ul className="space-y-2">
            {aiInsights.map((insight, idx) => (
              <li key={idx} className="p-3 bg-primary-light/30 border border-primary text-gray-700 rounded-lg">
                🤖 Gợi ý AI: {insight}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Tìm điểm đến để nhận tuyến đường và gợi ý từ AI.</p>
        )}
      </div>
    </div>
  );
}
