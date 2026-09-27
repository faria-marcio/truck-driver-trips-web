'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  createTrip,
  deleteTrip,
  getLatestTripEndKm,
  getTripDateRange,
  getTripSummary,
  listTrips,
  updateTrip,
} from '@/lib/trips';
import { getCurrentTruckAssignment, listTrucks } from '@/lib/trucks';
import type { Trip, TripInput, TripSummary, Truck } from '@/types';
import type { TripPeriod } from '@/lib/trips';
import { formatAmount, formatNumber, getTripTruckLabel } from '@/lib/utils';
import { TripForm } from '@/components/trips/TripForm';
import { TripList } from '@/components/trips/TripList';

interface DashboardClientProps {
  initialTrips: Trip[];
  initialSummary: TripSummary | null;
  initialError: string | null;
  initialSummaryError: string | null;
}

const periodOptions: Array<{ value: TripPeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All trips' },
];

function sortTripsByDateDesc(trips: Trip[]): Trip[] {
  return [...trips].sort((first, second) => {
    const firstDate = new Date(`${first.date}T00:00:00`).getTime();
    const secondDate = new Date(`${second.date}T00:00:00`).getTime();
    if (firstDate !== secondDate) {
      return secondDate - firstDate;
    }

    return new Date(second.createdAtUtc).getTime() - new Date(first.createdAtUtc).getTime();
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
      {detail ? <p className="mt-1 text-xs text-gray-600">{detail}</p> : null}
    </div>
  );
}

export function DashboardClient({
  initialTrips,
  initialSummary,
  initialError,
  initialSummaryError,
}: DashboardClientProps) {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<Trip[]>(sortTripsByDateDesc(initialTrips));
  const [summary, setSummary] = useState<TripSummary | null>(initialSummary);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [assignedTruckId, setAssignedTruckId] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<TripPeriod>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isTrucksLoading, setIsTrucksLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [summaryError, setSummaryError] = useState<string | null>(initialSummaryError);
  const [truckError, setTruckError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [defaultStartKm, setDefaultStartKm] = useState<number | undefined>();
  const [isOpeningForm, setIsOpeningForm] = useState(false);

  const accessToken = session?.accessToken;
  const activePeriodLabel = useMemo(
    () => periodOptions.find((option) => option.value === activePeriod)?.label ?? 'All trips',
    [activePeriod],
  );

  const loadDashboard = useCallback(
    async (period: TripPeriod) => {
      if (!accessToken) {
        setError('Your session has expired. Please log in again.');
        return;
      }

      const query = getTripDateRange(period);
      setIsLoading(true);
      setIsSummaryLoading(true);
      setError(null);
      setSummaryError(null);

      const [tripsResult, summaryResult] = await Promise.allSettled([
        listTrips(accessToken, query),
        getTripSummary(accessToken, query),
      ]);

      if (tripsResult.status === 'fulfilled') {
        setTrips(sortTripsByDateDesc(tripsResult.value));
      } else {
        setError(getErrorMessage(tripsResult.reason, 'Failed to load trips.'));
      }

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        setSummaryError(getErrorMessage(summaryResult.reason, 'Failed to load trip summary.'));
      }

      setIsLoading(false);
      setIsSummaryLoading(false);
    },
    [accessToken],
  );

  const loadTrucks = useCallback(async () => {
    if (!accessToken) {
      setTruckError('Your session has expired. Please log in again.');
      return;
    }

    setIsTrucksLoading(true);
    setTruckError(null);
    setAssignmentError(null);

    const [trucksResult, assignmentResult] = await Promise.allSettled([
      listTrucks(accessToken),
      getCurrentTruckAssignment(accessToken),
    ]);

    if (trucksResult.status === 'fulfilled') {
      setTrucks(trucksResult.value);
    } else {
      setTruckError(getErrorMessage(trucksResult.reason, 'Failed to load active trucks.'));
    }

    if (assignmentResult.status === 'fulfilled') {
      setAssignedTruckId(assignmentResult.value?.id ?? null);
    } else if (trucksResult.status === 'fulfilled') {
      setAssignmentError(
        getErrorMessage(assignmentResult.reason, 'Failed to load your current truck assignment.'),
      );
      setAssignedTruckId(null);
    }

    setIsTrucksLoading(false);
  }, [accessToken]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadTrucks();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadTrucks]);

  useEffect(() => {
    if (!tripToDelete) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        setTripToDelete(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, tripToDelete]);

  const openCreateForm = async () => {
    if (!accessToken) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    setIsOpeningForm(true);
    setEditingTrip(null);
    try {
      setDefaultStartKm(await getLatestTripEndKm(accessToken));
    } catch (latestTripError: unknown) {
      setDefaultStartKm(undefined);
      setError(getErrorMessage(latestTripError, 'Failed to load the last trip.'));
    } finally {
      setIsOpeningForm(false);
      setIsFormOpen(true);
    }
  };

  const openEditForm = (trip: Trip) => {
    setEditingTrip(trip);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (!isSubmitting) {
      setIsFormOpen(false);
      setEditingTrip(null);
    }
  };

  const handlePeriodChange = (period: TripPeriod) => {
    setActivePeriod(period);
    void loadDashboard(period);
  };

  const handleSave = async (input: TripInput): Promise<boolean> => {
    if (!accessToken) {
      setError('Your session has expired. Please log in again.');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingTrip) {
        await updateTrip(accessToken, editingTrip.id, input);
      } else {
        await createTrip(accessToken, input);
        setDefaultStartKm(input.endKm);
      }

      setIsFormOpen(false);
      setEditingTrip(null);
      await loadDashboard(activePeriod);
      return true;
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, editingTrip ? 'Failed to update trip.' : 'Failed to create trip.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !tripToDelete) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteTrip(accessToken, tripToDelete.id);
      setTripToDelete(null);
      await loadDashboard(activePeriod);
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Failed to delete trip.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Daily trip tracker</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">Trips and earnings</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            Log each run from the cab with manual odometer readings. Distance is calculated when you save.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void openCreateForm()}
          disabled={isOpeningForm}
          className="min-h-12 w-full rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 sm:w-auto"
        >
          {isOpeningForm ? 'Loading last trip...' : 'Add trip'}
        </button>
      </header>

      <section aria-label="Trip period filters" className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Trip period" className="grid grid-cols-2 gap-2 sm:flex">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={activePeriod === option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`min-h-11 rounded-md border px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  activePeriod === option.value
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              void loadDashboard(activePeriod);
              void loadTrucks();
            }}
            disabled={isLoading || isSummaryLoading || isTrucksLoading}
            className="min-h-11 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading || isSummaryLoading || isTrucksLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-600">Showing: {activePeriodLabel}</p>
      </section>

      {error ? (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              void loadDashboard(activePeriod);
              void loadTrucks();
            }}
            className="min-h-11 shrink-0 rounded-md border border-red-400 px-3 font-semibold text-red-900 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            Try again
          </button>
        </div>
      ) : null}

      {summaryError ? (
        <div role="alert" className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Summary unavailable: {summaryError}
        </div>
      ) : null}

      {assignmentError ? (
        <div role="alert" className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          Current truck assignment unavailable: {assignmentError}
        </div>
      ) : null}

      <section aria-label={`${activePeriodLabel} summary`} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isSummaryLoading ? (
          <>
            <SummaryCard label="Trips" value="..." />
            <SummaryCard label="Distance" value="..." />
            <SummaryCard label="Commission" value="..." />
            <SummaryCard label="Commission / km" value="..." />
          </>
        ) : (
          <>
            <SummaryCard label="Trips" value={summary ? formatNumber(summary.count) : '0'} detail={activePeriodLabel} />
            <SummaryCard label="Distance" value={summary ? `${formatNumber(summary.totalDistanceKm)} km` : '0 km'} />
            <SummaryCard label="Commission" value={summary ? formatAmount(summary.totalCommissionAmount) : formatAmount(0)} />
            <SummaryCard
              label="Commission / km"
              value={summary ? formatAmount(summary.commissionPerKm) : formatAmount(0)}
              detail="weighted average"
            />
          </>
        )}
      </section>

      <TripList
        trips={trips}
        trucks={trucks}
        isLoading={isLoading}
        onAdd={openCreateForm}
        onEdit={openEditForm}
        onDelete={setTripToDelete}
      />

      <TripForm
        key={isFormOpen ? editingTrip?.id ?? 'new-trip' : 'closed-trip-form'}
        isOpen={isFormOpen}
        trip={editingTrip}
        trucks={trucks}
        assignedTruckId={assignedTruckId}
        trucksLoading={isTrucksLoading}
        truckError={truckError}
        isSubmitting={isSubmitting}
        defaultStartKm={defaultStartKm}
        accessToken={accessToken}
        onCancel={closeForm}
        onSubmit={handleSave}
      />

      {tripToDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-trip-title"
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Delete trip</p>
            <h2 id="delete-trip-title" className="mt-1 text-xl font-bold text-gray-950">Remove this trip?</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              This will permanently delete the {getTripTruckLabel(tripToDelete)} trip from{' '}
              {tripToDelete.pickupLocation} to {tripToDelete.dropoffLocation}.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                disabled={isDeleting}
                className="min-h-12 rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="min-h-12 rounded-md bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isDeleting ? 'Deleting...' : 'Delete trip'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
