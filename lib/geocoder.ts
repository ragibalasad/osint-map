interface HighValueTarget {
  name: string;
  lat: number;
  lng: number;
  keywords: string[];
}

const HIGH_VALUE_TARGETS: HighValueTarget[] = [
  {
    name: "White House",
    lat: 38.8977,
    lng: -77.0365,
    keywords: ["white house", "1600 pennsylvania ave"],
  },
  {
    name: "Pentagon",
    lat: 38.8719,
    lng: -77.0563,
    keywords: ["pentagon", "dod headquarters"],
  },
  {
    name: "Kremlin",
    lat: 55.7517,
    lng: 37.6178,
    keywords: ["kremlin", "red square"],
  },
  {
    name: "Capitol Hill",
    lat: 38.8899,
    lng: -77.0091,
    keywords: ["capitol hill", "us capitol"],
  },
];

/**
 * Stage 2 Geocoding Engine
 * 1. Check for High-Value Targets (HVT)
 * 2. Query Photon (OSM) for specialized location coordinates
 */
export async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
  const normalized = locationName.toLowerCase();

  // 1. HVT Fast Match
  const hvt = HIGH_VALUE_TARGETS.find((target) =>
    target.keywords.some((keyword) => normalized.includes(keyword)) ||
    normalized === target.name.toLowerCase()
  );

  if (hvt) {
    console.log(`🎯 High-Value Target Match: ${hvt.name}`);
    return { lat: hvt.lat, lng: hvt.lng };
  }

  // 2. Photon (OpenStreetMap) Query
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(locationName)}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      console.log(`🗺️ Photon Geocoding Success: ${locationName} -> ${lat}, ${lng}`);
      return { lat, lng };
    }
  } catch (err) {
    console.error("❌ Photon Geocoding Failed:", err);
  }

  return null;
}
