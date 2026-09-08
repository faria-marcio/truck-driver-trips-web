import { api, getApiErrorMessage, getAuthHeaders } from '@/lib/api';
import type {
  ApiResponse,
  CreateTripInput,
  Trip,
  TripInput,
  TripQuery,
  TripSummary,
  UpdateTripInput,
} from '@/types';

export type TripPeriod = 'today' | 'week' | 'month' | 'all';

interface TripDateRange {
  from?: string;
  to?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function unwrapData(value: unknown): unknown {
  if (isRecord(value) && value.data !== undefined) {
    return value.data;
  }

  return value;
}

function getPayloadError(value: unknown, fallback: string): string {
  if (isRecord(value)) {
    if (typeof value.error === 'string' && value.error.trim()) {
      return value.error;
    }

    if (typeof value.message === 'string' && value.message.trim()) {
      return value.message;
    }
  }

  return fallback;
}

function getTripPayload(value: unknown): Trip {
  const payload = unwrapData(value);

  if (isRecord(payload) && typeof payload.id === 'string') {
    return payload as unknown as Trip;
  }

  throw new Error(getPayloadError(value, 'The API returned an invalid trip response'));
}

function getTripsPayload(value: unknown): Trip[] {
  const payload = unwrapData(value);

  if (Array.isArray(payload)) {
    return payload as Trip[];
  }

  if (isRecord(payload)) {
    const trips = payload.items ?? payload.trips ?? payload.results;
    if (Array.isArray(trips)) {
      return trips as Trip[];
    }
  }

  throw new Error(getPayloadError(value, 'The API returned an invalid trip list response'));
}

function getSummaryPayload(value: unknown): TripSummary {
  const payload = unwrapData(value);

  if (
    isRecord(payload) &&
    typeof payload.count === 'number' &&
    typeof payload.totalDistanceKm === 'number' &&
    typeof payload.totalCommissionAmount === 'number' &&
    typeof payload.commissionPerKm === 'number'
  ) {
    return payload as unknown as TripSummary;
  }

  throw new Error(getPayloadError(value, 'The API returned an invalid trip summary response'));
}

function normalizeTripInput(input: TripInput): TripInput {
  return {
    ...input,
    bolNumber: input.bolNumber?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

function formatDateForQuery(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfCurrentWeek(date: Date): Date {
  const result = new Date(date);
  const dayOfWeek = result.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  result.setDate(result.getDate() - daysFromMonday);
  return result;
}

export function getTripDateRange(period: TripPeriod, referenceDate = new Date()): TripDateRange {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  if (period === 'today') {
    const date = formatDateForQuery(today);
    return { from: date, to: date };
  }

  if (period === 'week') {
    return { from: formatDateForQuery(startOfCurrentWeek(today)), to: formatDateForQuery(today) };
  }

  if (period === 'month') {
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: formatDateForQuery(firstDayOfMonth), to: formatDateForQuery(today) };
  }

  return {};
}

export async function listTrips(accessToken: string, query: TripQuery = {}): Promise<Trip[]> {
  try {
    const response = await api.get<Trip[] | ApiResponse<Trip[]>>('/api/trips', {
      headers: getAuthHeaders(accessToken),
      params: query,
    });

    return getTripsPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to load trips'));
  }
}

export async function getTripSummary(accessToken: string, query: TripQuery = {}): Promise<TripSummary> {
  try {
    const response = await api.get<TripSummary | ApiResponse<TripSummary>>('/api/trips/summary', {
      headers: getAuthHeaders(accessToken),
      params: query,
    });

    return getSummaryPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to load trip summary'));
  }
}

export async function createTrip(accessToken: string, input: CreateTripInput): Promise<Trip> {
  try {
    const response = await api.post<Trip | ApiResponse<Trip>>('/api/trips', normalizeTripInput(input), {
      headers: getAuthHeaders(accessToken),
    });

    return getTripPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to create trip'));
  }
}

export async function updateTrip(
  accessToken: string,
  tripId: string,
  input: UpdateTripInput,
): Promise<Trip> {
  try {
    const response = await api.put<Trip | ApiResponse<Trip>>(
      `/api/trips/${encodeURIComponent(tripId)}`,
      normalizeTripInput(input),
      {
        headers: getAuthHeaders(accessToken),
      },
    );

    return getTripPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to update trip'));
  }
}

export async function deleteTrip(accessToken: string, tripId: string): Promise<void> {
  try {
    await api.delete(`/api/trips/${encodeURIComponent(tripId)}`, {
      headers: getAuthHeaders(accessToken),
    });
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to delete trip'));
  }
}

export function toTripInput(trip: Trip): TripInput {
  return {
    date: trip.date,
    truckId: trip.truckId,
    startKm: trip.startKm,
    endKm: trip.endKm,
    pickupLocation: trip.pickupLocation,
    dropoffLocation: trip.dropoffLocation,
    commissionAmount: trip.commissionAmount,
    bolNumber: trip.bolNumber,
    fuelCostAmount: trip.fuelCostAmount,
    waitTimeMinutes: trip.waitTimeMinutes,
    notes: trip.notes,
  };
}
