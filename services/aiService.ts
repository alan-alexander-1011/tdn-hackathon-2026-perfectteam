export interface RouteRequestPayload {
  origin: string;
  destination: string;
  currentIncidents: any[];
}

export interface AIAnalysisResponse {
  recommendedWaypoints: { lat: number; lng: number }[];
  estimatedTimeDelay: number;
  upgradeRecommendations: string[];
}

// Was: POST `${PYTHON_BACKEND_URL}/analyze-route`
// Now: POST /api/route-insights (Next.js API route calling Gemini directly)
export async function analyzeRouteWithAI(payload: RouteRequestPayload): Promise<AIAnalysisResponse> {
  const res = await fetch('/api/route-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('AI Route Analysis Failed');
  return res.json();
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

// Was: POST `${PYTHON_BACKEND_URL}/propose-upgrades`
// Now: GET /api/proposals (admin-only, Next.js API route calling Gemini directly)
export async function getInfrastructureProposals(): Promise<AreaProposal[]> {
  const res = await fetch('/api/proposals');
  if (!res.ok) throw new Error('AI Infrastructure Proposal Failed');
  const data = await res.json();
  return data.proposals || [];
}
