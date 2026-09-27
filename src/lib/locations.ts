import { api, getApiErrorMessage, getAuthHeaders } from '@/lib/api';

export interface CitySuggestion {
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface RouteDistance {
  distanceKm: number;
  durationSeconds: number;
}

export async function searchBrazilianCities(
  accessToken: string,
  query: string,
  signal: AbortSignal,
): Promise<CitySuggestion[]> {
  try {
    const response = await api.get<CitySuggestion[]>('/api/locations/cities', {
      headers: getAuthHeaders(accessToken),
      params: { query },
      signal,
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to search cities'));
  }
}

export async function getRouteDistance(
  accessToken: string,
  origin: CitySuggestion,
  destination: CitySuggestion,
  signal: AbortSignal,
): Promise<RouteDistance> {
  try {
    const response = await api.post<RouteDistance>(
      '/api/locations/route',
      {
        originLatitude: origin.latitude,
        originLongitude: origin.longitude,
        destinationLatitude: destination.latitude,
        destinationLongitude: destination.longitude,
      },
      {
        headers: getAuthHeaders(accessToken),
        signal,
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to calculate route distance'));
  }
}
