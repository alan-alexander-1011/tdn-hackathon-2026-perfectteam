import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import { isAdminRequest } from '@/lib/adminAuth';

// Haversine distance in kilometers between two lat/lng points.
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/incidents            -> all incidents
// GET /api/incidents?lat=&lng=&radius=  -> only incidents within `radius` km (default 5km)
export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radiusKm = parseFloat(searchParams.get('radius') || '5');

    const incidents = await Report.find({}).sort({ timestamp: -1 });

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const nearby = incidents.filter((incident: any) =>
        getDistanceKm(userLat, userLng, incident.coordinates.lat, incident.coordinates.lng) <= radiusKm
      );
      return NextResponse.json(nearby);
    }

    return NextResponse.json(incidents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

// body: { type, coordinates: {lat,lng}, note?, source?: 'gps' | 'admin_pinpoint' }
// `admin_pinpoint` means the reporter dropped a pin anywhere on the map
// instead of using their own GPS location -- only admins are allowed to do
// that, so it's checked server-side here, not just hidden in the UI.
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const source = body.source === 'admin_pinpoint' ? 'admin_pinpoint' : 'gps';

    if (source === 'admin_pinpoint' && !(await isAdminRequest(req))) {
      return NextResponse.json(
        { error: 'Chỉ admin mới có thể ghim vị trí báo cáo tuỳ ý' },
        { status: 403 }
      );
    }

    const newReport = await Report.create({
      type: body.type,
      coordinates: body.coordinates,
      note: body.note,
      source,
    });
    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
