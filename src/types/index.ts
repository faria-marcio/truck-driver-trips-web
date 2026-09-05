export interface User {
  id: string;
  email: string;
  name: string;
  role: 'driver' | 'admin';
}

export interface Trip {
  id: string;
  driverId: string;
  date: string;
  startTime: string;
  endTime: string;
  distance: number;
  pickupLocation: string;
  dropoffLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  date: string;
  startTime: string;
  endTime: string;
  distance: number;
  pickupLocation: string;
  dropoffLocation: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}