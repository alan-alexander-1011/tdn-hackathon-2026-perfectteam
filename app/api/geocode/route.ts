import { NextResponse } from 'next/server';

// Proxies geocoding requests to OpenStreetMap's Nominatim service.
// Done server-side (not called directly from the browser) so we can set a
// proper User-Agent, which Nominatim's usage policy requires:
// https://operations.osmfoundation.org/policies/nominatim/
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
      {
        headers: {
          // Replace with your real app name / contact info before going to production.
          'User-Agent': 'SmartTrafficAI/1.0 (contact: your-email@example.com)',
          'Accept-Language': 'vi',
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Nominatim request failed' }, { status: 502 });
    }

    const data = await res.json();
    if (!data.length) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
