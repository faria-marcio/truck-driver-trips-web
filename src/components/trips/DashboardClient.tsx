'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { createTrip, listTrips } from '@/lib/trips';
import type { CreateTripInput, Trip } from '@/types';
import { TripForm } from '@/components/trips/TripForm';
import { TripList } from '@/components/trips/TripList';

export function DashboardClient() {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = session?.accessToken;

  const loadTrips = useCallback(async () => {
    if (!accessToken) {
      setError('Session expired. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const loadedTrips = await listTrips(accessToken);
      setTrips(loadedTrips);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load trips';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const handleCreateTrip = async (input: CreateTripInput) => {
    if (!accessToken) {
      setError('Session expired. Please log in again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const newTrip = await createTrip(accessToken, input);
      setTrips((current) => [newTrip, ...current]);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to create trip';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      <TripForm isSubmitting={isSubmitting} onSubmit={handleCreateTrip} />
      <TripList trips={trips} isLoading={isLoading} error={error} />
    </main>
  );
}
