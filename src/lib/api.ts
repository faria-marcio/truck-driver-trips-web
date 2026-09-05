import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getAuthHeaders(accessToken?: string): Record<string, string> {
  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `bearer ${accessToken}`,
  };
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return (
      axiosError.response?.data?.message ??
      axiosError.response?.data?.error ??
      fallback
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = axios.isAxiosError(error) ? error.config?.url ?? '' : '';
    const isAuthEndpoint = requestUrl.includes('/api/auth/');

    if (
      typeof window !== 'undefined' &&
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !isAuthEndpoint
    ) {
      window.location.assign('/auth/login');
    }

    return Promise.reject(error);
  }
);
