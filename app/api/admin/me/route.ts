import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(req: Request) {
  const isAdmin = await isAdminRequest(req);
  return NextResponse.json({ isAdmin });
}
