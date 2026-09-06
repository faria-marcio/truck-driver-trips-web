import { formatDate } from '@/lib/utils';
import type { Trip } from '@/types';

interface TripListProps {
  trips: Trip[];
  isLoading: boolean;
  error: string | null;
}

export function TripList({ trips, isLoading, error }: TripListProps) {
  if (isLoading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent trips</h2>
        <p className="text-sm text-gray-600">Loading trips...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Recent trips</h2>
        <p className="text-sm text-red-700">{error}</p>
      </section>
    );
  }

  if (trips.length === 0) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Recent trips</h2>
        <p className="text-sm text-gray-600">No trips found yet. Create your first trip above.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent trips</h2>
      <ul className="space-y-3">
        {trips.map((trip) => (
          <li key={trip.id} className="rounded-md border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-900">{formatDate(trip.date)}</p>
            <p className="mt-1 text-sm text-gray-700">
              {trip.startTime} - {trip.endTime} • {trip.distanceKm} km
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {trip.pickupLocation} → {trip.dropoffLocation}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
