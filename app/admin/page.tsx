'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getInfrastructureProposals, AreaProposal } from '@/services/proposalsService';
import {
  listIncidents,
  createIncident,
  deleteIncident,
  IncidentRecord,
} from '@/services/incidentsAdminService';
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_ORDER,
  INCIDENT_SUBTYPES,
  INCIDENT_SUBTYPE_ORDER,
  IncidentType,
} from '@/services/incidentTypes';

type AdminTab = 'proposals' | 'reports';

const DEFAULT_CENTER = { lat: 10.762622, lng: 106.660172 }; // TP. Hồ Chí Minh

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('reports');

  // --- Đề xuất nâng cấp (rule-based, không AI) ---
  const [proposals, setProposals] = useState<AreaProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [proposalsError, setProposalsError] = useState('');

  const loadProposals = useCallback(() => {
    setLoadingProposals(true);
    getInfrastructureProposals()
      .then(setProposals)
      .catch((err) => {
        console.error(err);
        setProposalsError(err?.message || 'Không thể tạo đề xuất nâng cấp. Vui lòng thử lại sau.');
      })
      .finally(() => setLoadingProposals(false));
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  // --- Quản lý báo cáo (thêm / xoá) ---
  const [reports, setReports] = useState<IncidentRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newType, setNewType] = useState<IncidentType>('infrastructure');
  const [newSubType, setNewSubType] = useState<string>(INCIDENT_SUBTYPE_ORDER.infrastructure[0]);
  const [newLat, setNewLat] = useState(String(DEFAULT_CENTER.lat));
  const [newLng, setNewLng] = useState(String(DEFAULT_CENTER.lng));
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const loadReports = useCallback(() => {
    setLoadingReports(true);
    listIncidents()
      .then(setReports)
      .catch((err) => {
        console.error(err);
        setReportsError(err?.message || 'Không thể tải danh sách báo cáo.');
      })
      .finally(() => setLoadingReports(false));
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setAddError('Toạ độ không hợp lệ.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      await createIncident({
        type: newType,
        subType: newSubType,
        coordinates: { lat, lng },
        note: newNote || undefined,
      });
      setNewNote('');
      loadReports();
      // Danh sách báo cáo vừa thay đổi -- làm mới lại đề xuất nâng cấp để phản ánh dữ liệu mới.
      loadProposals();
    } catch (err: any) {
      console.error(err);
      setAddError(err?.message || 'Thêm báo cáo thất bại.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteIncident(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
      loadProposals();
    } catch (err: any) {
      console.error(err);
      setReportsError(err?.message || 'Xoá báo cáo thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  const severityColor = (severity: string) => {
    if (severity === 'Cao') return 'border-red-300 bg-red-50 text-red-700';
    if (severity === 'Trung bình') return 'border-amber-300 bg-amber-50 text-amber-700';
    return 'border-green-300 bg-green-50 text-green-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white font-bold text-sm shadow-sm">
            P
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">PMap · Quản trị</h1>
            <p className="text-xs text-gray-500">Quản lý báo cáo & đề xuất nâng cấp (thuật toán quy tắc, không AI)</p>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-gray-600 hover:text-primary-dark px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          ← Về ứng dụng
        </Link>
      </header>

      <main className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex bg-white rounded-xl shadow-sm p-1 gap-1 mb-6 w-fit border border-gray-100">
          <button
            onClick={() => setTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'reports' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Quản lý báo cáo
          </button>
          <button
            onClick={() => setTab('proposals')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'proposals' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Đề xuất nâng cấp
          </button>
        </div>

        {tab === 'reports' ? (
          <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
            {/* Form thêm báo cáo */}
            <form
              onSubmit={handleAddReport}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4"
            >
              <h2 className="font-bold text-gray-900">Thêm báo cáo mới</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại sự cố</label>
                <div className="grid grid-cols-2 gap-2">
                  {INCIDENT_TYPE_ORDER.map((key) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        setNewType(key);
                        setNewSubType(INCIDENT_SUBTYPE_ORDER[key][0]);
                      }}
                      className={`flex items-center gap-2 py-2 px-2.5 rounded-lg border text-xs font-medium transition-colors text-left ${
                        newType === key ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
                      }`}
                      style={newType === key ? { backgroundColor: INCIDENT_TYPES[key].color } : undefined}
                    >
                      <span>{INCIDENT_TYPES[key].icon}</span>
                      <span>{INCIDENT_TYPES[key].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tình huống cụ thể</label>
                <div className="flex flex-wrap gap-1.5">
                  {INCIDENT_SUBTYPE_ORDER[newType].map((subKey) => (
                    <button
                      type="button"
                      key={subKey}
                      onClick={() => setNewSubType(subKey)}
                      className={`py-1 px-2.5 rounded-full border text-xs font-medium transition-colors ${
                        newSubType === subKey
                          ? 'bg-primary text-white border-transparent'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                      }`}
                    >
                      {INCIDENT_SUBTYPES[newType][subKey].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vĩ độ (lat)</label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ (lng)</label>
                  <input
                    type="text"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm (không bắt buộc)</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                  placeholder="Thêm chi tiết nếu cần (không bắt buộc)"
                />
              </div>

              {addError && <p className="text-sm text-red-600">{addError}</p>}

              <button
                type="submit"
                disabled={adding}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {adding ? 'Đang thêm...' : 'Thêm báo cáo'}
              </button>
            </form>

            {/* Danh sách báo cáo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Danh sách báo cáo ({reports.length})</h2>
              </div>

              {loadingReports ? (
                <div className="p-5 flex items-center gap-2 text-primary-dark font-medium text-sm">
                  <span className="w-4 h-4 border-2 border-primary-light border-t-primary-dark rounded-full animate-spin" />
                  Đang tải...
                </div>
              ) : reportsError ? (
                <p className="p-5 text-red-600 text-sm">{reportsError}</p>
              ) : reports.length === 0 ? (
                <p className="p-5 text-gray-500 text-sm">Chưa có báo cáo nào.</p>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                  {reports.map((r) => {
                    const subMeta = r.subType ? INCIDENT_SUBTYPES[r.type]?.[r.subType] : undefined;
                    return (
                      <li key={r._id} className="flex items-start justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                              style={{ backgroundColor: INCIDENT_TYPES[r.type]?.color }}
                            >
                              {INCIDENT_TYPES[r.type]?.icon} {subMeta?.label || INCIDENT_TYPES[r.type]?.label || r.type}
                            </span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {new Date(r.timestamp).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            📍 {r.coordinates.lat.toFixed(5)}, {r.coordinates.lng.toFixed(5)}
                            {r.note ? ` — ${r.note}` : ''}
                          </p>
                          {subMeta && (
                            <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                              <span className="font-semibold text-gray-600">Đề xuất xử lý: </span>
                              {subMeta.managementAction}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteReport(r._id)}
                          disabled={deletingId === r._id}
                          className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === r._id ? 'Đang xoá...' : 'Xoá'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-1 text-gray-800">Đề xuất nâng cấp theo khu vực</h2>
            <p className="text-xs text-gray-400 mb-6">
              Được tạo bằng thuật toán sử dụng công nghệ AI.
            </p>

            {loadingProposals ? (
              <div className="flex items-center gap-2 text-primary-dark font-medium">
                <span className="w-4 h-4 border-2 border-primary-light border-t-primary-dark rounded-full animate-spin" />
                Đang phân tích dữ liệu...
              </div>
            ) : proposalsError ? (
              <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{proposalsError}</p>
            ) : proposals.length === 0 ? (
              <p className="text-gray-500">
                Chưa đủ dữ liệu để đưa ra đề xuất (cần ít nhất 2 báo cáo trong cùng khu vực).
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {proposals.map((p, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${severityColor(p.severity)}`}>
                        Mức độ: {p.severity}
                      </span>
                      <span className="text-xs text-gray-400">{p.reportCount} báo cáo</span>
                    </div>

                    <p className="text-gray-800 font-medium mb-3">{p.analysis_summary}</p>

                    <p className="text-sm font-semibold text-gray-600 mb-1">Giải pháp ngắn hạn</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mb-3 space-y-0.5">
                      {p.short_term_solutions?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>

                    <p className="text-sm font-semibold text-gray-600 mb-1">Quy hoạch dài hạn</p>
                    <p className="text-sm text-gray-600">{p.long_term_planning}</p>

                    <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                      📍 {p.center.lat.toFixed(4)}, {p.center.lng.toFixed(4)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
