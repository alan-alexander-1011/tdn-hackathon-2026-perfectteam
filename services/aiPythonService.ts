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

const BASE_URL = process.env.PYTHON_BACKEND_URL;

export async function analyzeRouteWithAI(payload: RouteRequestPayload): Promise<AIAnalysisResponse> {
  const res = await fetch(`${BASE_URL}/analyze-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('AI Route Analysis Failed');
  return res.json();
}

export async function generateInfrastructureProposals(aggregatedData: any) {
  const res = await fetch(`${BASE_URL}/propose-upgrades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(aggregatedData),
  });

  if (!res.ok) throw new Error('AI Infrastructure Proposal Failed');
  return res.json();
}
