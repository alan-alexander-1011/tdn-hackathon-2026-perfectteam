'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInfrastructureProposals, AreaProposal } from '@/services/aiService';

export default function AdminDashboard() {
  const router = useRouter();
  const [proposals, setProposals] = useState<AreaProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getInfrastructureProposals()
      .then(setProposals)
      .catch((err) => {
        console.error(err);
        setError('Không thể tải đề xuất từ AI. Vui lòng thử lại sau.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const severityColor = (severity: string) => {
    if (severity?.includes('Cao')) return 'border-red-300 bg-red-50 text-red-700';
    if (severity?.includes('Trung')) return 'border-amber-300 bg-amber-50 text-amber-700';
    return 'border-green-300 bg-green-50 text-green-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white p-6 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng quản trị hạ tầng đô thị</h1>
          <p className="text-sm opacity-90">Dashboard quy hoạch dựa trên AI (Gemini)</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white/90 hover:text-white text-sm underline">
            Trang chủ
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Đề xuất nâng cấp theo khu vực (AI phân tích)</h2>

        {loading ? (
          <div className="text-primary-dark font-medium animate-pulse">Đang phân tích dữ liệu giao thông...</div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : proposals.length === 0 ? (
          <p className="text-gray-500">Chưa đủ dữ liệu để đưa ra đề xuất (cần ít nhất 2 báo cáo trong cùng khu vực).</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {proposals.map((p, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${severityColor(p.severity)}`}>
                    Mức độ: {p.severity}
                  </span>
                  <span className="text-xs text-gray-400">{p.reportCount} báo cáo</span>
                </div>

                <p className="text-gray-700 font-medium mb-3">{p.analysis_summary}</p>

                <p className="text-sm font-semibold text-gray-600 mb-1">Giải pháp ngắn hạn</p>
                <ul className="list-disc list-inside text-sm text-gray-600 mb-3 space-y-0.5">
                  {p.short_term_solutions?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>

                <p className="text-sm font-semibold text-gray-600 mb-1">Quy hoạch dài hạn</p>
                <p className="text-sm text-gray-600">{p.long_term_planning}</p>

                <p className="text-xs text-gray-400 mt-3">
                  Khu vực trung tâm: {p.center.lat.toFixed(4)}, {p.center.lng.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
