'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: '/auth/login' });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <p className="text-sm text-gray-600">Signing out...</p>
    </main>
  );
}
