import Link from 'next/link';

interface AuthErrorPageProps {
  searchParams?:
    | {
        error?: string | string[];
      }
    | Promise<{
    error?: string | string[];
      }>;
}

const errorMessages: Record<string, string> = {
  CredentialsSignin: 'Invalid credentials. Please try again.',
  AccessDenied: 'Access denied.',
  Configuration: 'Authentication configuration error.',
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const rawError = resolvedSearchParams?.error;
  const errorCode = Array.isArray(rawError) ? rawError[0] : rawError;
  const message = errorCode ? errorMessages[errorCode] ?? 'Authentication error.' : 'Authentication error.';

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-red-700">Sign-in failed</h1>
        <p className="mb-4 text-sm text-gray-700">{message}</p>
        <Link href="/auth/login" className="text-sm font-semibold text-blue-600 hover:underline">
          Back to login
        </Link>
      </section>
    </main>
  );
}
