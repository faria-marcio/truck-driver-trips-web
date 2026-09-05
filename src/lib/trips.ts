import { api, getApiErrorMessage, getAuthHeaders } from '@/lib/api';
import type { ApiResponse, CreateTripInput, Trip } from '@/types';

function getTripPayload(data: Trip | ApiResponse<Trip>): Trip {
  if ('id' in data) {
    return data;
  }

  if (data.data) {
    return data.data;
  }

  throw new Error(data.error ?? data.message ?? 'Failed to create trip');
}

function getTripsPayload(data: Trip[] | ApiResponse<Trip[]>): Trip[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data.data) {
    return data.data;
  }

  throw new Error(data.error ?? data.message ?? 'Failed to load trips');
}

export async function listTrips(accessToken: string): Promise<Trip[]> {
  try {
    const response = await api.get<Trip[] | ApiResponse<Trip[]>>('/api/trips', {
      headers: getAuthHeaders(accessToken),
    });

    return getTripsPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to load trips'));
  }
}

export async function createTrip(accessToken: string, input: CreateTripInput): Promise<Trip> {
  try {
    const response = await api.post<Trip | ApiResponse<Trip>>('/api/trips', input, {
      headers: getAuthHeaders(accessToken),
    });

    return getTripPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to create trip'));
  }
}
