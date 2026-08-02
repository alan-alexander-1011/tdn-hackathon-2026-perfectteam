export interface RouteRequestPayload {
  origin: string;
  destination: string;
  currentIncidents: any[];
}

export interface AIAnalysisResponse {
  recommendedWaypoints: { lat: number; lng: number }[];
  estimatedTimeDelay: number;
  upgradeRecommendations: string[];
  aiAvailable: boolean;
  aiError?: string;
}

// Calls /api/route-insights. Never throws for AI-side failures (invalid key,
// quota, upstream outage) -- those come back as aiAvailable:false with an
// aiError message so the caller can still get a route without AI insights.
// Only throws for actual network/request failures.
export async function analyzeRouteWithAI(payload: RouteRequestPayload): Promise<AIAnalysisResponse> {
  try {
    const res = await fetch('/api/route-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        recommendedWaypoints: [],
        estimatedTimeDelay: 0,
        upgradeRecommendations: [],
        aiAvailable: false,
        aiError: data?.error || 'AI route analysis failed',
      };
    }
    return {
      recommendedWaypoints: data.recommendedWaypoints || [],
      estimatedTimeDelay: data.estimatedTimeDelay || 0,
      upgradeRecommendations: data.upgradeRecommendations || [],
      aiAvailable: data.aiAvailable ?? true,
      aiError: data.aiError,
    };
  } catch (err: any) {
    return {
      recommendedWaypoints: [],
      estimatedTimeDelay: 0,
      upgradeRecommendations: [],
      aiAvailable: false,
      aiError: err?.message || 'Không thể kết nối tới máy chủ AI',
    };
  }
}

export interface AreaProposal {
  area: string;
  center: { lat: number; lng: number };
  reportCount: number;
  severity: string;
  analysis_summary: string;
  short_term_solutions: string[];
  long_term_planning: string;
}

export interface ProposalsResult {
  proposals: AreaProposal[];
  aiAvailable: boolean;
  aiError?: string;
}

// GET /api/proposals (admin-only, Next.js API route calling Gemini directly)
export async function getInfrastructureProposals(): Promise<ProposalsResult> {
  const res = await fetch('/api/proposals');
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'AI Infrastructure Proposal Failed');
  return {
    proposals: data.proposals || [],
    aiAvailable: data.aiAvailable ?? true,
    aiError: data.aiError,
  };
}
