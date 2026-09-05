import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { DashboardClient } from '@/components/trips/DashboardClient';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <>
      <Header />
      <DashboardClient />
    </>
  );
}
