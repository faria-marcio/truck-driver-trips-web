import axios from 'axios';
import { api, getApiErrorMessage, getAuthHeaders } from '@/lib/api';
import type { ApiResponse, Truck, TruckAssignment, TruckInput } from '@/types';

export const TRUCK_ENDPOINTS = {
  collection: '/api/trucks',
  currentAssignment: '/api/trucks/me',
  assignments: '/api/trucks/assignments',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
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

function getTruckPayload(value: unknown): Truck {
  const payload = unwrapData(value);

  if (!isRecord(payload)) {
    throw new Error(getPayloadError(value, 'The API returned an invalid truck response'));
  }

  const id = getString(payload.id);
  const registrationNumber =
    getString(payload.registrationNumber) ??
    getString(payload.identifier);

  if (!id || !registrationNumber) {
    throw new Error(getPayloadError(value, 'The API returned an invalid truck response'));
  }

  const retiredAtUtc = getString(payload.retiredAtUtc);
  const createdAtUtc = getString(payload.createdAtUtc);
  const updatedAtUtc = getString(payload.updatedAtUtc);
  const isActive =
    getBoolean(payload.isActive) ??
    getBoolean(payload.active) ??
    retiredAtUtc === null;

  if (!createdAtUtc || !updatedAtUtc) {
    throw new Error(getPayloadError(value, 'The API returned an invalid truck response'));
  }

  return {
    id,
    registrationNumber,
    make: getString(payload.make),
    model: getString(payload.model),
    isActive,
    retiredAtUtc,
    createdAtUtc,
    updatedAtUtc,
    assignedDriverId: getString(payload.assignedDriverId),
    assignedDriverName: getString(payload.assignedDriverName),
  };
}

function getTruckListPayload(value: unknown): Truck[] {
  const payload = unwrapData(value);

  if (Array.isArray(payload)) {
    return payload.map((item) => getTruckPayload(item));
  }

  if (isRecord(payload)) {
    const trucks = payload.items ?? payload.trucks ?? payload.results;
    if (Array.isArray(trucks)) {
      return trucks.map((item) => getTruckPayload(item));
    }
  }

  throw new Error(getPayloadError(value, 'The API returned an invalid truck list response'));
}

function normalizeTruckInput(input: TruckInput): TruckInput {
  return {
    ...input,
    registrationNumber: input.registrationNumber.trim(),
    make: input.make?.trim() || null,
    model: input.model?.trim() || null,
  };
}

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export async function listTrucks(
  accessToken: string,
  options: { includeRetired?: boolean } = {},
): Promise<Truck[]> {
  try {
    const response = await api.get<Truck[] | ApiResponse<Truck[]>>(TRUCK_ENDPOINTS.collection, {
      headers: getAuthHeaders(accessToken),
      params: options.includeRetired ? { includeRetired: true } : undefined,
    });

    return getTruckListPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to load trucks'));
  }
}

export async function getCurrentTruckAssignment(accessToken: string): Promise<TruckAssignment> {
  try {
    const response = await api.get<Truck | ApiResponse<Truck>>(TRUCK_ENDPOINTS.currentAssignment, {
      headers: getAuthHeaders(accessToken),
    });

    return getTruckPayload(response.data);
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return null;
    }

    throw new Error(getApiErrorMessage(error, 'Failed to load your current truck assignment'));
  }
}

export async function createTruck(accessToken: string, input: TruckInput): Promise<Truck> {
  try {
    const response = await api.post<Truck | ApiResponse<Truck>>(
      TRUCK_ENDPOINTS.collection,
      normalizeTruckInput(input),
      { headers: getAuthHeaders(accessToken) },
    );

    return getTruckPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to create truck'));
  }
}

export async function updateTruck(
  accessToken: string,
  truckId: string,
  input: TruckInput,
): Promise<Truck> {
  try {
    const response = await api.put<Truck | ApiResponse<Truck>>(
      `${TRUCK_ENDPOINTS.collection}/${encodeURIComponent(truckId)}`,
      normalizeTruckInput(input),
      { headers: getAuthHeaders(accessToken) },
    );

    return getTruckPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to update truck'));
  }
}

export async function retireTruck(accessToken: string, truckId: string): Promise<Truck> {
  try {
    const response = await api.post<Truck | ApiResponse<Truck>>(
      `${TRUCK_ENDPOINTS.collection}/${encodeURIComponent(truckId)}/retire`,
      undefined,
      { headers: getAuthHeaders(accessToken) },
    );

    return getTruckPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to retire truck'));
  }
}

export async function assignTruckToDriver(
  accessToken: string,
  driverId: string,
  truckId: string,
): Promise<Truck> {
  try {
    const response = await api.put<Truck | ApiResponse<Truck>>(
      `${TRUCK_ENDPOINTS.assignments}/${encodeURIComponent(driverId)}`,
      { truckId },
      { headers: getAuthHeaders(accessToken) },
    );

    return getTruckPayload(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to assign truck'));
  }
}

export async function clearTruckAssignment(accessToken: string, driverId: string): Promise<void> {
  try {
    await api.delete(`${TRUCK_ENDPOINTS.assignments}/${encodeURIComponent(driverId)}`, {
      headers: getAuthHeaders(accessToken),
    });
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, 'Failed to clear truck assignment'));
  }
}
