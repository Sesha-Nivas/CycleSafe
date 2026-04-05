// Ride tracking utilities

export interface RideData {
  isRiding: boolean;
  startTime: number | null;
  distance: number; // km
  duration: number; // seconds
  avgSpeed: number; // km/h
  calories: number;
  currentSpeed: number;
  route: {
    start: { lat: number; lng: number; address: string } | null;
    end: { lat: number; lng: number; address: string } | null;
    estimatedTime: number; // minutes
    elevation: number; // meters
    safetyRating: string;
    totalDistance: number; // km
  };
}

export const calculateCalories = (distance: number, avgSpeed: number): number => {
  // Average calories burned cycling: ~0.5 calories per kg per km
  // Assuming average weight of 70kg
  const baseCalories = distance * 0.5 * 70;
  const speedFactor = avgSpeed > 20 ? 1.3 : avgSpeed > 15 ? 1.1 : 1.0;
  return Math.round(baseCalories * speedFactor);
};

export const calculateSafetyScore = (
  avgSpeed: number,
  duration: number,
  safetyRating: string
): number => {
  let score = 100;

  // Deduct points for excessive speed
  if (avgSpeed > 30) score -= 15;
  else if (avgSpeed > 25) score -= 10;
  else if (avgSpeed > 20) score -= 5;

  // Deduct based on route safety
  if (safetyRating === 'Low') score -= 10;
  else if (safetyRating === 'Medium') score -= 5;

  // Bonus for longer, safer rides
  if (duration > 1800 && safetyRating === 'Safe') score += 5;

  return Math.max(60, Math.min(100, score));
};

export const calculateElevation = (distance: number): number => {
  // Random elevation between 10-100m per 10km
  return Math.round((Math.random() * 90 + 10) * (distance / 10));
};

export const getSafetyRating = (bikeLanes: number, traffic: string): string => {
  if (bikeLanes >= 3 && traffic === 'Low') return 'Safe';
  if (bikeLanes >= 2 || traffic === 'Low') return 'Medium';
  return 'Low';
};

export const estimateTime = (distance: number, avgSpeed: number = 16): number => {
  // distance in km, avgSpeed in km/h
  return Math.round((distance / avgSpeed) * 60); // returns minutes
};

// Simulate GPS tracking
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to San Francisco if geolocation fails
          resolve({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      // Default to San Francisco
      resolve({ lat: 37.7749, lng: -122.4194 });
    }
  });
};

export const getAddressFromCoords = async (
  lat: number,
  lng: number
): Promise<string> => {
  // In a real app, you'd use Google Maps Geocoding API
  // For now, return a placeholder
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};
