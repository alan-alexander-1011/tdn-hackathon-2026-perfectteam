'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getInfrastructureProposals, AreaProposal } from '@/services/aiService';

export default function AdminDashboard() {
  const [proposals, setProposals] = useState<AreaProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    getInfrastructureProposals()
      .then((result) => {
        setProposals(result.proposals);
        if (!result.aiAvailable && result.aiError) setAiError(result.aiError);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.message || 'Không thể tải đề xuất từ AI. Vui lòng thử lại sau.');
      })
      .finally(() => setLoading(false));
  }, []);

  const severityColor = (severity: string) => {
    if (severity?.includes('Cao')) return 'border-red-300 bg-red-50 text-red-700';
    if (severity?.includes('Trung')) return 'border-amber-300 bg-amber-50 text-amber-700';
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
            <h1 className="text-lg font-bold text-gray-900 leading-tight">PMap · Quản trị hạ tầng</h1>
            <p className="text-xs text-gray-500">Đề xuất quy hoạch do AI phân tích</p>
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
        {aiError && (
          <div className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="font-semibold mb-1">⚠️ AI hiện không khả dụng</p>
            <p className="opacity-90">{aiError}</p>
          </div>
        )}

        <h2 className="text-lg font-semibold mb-6 text-gray-800">Đề xuất nâng cấp theo khu vực</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-primary-dark font-medium">
            <span className="w-4 h-4 border-2 border-primary-light border-t-primary-dark rounded-full animate-spin" />
            Đang phân tích dữ liệu bằng AI...
          </div>
        ) : error ? (
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
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
      </main>
    </div>
  );
}
