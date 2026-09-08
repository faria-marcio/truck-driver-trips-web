import { formatAmount, formatDate, formatNumber } from '@/lib/utils';
import type { Trip } from '@/types';

interface TripListProps {
  trips: Trip[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}

function TripListSkeleton() {
  return (
    <section aria-labelledby="trip-list-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 id="trip-list-title" className="sr-only">Trip history</h2>
      <div className="mb-4 h-6 w-36 animate-pulse rounded bg-gray-200" />
      <div className="space-y-3">
        {[1, 2].map((item) => (
          <div key={item} className="h-44 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </section>
  );
}

function TripCard({
  trip,
  onEdit,
  onDelete,
}: {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (trip: Trip) => void;
}) {
  return (
    <li>
      <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-950">{formatDate(trip.date)}</p>
            <p className="mt-1 text-sm font-medium text-blue-800">{trip.truckId}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit(trip)}
              aria-label={`Edit trip from ${formatDate(trip.date)}`}
              className="min-h-11 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(trip)}
              aria-label={`Delete trip from ${formatDate(trip.date)}`}
              className="min-h-11 rounded-md border border-red-300 px-3 text-sm font-semibold text-red-800 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-md bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Route</p>
          <p className="mt-1 break-words text-base font-semibold text-gray-950">
            {trip.pickupLocation} <span className="px-1 text-gray-500" aria-hidden="true">-&gt;</span> {trip.dropoffLocation}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-600">Distance</dt>
            <dd className="mt-1 font-semibold text-gray-950">{formatNumber(trip.distanceKm)} km</dd>
          </div>
          <div>
            <dt className="text-gray-600">Odometer</dt>
            <dd className="mt-1 font-semibold text-gray-950">
              {formatNumber(trip.startKm)} - {formatNumber(trip.endKm)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-600">Commission</dt>
            <dd className="mt-1 font-semibold text-gray-950">{formatAmount(trip.commissionAmount)}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Fuel</dt>
            <dd className="mt-1 font-semibold text-gray-950">{formatAmount(trip.fuelCostAmount)}</dd>
          </div>
        </dl>

        {(trip.bolNumber || trip.waitTimeMinutes > 0 || trip.notes) ? (
          <div className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-700">
            {trip.bolNumber ? <p><span className="font-semibold text-gray-900">BOL:</span> {trip.bolNumber}</p> : null}
            {trip.waitTimeMinutes > 0 ? (
              <p><span className="font-semibold text-gray-900">Wait:</span> {formatNumber(trip.waitTimeMinutes)} minutes</p>
            ) : null}
            {trip.notes ? <p className="mt-1 whitespace-pre-wrap break-words">{trip.notes}</p> : null}
          </div>
        ) : null}
      </article>
    </li>
  );
}

export function TripList({ trips, isLoading, onAdd, onEdit, onDelete }: TripListProps) {
  if (isLoading) {
    return <TripListSkeleton />;
  }

  if (trips.length === 0) {
    return (
      <section aria-labelledby="trip-list-title" className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm sm:p-8">
        <h2 id="trip-list-title" className="text-lg font-bold text-gray-950">No trips in this period</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Add a daily trip to start tracking distance, commission, fuel, and wait time.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 min-h-12 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          Add your first trip
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="trip-list-title" className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="trip-list-title" className="text-lg font-bold text-gray-950">Trip history</h2>
        <p className="text-sm text-gray-600">{trips.length} shown</p>
      </div>
      <ul className="space-y-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  );
}
