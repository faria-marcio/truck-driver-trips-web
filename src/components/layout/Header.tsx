'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/auth/logout');
  };

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-lg font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-xl">
          Truck Driver Trips
        </Link>

        {session ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">{session.user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-11 rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
