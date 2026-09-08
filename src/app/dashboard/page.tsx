import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { DashboardClient } from '@/components/trips/DashboardClient';
import { authOptions } from '@/lib/auth';
import { getTripSummary, listTrips } from '@/lib/trips';
import type { Trip, TripSummary } from '@/types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  const [tripsResult, summaryResult] = await Promise.allSettled([
    listTrips(session.accessToken),
    getTripSummary(session.accessToken),
  ]);
  const initialTrips: Trip[] = tripsResult.status === 'fulfilled' ? tripsResult.value : [];
  const initialSummary: TripSummary | null =
    summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const initialError =
    tripsResult.status === 'rejected'
      ? getErrorMessage(tripsResult.reason, 'Failed to load trips.')
      : null;
  const initialSummaryError =
    summaryResult.status === 'rejected'
      ? getErrorMessage(summaryResult.reason, 'Failed to load trip summary.')
      : null;

  return (
    <>
      <Header />
      <DashboardClient
        initialTrips={initialTrips}
        initialSummary={initialSummary}
        initialError={initialError}
        initialSummaryError={initialSummaryError}
      />
    </>
  );
}
