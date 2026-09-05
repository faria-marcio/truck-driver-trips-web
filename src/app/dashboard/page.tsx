import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { DashboardClient } from '@/components/trips/DashboardClient';
import { authOptions } from '@/lib/auth';
import { listTrips } from '@/lib/trips';
import type { Trip } from '@/types';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  let initialTrips: Trip[] = [];
  let initialError: string | null = null;

  try {
    initialTrips = await listTrips(session.accessToken);
  } catch {
    initialError = 'Failed to load trips';
  }

  return (
    <>
      <Header />
      <DashboardClient initialTrips={initialTrips} initialError={initialError} />
    </>
  );
}
