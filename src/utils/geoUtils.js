const EARTH_RADIUS_MILES = 3958.8;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isPointInCircle(lat, lng, centerLat, centerLng, radiusMiles) {
  return haversineDistance(lat, lng, centerLat, centerLng) <= radiusMiles;
}

export function isPointInBounds(lat, lng, bounds) {
  const { _southWest, _northEast } = bounds;
  return (
    lat >= _southWest.lat &&
    lat <= _northEast.lat &&
    lng >= _southWest.lng &&
    lng <= _northEast.lng
  );
}

export function isPointInPolygon(lat, lng, polygonLatLngs) {
  let inside = false;
  const n = polygonLatLngs.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygonLatLngs[i].lat, yi = polygonLatLngs[i].lng;
    const xj = polygonLatLngs[j].lat, yj = polygonLatLngs[j].lng;
    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function milesToMeters(miles) {
  return miles * 1609.34;
}
