// src/lib/country-coordinates.ts

export const mockCountryCoordinates: {
  [key: string]: { lat: number; lng: number };
} = {
  Germany: { lat: 51.1657, lng: 10.4515 },
  France: { lat: 46.6034, lng: 1.8883 },
  Italy: { lat: 41.8719, lng: 12.5674 },
  Spain: { lat: 40.4637, lng: -3.7492 },
  Poland: { lat: 51.9194, lng: 19.1451 },
  USA: { lat: 37.0902, lng: -95.7129 },
  China: { lat: 35.8617, lng: 104.1954 },
  Japan: { lat: 36.2048, lng: 138.2529 },
  'United Kingdom': { lat: 55.3781, lng: -3.436 },
  Canada: { lat: 56.1304, lng: -106.3468 },
  India: { lat: 20.5937, lng: 78.9629 },
  Netherlands: { lat: 52.1326, lng: 5.2913 },
  'South Korea': { lat: 35.9078, lng: 127.7669 },
  Brazil: { lat: -14.235, lng: -51.9253 },
  Vietnam: { lat: 14.0583, lng: 108.2772 },
  'Port of Gdansk': { lat: 54.401, lng: 18.675 },
  Rotterdam: { lat: 51.9225, lng: 4.47917 },
  Antwerp: { lat: 51.2213, lng: 4.4051 },
  Bremerhaven: { lat: 53.5425, lng: 8.5819 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  Berlin: { lat: 52.52, lng: 13.405 },
  Paris: { lat: 48.8566, lng: 2.3522 },
  Frankfurt: { lat: 50.1109, lng: 8.6821 },
  Lyon: { lat: 45.764, lng: 4.8357 },
  Stuttgart: { lat: 48.7758, lng: 9.1829 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Shenzhen: { lat: 22.5431, lng: 114.0579 },
  'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297 },
  Newark: { lat: 40.7357, lng: -74.1724 },
};

/**
 * Extracts a known country or city name from a location string.
 * It prioritizes matching the full string, then the last part (country), then the second to last (city).
 * @param locationString The location string, e.g., "Port of Gdansk, Poland"
 * @returns A string with the matched location name, or null.
 */
export function getCountryFromLocationString(
  locationString?: string,
): string | null {
  if (!locationString) return null;
  const normalizedLocation = locationString.trim();
  if (mockCountryCoordinates[normalizedLocation]) {
    return normalizedLocation;
  }
  const parts = normalizedLocation.split(',').map(p => p.trim());
  const country = parts.pop();
  if (country && mockCountryCoordinates[country]) {
    return country;
  }
  const city = parts.pop();
  if (city && mockCountryCoordinates[city]) {
    return city;
  }
  return country || null;
}
