const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Cliff at 0.1 km (same building), gradual decay to 5 km, zero beyond.
 * Hotels 200 m apart are almost certainly different properties; the cliff
 * prevents coordinate-only false positives between nearby hotels.
 */
export function distanceScore(km: number): number {
  if (km <= 0.1) return 1.0;
  if (km <= 0.5) return 0.9;
  if (km <= 1.0) return 0.7;
  if (km <= 2.0) return 0.5;
  if (km <= 5.0) return 0.2;
  return 0;
}
