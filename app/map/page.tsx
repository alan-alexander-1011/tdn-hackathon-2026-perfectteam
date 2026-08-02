'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { LatLng } from '@/components/MapView';
import { getRoute } from '@/services/osrmService';
import { analyzeRouteWithAI } from '@/services/aiService';

// react-leaflet touches `window`, so it must never render on the server.
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 }; // TP. Hồ Chí Minh

type IncidentType = 'accident' | 'flood' | 'traffic_jam';
const INCIDENT_LABELS: Record<IncidentType, string> = {
  accident: 'Tai nạn',
  flood: 'Ngập nước',
  traffic_jam: 'Kẹt xe',
};

type Tab = 'directions' | 'report';

export default function MapPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('directions');

  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const [incidents, setIncidents] = useState<any[]>([]);

  // --- Directions state ---
  const [destinationPin, setDestinationPin] = useState<LatLng | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState('');

  // --- Report state ---
  const [incidentType, setIncidentType] = useState<IncidentType>('traffic_jam');
  const [note, setNote] = useState('');
  const [reportPin, setReportPin] = useState<LatLng | null>(null); // admin-only pinpoint
  const [submitting, setSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => setIsAdmin(!!data.isAdmin))
      .catch(() => setIsAdmin(false));

    fetch('/api/incidents')
      .then((res) => res.json())
      .then(setIncidents)
      .catch(console.error);
  }, []);

  const useMyLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  // Try to grab GPS automatically on page load.
  useEffect(() => {
    useMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMapClick = (pos: LatLng) => {
    if (tab === 'report' && isAdmin) {
      setReportPin(pos);
    } else {
      setDestinationPin(pos);
      setRouteCoordinates([]);
      setAiInsights([]);
      setRouteError('');
    }
  };

  const handleFindRoute = async () => {
    if (!myLocation || !destinationPin) {
      setRouteError('Cần có vị trí của bạn (GPS) và một điểm đến (chạm vào bản đồ để ghim).');
      return;
    }
    setRouting(true);
    setRouteError('');
    try {
      const aiData = await analyzeRouteWithAI({
        origin: `${myLocation.lat},${myLocation.lng}`,
        destination: `${destinationPin.lat},${destinationPin.lng}`,
        currentIncidents: incidents,
      });
      setAiInsights(aiData.upgradeRecommendations || []);

      const route = await getRoute(myLocation, destinationPin, aiData.recommendedWaypoints || []);
      setRouteCoordinates(route.coordinates);
    } catch (err) {
      console.error(err);
      setRouteError('Không thể tính toán tuyến đường. Vui lòng thử lại.');
    } finally {
      setRouting(false);
    }
  };

  const activeReportLocation = isAdmin && reportPin ? reportPin : myLocation;

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReportLocation) {
      setReportMessage('Chưa xác định được vị trí. Hãy bấm nút 🎯 để lấy GPS.');
      return;
    }

    setSubmitting(true);
    setReportMessage('');
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: incidentType,
          coordinates: activeReportLocation,
          note: note || undefined,
          source: isAdmin && reportPin ? 'admin_pinpoint' : 'gps',
        }),
      });
      if (!res.ok) throw new Error('Gửi báo cáo thất bại');
      setReportMessage('✅ Đã gửi báo cáo thành công. Cảm ơn bạn!');
      setNote('');
      fetch('/api/incidents').then((r) => r.json()).then(setIncidents).catch(console.error);
    } catch (err) {
      console.error(err);
      setReportMessage('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-gray-100 overflow-hidden">
      <div className="absolute top-0 left-0 w-full p-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center justify-center bg-white rounded-xl shadow-lg px-3 text-gray-500 hover:text-primary-dark"
            title="Trang chủ"
          >
            🏠
          </Link>

          <div className="flex-1 flex bg-white rounded-xl shadow-lg p-1 gap-1">
            <button
              onClick={() => setTab('directions')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'directions' ? 'bg-primary text-white' : 'text-gray-600'
              }`}
            >
              🗺️ Chỉ đường
            </button>
            <button
              onClick={() => setTab('report')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'report' ? 'bg-primary text-white' : 'text-gray-600'
              }`}
            >
              📍 Báo cáo sự cố
            </button>
          </div>

          <button
            onClick={useMyLocation}
            disabled={locating}
            className="flex items-center justify-center bg-white rounded-xl shadow-lg px-3 text-gray-500 hover:text-primary-dark disabled:opacity-60"
            title="Vị trí hiện tại (GPS)"
          >
            {locating ? '…' : '🎯'}
          </button>
        </div>

        {isAdmin && tab === 'report' && (
          <p className="pointer-events-auto text-xs bg-orange-100 text-orange-800 border border-orange-200 rounded-lg px-3 py-1.5 w-fit shadow">
            🔑 Chế độ Admin — chạm vào bản đồ để ghim vị trí báo cáo tuỳ ý
          </p>
        )}
        {tab === 'directions' && (
          <p className="pointer-events-auto text-xs bg-white/95 text-gray-500 rounded-lg px-3 py-1.5 w-fit shadow">
            Chạm vào bản đồ để ghim điểm đến
          </p>
        )}

        {tab === 'directions' && routeError && (
          <p className="pointer-events-auto text-sm text-red-600 bg-white/95 rounded-lg px-3 py-2 shadow inline-block w-fit">
            {routeError}
          </p>
        )}
      </div>

      <MapView
        center={myLocation || DEFAULT_CENTER}
        incidents={incidents}
        routeCoordinates={routeCoordinates}
        myLocation={myLocation}
        destinationPin={tab === 'directions' ? destinationPin : null}
        reportPin={tab === 'report' && isAdmin ? reportPin : null}
        onMapClick={handleMapClick}
      />

      <div className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 z-[1000] max-h-[48vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

        {tab === 'directions' ? (
          <>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Chỉ đường</h2>
            <p className="text-sm text-gray-500 mb-4">
              {destinationPin
                ? `Điểm đến đã ghim: ${destinationPin.lat.toFixed(5)}, ${destinationPin.lng.toFixed(5)}`
                : 'Chạm vào bản đồ để ghim điểm bạn muốn đến.'}
            </p>
            <button
              onClick={handleFindRoute}
              disabled={routing || !destinationPin || !myLocation}
              className="w-full mb-4 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {routing ? 'Đang tìm đường...' : 'Tìm đường'}
            </button>

            {aiInsights.length > 0 ? (
              <ul className="space-y-2">
                {aiInsights.map((insight, idx) => (
                  <li key={idx} className="p-3 bg-primary-light/30 border border-primary text-gray-700 rounded-lg">
                    🤖 Gợi ý AI: {insight}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">
                Ghim điểm đến rồi bấm &quot;Tìm đường&quot; để nhận tuyến đường và gợi ý từ AI.
              </p>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Báo cáo sự cố</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại sự cố</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(INCIDENT_LABELS) as IncidentType[]).map((key) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setIncidentType(key)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      incidentType === key
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                    }`}
                  >
                    {INCIDENT_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả thêm (không bắt buộc)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
                placeholder="Ví dụ: kẹt xe kéo dài do sửa đường..."
              />
            </div>

            <p className="text-sm text-gray-500">
              Vị trí báo cáo:{' '}
              {activeReportLocation
                ? `${activeReportLocation.lat.toFixed(5)}, ${activeReportLocation.lng.toFixed(5)}`
                : 'Chưa có (bấm 🎯 để lấy GPS)'}
              {isAdmin && reportPin ? ' (đã ghim thủ công)' : ''}
            </p>
            {!isAdmin && (
              <p className="text-xs text-gray-400">
                Chỉ admin mới có thể ghim vị trí báo cáo tuỳ ý trên bản đồ — người dùng thường báo cáo tại vị trí GPS hiện tại.
              </p>
            )}

            {reportMessage && <p className="text-sm text-gray-600">{reportMessage}</p>}

            <button
              type="submit"
              disabled={submitting || !activeReportLocation}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
