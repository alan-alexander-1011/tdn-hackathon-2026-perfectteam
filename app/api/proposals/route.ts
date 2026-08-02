import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import { groupIncidentsByArea, generateAreaProposals } from '@/lib/ruleEngine';

// GET /api/proposals -- đề xuất nâng cấp hạ tầng theo khu vực.
// Không dùng AI: chỉ gom nhóm báo cáo theo khu vực rồi áp thuật toán quy tắc
// (lib/ruleEngine.ts) để chọn ra kịch bản đề xuất phù hợp có sẵn.
export async function GET() {
  await dbConnect();
  try {
    const incidents = await Report.find({}).sort({ timestamp: -1 }).limit(300);

    const groups = groupIncidentsByArea(incidents as any)
      // Chỉ phân tích khu vực có từ 2 báo cáo trở lên -- một báo cáo đơn lẻ
      // chưa đủ để đề xuất nâng cấp hạ tầng.
      .filter((g) => g.items.length >= 2)
      .sort((a, b) => b.items.length - a.items.length)
      .slice(0, 6);

    const proposals = generateAreaProposals(groups);

    return NextResponse.json({ proposals });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to generate proposals' }, { status: 500 });
  }
}
