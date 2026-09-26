import { clsx, type ClassValue } from 'clsx';
import type { Trip, Truck } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const localDate =
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00`)
      : new Date(date);

  return localDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatAmount(amount: number): string {
  return `$${amount.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-AU', {
    maximumFractionDigits: 1,
  });
}

export function formatTruckLabel(
  truck: Pick<Truck, 'registrationNumber' | 'make' | 'model'>,
): string {
  const description = [truck.make, truck.model]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ');

  return description ? `${truck.registrationNumber} - ${description}` : truck.registrationNumber;
}

export function getTripTruckLabel(trip: Pick<Trip, 'truckId' | 'truckRegistrationNumber' | 'truckLabel' | 'truck'>): string {
  const label = trip.truckLabel?.trim() || trip.truckRegistrationNumber?.trim();
  if (label) {
    return label;
  }

  if (trip.truck?.registrationNumber) {
    return formatTruckLabel(trip.truck);
  }

  return trip.truckId;
}