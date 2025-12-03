import type { APIRoute } from 'astro';

export const prerender = false;

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const DEFAULT_LIMIT = '5';

export const GET: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing search query parameter "q"' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const limit = searchParams.get('limit') ?? DEFAULT_LIMIT;

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '0',
    polygon_geojson: '0',
    limit,
    extratags: '0',
  });

  try {
    const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
      headers: {
        'User-Agent': 'StrayWatch/1.0 (contact@straywatch.local)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Geocoding provider error' }), {
        status: response.status === 429 ? 429 : 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = await response.text();

    return new Response(payload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Geocode proxy error', error);
    return new Response(JSON.stringify({ error: 'Unable to reach geocoding provider' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
