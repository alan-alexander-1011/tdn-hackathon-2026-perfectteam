'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { generateInfrastructureProposals } from '@/services/aiPythonService';

export default function AdminDashboard() {
  const [proposals, setProposals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const dataRes = await fetch('/api/incidents');
        const dbData = await dataRes.json();

        const aiResponse = await generateInfrastructureProposals(dbData);
        setProposals(aiResponse.proposals || []);
      } catch (err) {
        console.error('Failed to load admin insights:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white p-6 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng quản trị hạ tầng đô thị</h1>
          <p className="text-sm opacity-90">Dashboard quy hoạch dựa trên AI</p>
        </div>
        <Link href="/" className="text-white/90 hover:text-white text-sm underline shrink-0 ml-4">
          Trang chủ
        </Link>
      </header>

      <main className="p-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Đề xuất nâng cấp từ AI</h2>

        {loading ? (
          <div className="text-primary-dark font-medium animate-pulse">Đang phân tích dữ liệu giao thông...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {proposals.map((proposal, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-primary transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary-light text-primary-dark p-3 rounded-lg">🏗️</div>
                  <p className="text-gray-700 leading-relaxed">{proposal}</p>
                </div>
              </div>
            ))}
            {proposals.length === 0 && <p className="text-gray-500">Chưa có đề xuất mới.</p>}
          </div>
        )}
      </main>
    </div>
  );
}
