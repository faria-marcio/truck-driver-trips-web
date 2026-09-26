'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  assignTruckToDriver,
  clearTruckAssignment,
  createTruck,
  listTrucks,
  retireTruck,
  updateTruck,
} from '@/lib/trucks';
import { formatDate, formatTruckLabel } from '@/lib/utils';
import type { Truck, TruckInput } from '@/types';
import { TruckForm } from '@/components/trucks/TruckForm';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function TruckListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading trucks">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-32 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

export function TruckManagementClient() {
  const { data: session } = useSession();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [showRetired, setShowRetired] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [truckToRetire, setTruckToRetire] = useState<Truck | null>(null);
  const [driverId, setDriverId] = useState('');
  const [assignmentTruckId, setAssignmentTruckId] = useState('');

  const accessToken = session?.accessToken;
  const isAdmin = session?.user?.role === 'admin';

  const loadTrucks = useCallback(async () => {
    if (!accessToken) {
      setError('Your session has expired. Please log in again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setTrucks(await listTrucks(accessToken, { includeRetired: true }));
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError, 'Failed to load trucks.'));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadTrucks();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadTrucks]);

  useEffect(() => {
    if (!truckToRetire) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isRetiring) {
        setTruckToRetire(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRetiring, truckToRetire]);

  const visibleTrucks = useMemo(
    () => trucks.filter((truck) => showRetired || truck.isActive),
    [showRetired, trucks],
  );
  const activeTrucks = useMemo(() => trucks.filter((truck) => truck.isActive), [trucks]);

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-red-300 bg-red-50 p-6" role="alert">
          <h1 className="text-xl font-bold text-red-950">Admin access required</h1>
          <p className="mt-2 text-sm text-red-800">
            Only administrators can manage trucks and driver assignments.
          </p>
        </section>
      </main>
    );
  }

  const openCreateForm = () => {
    setEditingTruck(null);
    setIsFormOpen(true);
  };

  const openEditForm = (truck: Truck) => {
    setEditingTruck(truck);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (!isSubmitting) {
      setIsFormOpen(false);
      setEditingTruck(null);
    }
  };

  const handleSave = async (input: TruckInput): Promise<boolean> => {
    if (!accessToken) {
      setError('Your session has expired. Please log in again.');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingTruck) {
        await updateTruck(accessToken, editingTruck.id, input);
      } else {
        await createTruck(accessToken, input);
      }

      setIsFormOpen(false);
      setEditingTruck(null);
      await loadTrucks();
      return true;
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, editingTruck ? 'Failed to update truck.' : 'Failed to create truck.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetire = async () => {
    if (!accessToken || !truckToRetire) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    setIsRetiring(true);
    setError(null);

    try {
      await retireTruck(accessToken, truckToRetire.id);
      setTruckToRetire(null);
      await loadTrucks();
    } catch (retireError: unknown) {
      setError(getErrorMessage(retireError, 'Failed to retire truck.'));
    } finally {
      setIsRetiring(false);
    }
  };

  const handleAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignmentError(null);
    setAssignmentMessage(null);

    const trimmedDriverId = driverId.trim();
    if (!trimmedDriverId) {
      setAssignmentError('Driver ID is required.');
      return;
    }
    if (!accessToken) {
      setAssignmentError('Your session has expired. Please log in again.');
      return;
    }

    setIsAssigning(true);
    try {
      if (assignmentTruckId) {
        await assignTruckToDriver(accessToken, trimmedDriverId, assignmentTruckId);
        setAssignmentMessage('Truck assignment updated.');
      } else {
        await clearTruckAssignment(accessToken, trimmedDriverId);
        setAssignmentMessage('Truck assignment cleared.');
      }
      await loadTrucks();
    } catch (assignmentSubmitError: unknown) {
      setAssignmentError(
        getErrorMessage(assignmentSubmitError, 'Failed to update truck assignment.'),
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Admin tools</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">Truck management</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            Add, update, retire, and assign trucks. Retired trucks stay in historical trip records.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="min-h-12 w-full rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 sm:w-auto"
        >
          Add truck
        </button>
      </header>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadTrucks()}
            className="min-h-11 shrink-0 rounded-md border border-red-400 px-3 font-semibold text-red-900 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            Try again
          </button>
        </div>
      ) : null}

      <section aria-labelledby="assignment-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Current assignment</p>
          <h2 id="assignment-title" className="mt-1 text-xl font-bold text-gray-950">
            Assign a truck to a driver
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the driver account ID. Saving with no truck clears the current assignment.
          </p>
        </div>

        <form onSubmit={handleAssignment} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-medium text-gray-800">
            Driver ID
            <input
              id="driver-id"
              type="text"
              value={driverId}
              onChange={(event) => {
                setDriverId(event.target.value);
                setAssignmentError(null);
              }}
              className="mt-1 min-h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
              placeholder="Driver account ID"
              required
            />
          </label>

          <label className="text-sm font-medium text-gray-800">
            Truck
            <select
              id="assignment-truck"
              value={assignmentTruckId}
              onChange={(event) => {
                setAssignmentTruckId(event.target.value);
                setAssignmentError(null);
              }}
              disabled={isAssigning || isLoading}
              className="mt-1 min-h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">No truck assigned</option>
              {activeTrucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {formatTruckLabel(truck)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={isAssigning || isLoading}
            className="min-h-12 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isAssigning ? 'Saving...' : 'Save assignment'}
          </button>
        </form>

        {assignmentError ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {assignmentError}
          </p>
        ) : null}
        {assignmentMessage ? (
          <p role="status" className="mt-3 text-sm text-green-800">
            {assignmentMessage}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="truck-list-title" className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="truck-list-title" className="text-xl font-bold text-gray-950">Fleet</h2>
            <p className="mt-1 text-sm text-gray-600">
              {trucks.length} total {trucks.length === 1 ? 'truck' : 'trucks'}
            </p>
          </div>
          <button
            type="button"
            aria-pressed={showRetired}
            onClick={() => setShowRetired((current) => !current)}
            className={`min-h-11 rounded-md border px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              showRetired
                ? 'border-blue-700 bg-blue-700 text-white'
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            {showRetired ? 'Showing retired' : 'Show retired'}
          </button>
        </div>

        {isLoading ? (
          <TruckListSkeleton />
        ) : visibleTrucks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
            <h3 className="text-lg font-bold text-gray-950">
              {showRetired ? 'No trucks found' : 'No active trucks'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {showRetired
                ? 'Add a truck to start managing the fleet.'
                : 'Add a truck or show retired trucks to review the full fleet.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleTrucks.map((truck) => (
              <li key={truck.id}>
                <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-950">
                          {formatTruckLabel(truck)}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            truck.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {truck.isActive ? 'Active' : 'Retired'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {truck.assignedDriverName
                          ? `Assigned to ${truck.assignedDriverName}`
                          : truck.assignedDriverId
                            ? `Assigned to driver ${truck.assignedDriverId}`
                            : 'Not assigned'}
                      </p>
                      {!truck.isActive && truck.retiredAtUtc ? (
                        <p className="mt-1 text-xs text-gray-500">
                          Retired {formatDate(truck.retiredAtUtc)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(truck)}
                        className="min-h-11 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        Edit
                      </button>
                      {truck.isActive ? (
                        <button
                          type="button"
                          onClick={() => setTruckToRetire(truck)}
                          className="min-h-11 rounded-md border border-red-300 px-3 text-sm font-semibold text-red-800 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600"
                        >
                          Retire
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TruckForm
        key={isFormOpen ? editingTruck?.id ?? 'new-truck' : 'closed-truck-form'}
        isOpen={isFormOpen}
        truck={editingTruck}
        isSubmitting={isSubmitting}
        onCancel={closeForm}
        onSubmit={handleSave}
      />

      {truckToRetire ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="retire-truck-title"
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Retire truck</p>
            <h2 id="retire-truck-title" className="mt-1 text-xl font-bold text-gray-950">
              Retire {formatTruckLabel(truckToRetire)}?
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              New trips can no longer use this truck. Existing trips keep their recorded truck identity.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTruckToRetire(null)}
                disabled={isRetiring}
                className="min-h-12 rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRetire()}
                disabled={isRetiring}
                className="min-h-12 rounded-md bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isRetiring ? 'Retiring...' : 'Retire truck'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
