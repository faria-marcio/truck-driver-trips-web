import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { TruckManagementClient } from '@/components/trucks/TruckManagementClient';
import { Header } from '@/components/layout/Header';
import { authOptions } from '@/lib/auth';

export default async function TruckManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <>
      <Header />
      <TruckManagementClient />
    </>
  );
}
