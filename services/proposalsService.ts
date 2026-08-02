// Đề xuất nâng cấp hạ tầng theo khu vực -- được tính bằng thuật toán quy tắc
// (lib/ruleEngine.ts) chạy phía server, KHÔNG dùng AI.

import { IncidentType } from '@/services/incidentTypes';

export interface AreaProposal {
  area: string;
  center: { lat: number; lng: number };
  reportCount: number;
  severity: 'Cao' | 'Trung bình' | 'Thấp';
  analysis_summary: string;
  short_term_solutions: string[];
  long_term_planning: string;
  dominant_type: IncidentType;
}

// GET /api/proposals
export async function getInfrastructureProposals(): Promise<AreaProposal[]> {
  const res = await fetch('/api/proposals');
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Không thể tạo đề xuất nâng cấp');
  return data.proposals || [];
}
