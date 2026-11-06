/**
 * Geocoding Service (Nominatim OpenStreetMap proxy with rate limiting, caching & fallback)
 */

const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let lastCallTimestamp = 0;
const MIN_CALL_INTERVAL_MS = 1000; // Nominatim policy: 1 req/sec max

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class GeoService {
  constructor() {
    this.userAgent = 'ChiefNet/1.0 (contact@chiefnet.com)';
  }

  async _fetchWithRateLimit(url) {
    const now = Date.now();
    const elapsed = now - lastCallTimestamp;
    if (elapsed < MIN_CALL_INTERVAL_MS) {
      await sleep(MIN_CALL_INTERVAL_MS - elapsed);
    }
    lastCallTimestamp = Date.now();

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Language': 'en'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async search(query) {
    const trimmed = (query || '').trim().toLowerCase();
    if (!trimmed) return [];

    const cacheKey = `search:${trimmed}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&addressdetails=1&limit=5`;
      const rawResults = await this._fetchWithRateLimit(url);

      const formatted = (rawResults || []).map((item) => ({
        placeId: item.place_id,
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
        address: item.address
      }));

      cache.set(cacheKey, { data: formatted, timestamp: Date.now() });
      return formatted;
    } catch (err) {
      console.warn(`[GeoService] Nominatim search failed for "${query}":`, err.message);
      return [];
    }
  }

  async reverse(lat, lng) {
    const cacheKey = `rev:${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
      const raw = await this._fetchWithRateLimit(url);

      const result = {
        displayName: raw.display_name || '',
        address: raw.address || {},
        lat: parseFloat(raw.lat || lat),
        lng: parseFloat(raw.lon || lng)
      };

      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.warn(`[GeoService] Nominatim reverse failed for [${lat}, ${lng}]:`, err.message);
      return {
        displayName: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
        address: {},
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }
  }
}

module.exports = new GeoService();

