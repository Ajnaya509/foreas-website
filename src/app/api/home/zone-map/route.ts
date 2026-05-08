/**
 * GET /api/home/zone-map?zone=<zone_match>&w=320&h=120&zoom=14
 *
 * Brief PIEUVRE_ZONE_LANDMARKS v1.1 — proxy Mapbox Static API.
 * Pourquoi un proxy : le token Mapbox est `sk.*` (secret) — interdit en client-side.
 * Le serveur fetche l'image, la cache 24h via headers, et la sert au browser.
 *
 * Usage : <img src="/api/home/zone-map?zone=Bercy%20%2F%20Gare%20de%20Lyon" alt="map" />
 *
 * Source coordonnées : table `zone_centroids` (Supabase). Zone non-mappée → 404.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
// Cache au niveau du runtime Vercel
export const revalidate = 86400

async function getCentroid(zone: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(url, key)
  const { data, error } = await sb
    .from('zone_centroids')
    .select('lat,lng,zoom')
    .eq('zone_match', zone)
    .maybeSingle()
  if (error || !data) return null
  return data as { lat: number; lng: number; zoom: number }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const zone = url.searchParams.get('zone')
  const w = Math.min(Math.max(parseInt(url.searchParams.get('w') || '320', 10), 100), 1280)
  const h = Math.min(Math.max(parseInt(url.searchParams.get('h') || '120', 10), 80), 720)
  const zoomOverride = parseInt(url.searchParams.get('zoom') || '0', 10)

  if (!zone) {
    return NextResponse.json({ error: 'zone required' }, { status: 400 })
  }

  const token = process.env.MAPBOX_API_KEY
  if (!token) {
    return NextResponse.json({ error: 'MAPBOX_API_KEY not configured' }, { status: 503 })
  }

  const centroid = await getCentroid(zone)
  if (!centroid) {
    return NextResponse.json({ error: 'no centroid for zone' }, { status: 404 })
  }

  const z = zoomOverride > 0 && zoomOverride <= 20 ? zoomOverride : centroid.zoom
  // Style streets-v12 = clean Apple-like ; pin-l-marker rouge ; @2x retina
  // Format URL Mapbox Static :
  //   /styles/v1/mapbox/<style>/static/<overlays>/<lon>,<lat>,<zoom>/<wxh>@2x?access_token=...
  const overlay = `pin-l+ff3344(${centroid.lng},${centroid.lat})`
  const mapboxUrl =
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `${overlay}/` +
    `${centroid.lng},${centroid.lat},${z},0/` +
    `${w}x${h}@2x` +
    `?access_token=${token}&logo=false&attribution=false`

  try {
    const res = await fetch(mapboxUrl, { next: { revalidate: 86400 } })
    if (!res.ok) {
      const txt = await res.text()
      console.warn('[zone-map] Mapbox failed', res.status, txt.slice(0, 200))
      return NextResponse.json({ error: 'mapbox upstream error' }, { status: 502 })
    }
    const buf = await res.arrayBuffer()
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'X-Foreas-Zone': zone,
      },
    })
  } catch (err) {
    console.error('[zone-map] Error:', (err as Error).message)
    return NextResponse.json({ error: 'fetch failed' }, { status: 503 })
  }
}
