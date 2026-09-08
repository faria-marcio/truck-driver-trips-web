export type UserRole = 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Trip {
  id: string;
  driverId: string;
  date: string;
  truckId: string;
  startKm: number;
  endKm: number;
  distanceKm: number;
  pickupLocation: string;
  dropoffLocation: string;
  commissionAmount: number;
  bolNumber: string | null;
  fuelCostAmount: number;
  waitTimeMinutes: number;
  notes: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  version?: number | null;
}

export interface TripInput {
  date: string;
  truckId: string;
  startKm: number;
  endKm: number;
  pickupLocation: string;
  dropoffLocation: string;
  commissionAmount: number;
  bolNumber: string | null;
  fuelCostAmount: number;
  waitTimeMinutes: number;
  notes: string | null;
}

export type CreateTripInput = TripInput;
export type UpdateTripInput = TripInput;

export interface TripQuery {
  from?: string;
  to?: string;
  truckId?: string;
  page?: number;
  pageSize?: number;
}

export interface TripSummary {
  count: number;
  totalDistanceKm: number;
  totalCommissionAmount: number;
  commissionPerKm: number;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
