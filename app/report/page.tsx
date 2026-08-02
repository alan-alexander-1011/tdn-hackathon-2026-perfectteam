'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { LatLng } from '@/components/PinpointMap';

// react-leaflet touches `window`, so it must never render on the server.
const PinpointMap = dynamic(() => import('@/components/PinpointMap'), { ssr: false });

type IncidentType = 'accident' | 'flood' | 'traffic_jam';

const INCIDENT_LABELS: Record<IncidentType, string> = {
  accident: 'Tai nạn',
  flood: 'Ngập nước',
  traffic_jam: 'Kẹt xe',
};

export default function ReportPage() {
  const [type, setType] = useState<IncidentType>('traffic_jam');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [nearbyIncidents, setNearbyIncidents] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const fetchNearby = async (c: { lat: number; lng: number }) => {
    setLoadingNearby(true);
    try {
      const res = await fetch(`/api/incidents?lat=${c.lat}&lng=${c.lng}&radius=5`);
      const data = await res.json();
      setNearbyIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNearby(false);
    }
  };

  const handlePinChange = (pos: LatLng) => {
    setManualLat(pos.lat.toFixed(6));
    setManualLng(pos.lng.toFixed(6));
    fetchNearby(pos);
  };

  const useMyLocation = () => {
    setLocating(true);
    setMessage('');
    if (!navigator.geolocation) {
      setMessage('Trình duyệt không hỗ trợ định vị GPS. Vui lòng nhập tọa độ thủ công.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setManualLat(c.lat.toFixed(6));
        setManualLng(c.lng.toFixed(6));
        setLocating(false);
        fetchNearby(c);
      },
      () => {
        setMessage('Không thể lấy vị trí (bạn có thể đã từ chối quyền GPS). Vui lòng nhập tọa độ thủ công.');
        setLocating(false);
      }
    );
  };

  // Try to grab GPS + nearby incidents automatically on page load.
  useEffect(() => {
    useMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) {
      setMessage('Vui lòng cung cấp tọa độ hợp lệ (dùng nút GPS hoặc nhập tay).');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, coordinates: { lat, lng } }),
      });
      if (!res.ok) throw new Error('Gửi báo cáo thất bại');
      setMessage('✅ Đã gửi báo cáo thành công. Cảm ơn bạn!');
      fetchNearby({ lat, lng });
    } catch (err) {
      console.error(err);
      setMessage('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const latNum = parseFloat(manualLat);
  const lngNum = parseFloat(manualLng);
  const pinPosition: LatLng | null = !isNaN(latNum) && !isNaN(lngNum) ? { lat: latNum, lng: lngNum } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white p-6 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo sự cố giao thông</h1>
          <p className="text-sm opacity-90">Không cần bản đồ chỉ đường — chỉ cần định vị và ghim vị trí</p>
        </div>
        <Link href="/" className="text-white/90 hover:text-white text-sm underline shrink-0 ml-4">
          Trang chủ
        </Link>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại sự cố</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(INCIDENT_LABELS) as IncidentType[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setType(key)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    type === key
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí</label>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="w-full mb-3 py-2 rounded-lg bg-primary-light text-primary-dark font-medium hover:bg-primary/30 transition-colors disabled:opacity-60"
            >
              {locating ? 'Đang định vị...' : '📍 Dùng vị trí hiện tại (GPS)'}
            </button>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Vĩ độ (lat)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
              />
              <input
                type="text"
                placeholder="Kinh độ (lng)"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
              />
            </div>

            {pinPosition ? (
              <PinpointMap position={pinPosition} onChange={handlePinChange} />
            ) : (
              <p className="text-xs text-gray-400">
                Bấm "Dùng vị trí hiện tại" hoặc nhập tọa độ để hiện bản đồ ghim vị trí.
              </p>
            )}
          </div>

          {message && <p className="text-sm text-gray-600">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </form>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Sự cố gần bạn (bán kính 5km)</h2>
          {loadingNearby ? (
            <p className="text-gray-500">Đang tải...</p>
          ) : nearbyIncidents.length === 0 ? (
            <p className="text-gray-500">Chưa phát hiện sự cố nào gần vị trí của bạn.</p>
          ) : (
            <ul className="space-y-2">
              {nearbyIncidents.map((incident, idx) => (
                <li
                  key={idx}
                  className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex items-center justify-between"
                >
                  <span className="font-medium text-gray-700">
                    {INCIDENT_LABELS[incident.type as IncidentType] || incident.type}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(incident.timestamp).toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
