'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { createTrip, listTrips } from '@/lib/trips';
import type { CreateTripInput, Trip } from '@/types';
import { TripForm } from '@/components/trips/TripForm';
import { TripList } from '@/components/trips/TripList';

function sortTripsByDateDesc(trips: Trip[]): Trip[] {
  return [...trips].sort((first, second) => {
    const firstDateTime = new Date(`${first.date}T${first.startTime}`).getTime();
    const secondDateTime = new Date(`${second.date}T${second.startTime}`).getTime();
    return secondDateTime - firstDateTime;
  });
}

interface DashboardClientProps {
  initialTrips: Trip[];
  initialError: string | null;
}

export function DashboardClient({ initialTrips, initialError }: DashboardClientProps) {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<Trip[]>(sortTripsByDateDesc(initialTrips));
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

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
      setTrips(sortTripsByDateDesc(loadedTrips));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load trips';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const handleCreateTrip = async (input: CreateTripInput): Promise<boolean> => {
    if (!accessToken) {
      setError('Session expired. Please log in again.');
      return false;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createTrip(accessToken, input);
      await loadTrips();
      return true;
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to create trip';
      setError(message);
      return false;
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
