import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

interface Incident {
  type: string;
  note?: string;
  coordinates: { lat: number; lng: number };
}

interface RouteInsightsResponse {
  recommendedWaypoints: { lat: number; lng: number }[];
  estimatedTimeDelay: number;
  upgradeRecommendations: string[];
}

// POST /api/route-insights
// body: { origin: "lat,lng", destination: "lat,lng", currentIncidents: Incident[] }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin, destination, currentIncidents = [] } = body as {
      origin: string;
      destination: string;
      currentIncidents: Incident[];
    };

    if (!origin || !destination) {
      return NextResponse.json({ error: 'Thiếu origin hoặc destination' }, { status: 400 });
    }

    const incidentText = currentIncidents.length
      ? currentIncidents
          .map((i, idx) => {
            const note = i.note ? ` (${i.note})` : '';
            return `- Sự cố ${idx + 1}: loại "${i.type}"${note} tại (${i.coordinates.lat}, ${i.coordinates.lng})`;
          })
          .join('\n')
      : 'Không có sự cố nào được báo cáo gần đây.';

    const prompt = `
Bạn là một hệ thống AI hỗ trợ điều hướng giao thông đô thị.

Điểm đi: ${origin}
Điểm đến: ${destination}

Các sự cố giao thông đang được báo cáo trong khu vực:
${incidentText}

Hãy trả về ĐÚNG định dạng JSON sau (không chứa markdown hay text thừa):
{
  "recommendedWaypoints": [{"lat": number, "lng": number}],
  "estimatedTimeDelay": number,
  "upgradeRecommendations": ["gợi ý ngắn gọn 1", "gợi ý ngắn gọn 2"]
}

Quy tắc:
- "recommendedWaypoints" chỉ nên chứa điểm trung gian NẾU cần tránh một sự cố nghiêm trọng (tai nạn, ngập nước) nằm rất gần tuyến đường thẳng giữa điểm đi và điểm đến. Nếu không cần, trả về mảng rỗng [].
- "estimatedTimeDelay" là số phút trễ ước tính do sự cố (0 nếu không ảnh hưởng).
- "upgradeRecommendations" là danh sách 1-3 gợi ý ngắn gọn (mỗi gợi ý dưới 20 từ) cho người lái xe, bằng tiếng Việt.
`.trim();

    const data = await generateJSON<RouteInsightsResponse>(prompt);

    return NextResponse.json({
      recommendedWaypoints: data.recommendedWaypoints || [],
      estimatedTimeDelay: data.estimatedTimeDelay || 0,
      upgradeRecommendations: data.upgradeRecommendations || [],
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'AI route analysis failed' }, { status: 500 });
  }
}
