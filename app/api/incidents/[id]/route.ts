import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

// DELETE /api/incidents/:id -- dùng bởi trang quản lý báo cáo (/admin) để xoá
// một báo cáo cụ thể.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const deleted = await Report.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Xoá báo cáo thất bại' }, { status: 500 });
  }
}
