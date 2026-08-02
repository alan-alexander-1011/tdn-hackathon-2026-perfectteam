import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

const VALID_TYPES = new Set(['environment', 'infrastructure', 'utilities', 'safety']);

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

// GET /api/incidents                    -> all incidents
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

// body: { type, coordinates: {lat,lng}, note? }
// Anyone can report at any point they pin on the map -- there is no GPS-only
// restriction, so the location the person selected is trusted as-is.
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();

    if (!VALID_TYPES.has(body.type)) {
      return NextResponse.json({ error: 'Loại sự cố không hợp lệ' }, { status: 400 });
    }
    const lat = body?.coordinates?.lat;
    const lng = body?.coordinates?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Toạ độ không hợp lệ' }, { status: 400 });
    }

    const newReport = await Report.create({
      type: body.type,
      coordinates: { lat, lng },
      note: body.note,
    });
    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
