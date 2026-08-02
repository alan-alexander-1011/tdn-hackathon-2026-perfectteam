'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { LatLng } from '@/components/MapView';
import { getRoute, geocodeAddress, RouteResult } from '@/services/osrmService';
import { analyzeRouteWithAI } from '@/services/aiService';
import { INCIDENT_TYPES, INCIDENT_TYPE_ORDER, IncidentType } from '@/services/incidentTypes';

// react-leaflet touches `window`, so it must never render on the server.
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 }; // TP. Hồ Chí Minh

type Tab = 'directions' | 'report';

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}
function formatDuration(s: number) {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} phút`;
  return `${Math.floor(min / 60)} giờ ${min % 60} phút`;
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('directions');

  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsDenied, setGpsDenied] = useState(false);

  const [incidents, setIncidents] = useState<any[]>([]);

  // --- Directions state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationPin, setDestinationPin] = useState<LatLng | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiNote, setAiNote] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState('');

  // --- Report state ---
  const [incidentType, setIncidentType] = useState<IncidentType>('infrastructure');
  const [note, setNote] = useState('');
  const [reportPin, setReportPin] = useState<LatLng | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [nearbyIncidents, setNearbyIncidents] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const refreshIncidents = useCallback(() => {
    fetch('/api/incidents')
      .then((res) => res.json())
      .then(setIncidents)
      .catch(console.error);
  }, []);

  useEffect(() => {
    refreshIncidents();
  }, [refreshIncidents]);

  const useMyLocation = useCallback(() => {
    setLocating(true);
    setGpsDenied(false);
    if (!navigator.geolocation) {
      setLocating(false);
      setGpsDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        setReportPin((prev) => prev || loc);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGpsDenied(true);
      }
    );
  }, []);

  // Try to grab GPS automatically on page load.
  useEffect(() => {
    useMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNearby = useCallback((c: LatLng) => {
    setLoadingNearby(true);
    fetch(`/api/incidents?lat=${c.lat}&lng=${c.lng}&radius=3`)
      .then((res) => res.json())
      .then(setNearbyIncidents)
      .catch(console.error)
      .finally(() => setLoadingNearby(false));
  }, []);

  useEffect(() => {
    if (tab === 'report' && reportPin) fetchNearby(reportPin);
  }, [tab, reportPin, fetchNearby]);

  const handleMapClick = (pos: LatLng) => {
    if (tab === 'report') {
      setReportPin(pos);
      setReportMessage('');
    } else {
      setDestinationPin(pos);
      setRouteCoordinates([]);
      setRouteInfo(null);
      setAiInsights([]);
      setAiNote('');
      setAiAnalyzing(false);
      setRouteError('');
    }
  };

  const findRouteTo = async (destination: LatLng) => {
    if (!myLocation) {
      setRouteError('Chưa xác định được vị trí của bạn. Hãy cho phép truy cập GPS hoặc bấm nút định vị.');
      return;
    }
    setRouting(true);
    setRouteError('');
    setAiInsights([]);
    setAiNote('');
    setDestinationPin(destination);
    try {
      const route = await getRoute(myLocation, destination);
      setRouteCoordinates(route.coordinates);
      setRouteInfo(route);
      // Route is drawn — unblock the UI here and let AI analysis run as its
      // own, separately-indicated step instead of holding up the route.
      setRouting(false);
      setAiAnalyzing(true);

      const aiData = await analyzeRouteWithAI({
        origin: `${myLocation.lat},${myLocation.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        currentIncidents: incidents,
      });
      setAiInsights(aiData.upgradeRecommendations || []);
      if (!aiData.aiAvailable) {
        setAiNote(aiData.aiError || 'Gợi ý AI hiện không khả dụng.');
      } else {
        setAiNote('');
      }

      if (aiData.recommendedWaypoints?.length) {
        try {
          const smarterRoute = await getRoute(myLocation, destination, aiData.recommendedWaypoints);
          setRouteCoordinates(smarterRoute.coordinates);
          setRouteInfo(smarterRoute);
        } catch {
          // Keep the base route if the AI-adjusted one fails to compute.
        }
      }
    } catch (err) {
      console.error(err);
      setRouteError('Không thể tính toán tuyến đường. Vui lòng thử lại.');
    } finally {
      setRouting(false);
      setAiAnalyzing(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setRouting(true);
    setRouteError('');
    try {
      const dest = await geocodeAddress(searchQuery.trim());
      if (!dest) {
        setRouteError('Không tìm thấy địa điểm này. Thử ghim trực tiếp trên bản đồ.');
        setRouting(false);
        return;
      }
      await findRouteTo(dest);
    } catch (err) {
      console.error(err);
      setRouteError('Không thể tìm địa điểm này. Vui lòng thử lại.');
      setRouting(false);
    }
  };

  const handleClearDestination = () => {
    setDestinationPin(null);
    setRouteCoordinates([]);
    setRouteInfo(null);
    setAiInsights([]);
    setAiNote('');
    setAiAnalyzing(false);
    setRouteError('');
    setSearchQuery('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPin) {
      setReportMessage('Hãy chạm vào bản đồ để chọn vị trí sự cố trước.');
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
          coordinates: reportPin,
          note: note || undefined,
        }),
      });
      if (!res.ok) throw new Error('Gửi báo cáo thất bại');
      setReportMessage('✅ Đã gửi báo cáo thành công. Cảm ơn bạn!');
      setNote('');
      refreshIncidents();
      fetchNearby(reportPin);
    } catch (err) {
      console.error(err);
      setReportMessage('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full bg-gray-100 overflow-hidden">
      {/* Top floating control bar */}
      <div className="absolute top-0 left-0 w-full p-3 md:p-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto items-stretch">
          <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl shadow-lg pl-2.5 pr-4 font-bold text-gray-900 whitespace-nowrap">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white text-sm">📍</span>
            PMap
          </div>

          <div className="flex-1 flex bg-white rounded-xl shadow-lg p-1 gap-1">
            <button
              onClick={() => setTab('directions')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'directions' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Chỉ đường
            </button>
            <button
              onClick={() => setTab('report')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === 'report' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Báo cáo sự cố
            </button>
          </div>

          <button
            onClick={useMyLocation}
            disabled={locating}
            className="flex items-center justify-center bg-white rounded-xl shadow-lg w-11 shrink-0 text-gray-500 hover:text-primary-dark disabled:opacity-60"
            title="Vị trí hiện tại (GPS)"
          >
            {locating ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            ) : (
              '📍'
            )}
          </button>
        </div>

        {tab === 'directions' && (
          <form onSubmit={handleSearchSubmit} className="pointer-events-auto flex gap-2 bg-white rounded-xl shadow-lg p-1.5">
            <input
              type="text"
              placeholder="Tìm địa chỉ, hoặc chạm bản đồ để ghim điểm đến..."
              className="flex-1 px-3 py-1.5 outline-none text-gray-700 text-sm bg-transparent min-w-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={routing || !searchQuery.trim()}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-1.5 rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 shrink-0"
            >
              Tìm
            </button>
          </form>
        )}

        {tab === 'report' && (
          <p className="pointer-events-auto text-xs bg-white/95 text-gray-600 rounded-lg px-3 py-2 shadow w-fit max-w-full">
            📌 Chạm vào bản đồ (hoặc kéo ghim) để chọn đúng vị trí sự cố
          </p>
        )}

        {gpsDenied && (
          <p className="pointer-events-auto text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-1.5 w-fit shadow max-w-full">
            Không lấy được vị trí GPS — bạn vẫn có thể chọn vị trí bằng cách chạm vào bản đồ.
          </p>
        )}

        {tab === 'directions' && routeError && (
          <p className="pointer-events-auto text-sm text-red-600 bg-white/95 rounded-lg px-3 py-2 shadow inline-block w-fit max-w-full">
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
        reportPin={tab === 'report' ? reportPin : null}
        reportType={incidentType}
        onMapClick={handleMapClick}
      />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] p-5 md:p-6 z-[1000] max-h-[52vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

        {tab === 'directions' ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">Chỉ đường</h2>
              {destinationPin && (
                <button onClick={handleClearDestination} className="text-xs text-gray-400 hover:text-gray-600">
                  Xoá điểm đến
                </button>
              )}
            </div>

            {!destinationPin ? (
              <p className="text-sm text-gray-500 mb-2">
                Nhập địa chỉ ở ô tìm kiếm phía trên, hoặc chạm vào bản đồ để ghim điểm bạn muốn đến.
              </p>
            ) : (
              <>
                {routeInfo && (
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span className="font-semibold text-gray-900">{formatDistance(routeInfo.distanceMeters)}</span>
                    <span className="text-gray-400">·</span>
                    <span className="font-semibold text-gray-900">{formatDuration(routeInfo.durationSeconds)}</span>
                  </div>
                )}

                {!routeCoordinates.length && (
                  <button
                    onClick={() => destinationPin && findRouteTo(destinationPin)}
                    disabled={routing || !myLocation}
                    className="w-full mb-3 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {routing ? 'Đang tìm đường...' : 'Tìm đường'}
                  </button>
                )}

                {(aiAnalyzing || aiInsights.length > 0 || aiNote) && (
                  <div className="mb-2 rounded-xl border border-primary/40 bg-gradient-to-br from-primary-light/50 to-white overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3 pt-2.5 text-xs font-semibold text-primary-dark">
                      <span>✨</span> PMap AI
                    </div>
                    <div className="px-3 pb-3 pt-1.5">
                      {aiAnalyzing ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="w-3.5 h-3.5 border-2 border-primary-light border-t-primary-dark rounded-full animate-spin" />
                          Đang phân tích tuyến đường và sự cố xung quanh...
                        </div>
                      ) : aiInsights.length > 0 ? (
                        <ul className="space-y-1.5">
                          {aiInsights.map((insight, idx) => (
                            <li key={idx} className="flex gap-2 text-sm text-gray-700">
                              <span className="text-primary-dark">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400">{aiNote}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Báo cáo sự cố</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại sự cố</label>
              <div className="grid grid-cols-2 gap-2">
                {INCIDENT_TYPE_ORDER.map((key) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setIncidentType(key)}
                    className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                      incidentType === key
                        ? 'text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                    }`}
                    style={incidentType === key ? { backgroundColor: INCIDENT_TYPES[key].color } : undefined}
                  >
                    <span>{INCIDENT_TYPES[key].icon}</span>
                    <span>{INCIDENT_TYPES[key].label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí sự cố</label>
              <p className="text-sm text-gray-500">
                {reportPin
                  ? `Đã ghim: ${reportPin.lat.toFixed(5)}, ${reportPin.lng.toFixed(5)}`
                  : 'Chưa có — chạm vào bản đồ để chọn vị trí.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả thêm (không bắt buộc)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-700 outline-none focus:border-primary"
                placeholder={`Ví dụ: ${INCIDENT_TYPES[incidentType].description}`}
              />
            </div>

            {reportMessage && <p className="text-sm text-gray-600">{reportMessage}</p>}

            <button
              type="submit"
              disabled={submitting || !reportPin}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>

            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Sự cố gần vị trí này (bán kính 3km)</h3>
              {loadingNearby ? (
                <p className="text-sm text-gray-400">Đang tải...</p>
              ) : nearbyIncidents.length === 0 ? (
                <p className="text-sm text-gray-400">Chưa có sự cố nào được ghi nhận gần đây.</p>
              ) : (
                <ul className="space-y-1.5">
                  {nearbyIncidents.slice(0, 8).map((incident, idx) => (
                    <li key={incident._id || idx} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-700">
                        {INCIDENT_TYPES[incident.type as IncidentType]?.icon}{' '}
                        {INCIDENT_TYPES[incident.type as IncidentType]?.label || incident.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(incident.timestamp).toLocaleDateString('vi-VN')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        )}

        <div className="text-center mt-4 pt-3 border-t border-gray-50">
          <Link href="/admin" className="text-xs text-gray-300 hover:text-gray-400">
            Quản trị
          </Link>
        </div>
      </div>
    </div>
  );
}
