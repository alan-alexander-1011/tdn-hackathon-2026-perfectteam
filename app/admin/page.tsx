'use client';

import { useEffect, useState } from 'react';
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
      <header className="bg-primary text-white p-6 shadow-md">
        <h1 className="text-2xl font-bold">Urban Infrastructure Admin Panel</h1>
        <p className="text-sm opacity-90">AI-Powered Planning Dashboard</p>
      </header>

      <main className="p-8 max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">AI Upgrade Proposals</h2>

        {loading ? (
          <div className="text-primary-dark font-medium animate-pulse">Analyzing traffic patterns...</div>
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
            {proposals.length === 0 && <p className="text-gray-500">No new proposals available.</p>}
          </div>
        )}
      </main>
    </div>
  );
}
