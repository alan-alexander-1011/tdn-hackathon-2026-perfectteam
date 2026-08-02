'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { analyzeRouteWithAI } from '@/services/aiPythonService';
import MapDirections from '@/components/MapDirections';

export default function SmartTrafficApp() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoute, setActiveRoute] = useState<{
    origin: string;
    destination: string;
    waypoints: { lat: number; lng: number }[];
  } | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/incidents')
      .then((res) => res.json())
      .then((data) => setIncidents(data))
      .catch(console.error);
  }, []);

  const handleRouteSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const mockUserLocation = 'Ben Thanh Market, Ho Chi Minh City';

    try {
      const aiData = await analyzeRouteWithAI({
        origin: mockUserLocation,
        destination: searchQuery,
        currentIncidents: incidents
      });

      setAiInsights(aiData.upgradeRecommendations || []);
      setActiveRoute({
        origin: mockUserLocation,
        destination: searchQuery,
        waypoints: aiData.recommendedWaypoints || []
      });
    } catch (error) {
      console.error('Error fetching AI route:', error);
    }
  };

  return (
    <div className="relative h-screen w-full bg-gray-100 overflow-hidden">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>

        <div className="absolute top-0 left-0 w-full p-4 z-10">
          <form onSubmit={handleRouteSearch} className="flex gap-2 bg-white rounded-xl shadow-lg p-2">
            <input
              type="text"
              placeholder="Where to?"
              className="flex-1 px-4 py-2 outline-none text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark active:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors font-semibold"
            >
              Go
            </button>
          </form>
        </div>

        <Map
          defaultCenter={{ lat: 10.762622, lng: 106.660172 }}
          defaultZoom={13}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || 'DEMO_MAP_ID'}
          disableDefaultUI={true}
        >
          {incidents.map((incident, idx) => (
            <AdvancedMarker
              key={idx}
              position={incident.coordinates}
              title={incident.type}
            >
              <div className="bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow-md" />
            </AdvancedMarker>
          ))}

          {activeRoute && (
            <MapDirections
              origin={activeRoute.origin}
              destination={activeRoute.destination}
              waypoints={activeRoute.waypoints}
            />
          )}
        </Map>

        <div className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 z-10 transition-transform duration-300">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-gray-800">Route Details</h2>

          {aiInsights.length > 0 ? (
            <ul className="space-y-2">
              {aiInsights.map((insight, idx) => (
                <li key={idx} className="p-3 bg-primary-light/30 border border-primary text-gray-700 rounded-lg">
                  🤖 AI Insight: {insight}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Search for a destination to get AI-optimized routes and insights.</p>
          )}
        </div>

      </APIProvider>
    </div>
  );
}
