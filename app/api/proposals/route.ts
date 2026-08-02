import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import { generateJSON } from '@/lib/gemini';
import { INCIDENT_TYPES } from '@/services/incidentTypes';

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(INCIDENT_TYPES).map(([key, meta]) => [key, meta.label])
);

interface ProposalResult {
  severity: string;
  analysis_summary: string;
  short_term_solutions: string[];
  long_term_planning: string;
}

// Buckets incidents into a rough ~1.1km grid so nearby reports get analyzed
// together as one "area" -- the direct equivalent of main.py's AreaData
// (area_name + feedbacks) that the frontend used to build by hand.
function areaKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

// GET /api/proposals -- open for this demo (no admin auth gate)
export async function GET() {
  await dbConnect();
  try {
    const incidents = await Report.find({}).sort({ timestamp: -1 }).limit(300);

    const groups = new Map<string, any[]>();
    for (const incident of incidents) {
      const key = areaKey(incident.coordinates.lat, incident.coordinates.lng);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(incident);
    }

    // Only analyze areas with at least 2 reports -- a single, isolated
    // report rarely warrants a full infrastructure proposal.
    const candidateAreas = [...groups.entries()]
      .filter(([, items]) => items.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6);

    if (candidateAreas.length === 0) {
      return NextResponse.json({ proposals: [] });
    }

    const results = await Promise.allSettled(
      candidateAreas.map(async ([key, items]) => {
        // Same shape as main.py's `feedback_text` join.
        const feedbackText = items
          .map((fb, i) => {
            const label = TYPE_LABELS[fb.type] || fb.type;
            const note = fb.note ? `: ${fb.note}` : '';
            return `- Ý kiến ${i + 1} (${label})${note}`;
          })
          .join('\n');

        // Prompt ported near-verbatim from main.py's generate_proposals().
        const prompt = `
Bạn là một chuyên gia quy hoạch đô thị và quản lý thành phố. Dưới đây là các ý kiến và vấn đề người dân báo cáo tại khu vực có tọa độ trung tâm khoảng '${key}':

${feedbackText}

Dựa trên các dữ liệu trên, hãy phân tích và trả về ĐÚNG định dạng JSON sau (không chứa markdown hay text thừa):
{
    "severity": "Cao/Trung bình/Thấp",
    "analysis_summary": "Tóm tắt ngắn gọn vấn đề chính",
    "short_term_solutions": [
        "Giải pháp 1",
        "Giải pháp 2"
    ],
    "long_term_planning": "Một đề xuất quy hoạch dài hạn"
}
`.trim();

        const result = await generateJSON<ProposalResult>(prompt);
        const [lat, lng] = key.split(',').map(Number);

        return {
          area: key,
          center: { lat, lng },
          reportCount: items.length,
          ...result,
        };
      })
    );

    const proposals = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length) {
      console.error(`[proposals] ${failures.length}/${results.length} area(s) failed Gemini analysis:`, failures[0]);
    }

    return NextResponse.json({
      proposals,
      aiAvailable: proposals.length > 0 || failures.length === 0,
      aiError:
        failures.length && proposals.length === 0
          ? (failures[0] as PromiseRejectedResult).reason?.message || 'AI analysis failed'
          : undefined,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to generate proposals' }, { status: 500 });
  }
}
