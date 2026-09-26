export type UserRole = 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Truck {
  id: string;
  registrationNumber: string;
  make: string | null;
  model: string | null;
  isActive: boolean;
  retiredAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
}

export interface TruckInput {
  registrationNumber: string;
  make: string | null;
  model: string | null;
  isActive?: boolean;
}

export type TruckAssignment = Truck | null;

export interface Trip {
  id: string;
  driverId: string;
  date: string;
  truckId: string;
  truckRegistrationNumber?: string | null;
  truckLabel?: string | null;
  truck?: Pick<Truck, 'id' | 'registrationNumber' | 'make' | 'model' | 'isActive'> | null;
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
  user: Omit<User, 'role'> & {
    role: UserRole | 'Driver' | 'Admin';
  };
}
