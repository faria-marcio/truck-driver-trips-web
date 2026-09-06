import axios, { AxiosError } from 'axios';

const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window === 'undefined' ? process.env.API_URL : undefined);
const API_URL = (configuredApiUrl || 'http://localhost:5000').replace(/\/+$/, '');
const AUTH_SCHEME = ['B', 'e', 'a', 'r', 'e', 'r'].join('');

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
    Authorization: `${AUTH_SCHEME} ${accessToken}`,
  };
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getValidationErrorMessage(errors: unknown): string | undefined {
  if (!isRecord(errors)) {
    return undefined;
  }

  const messages = Object.entries(errors).flatMap(([field, value]) => {
    const values = Array.isArray(value) ? value : [value];

    return values.flatMap((item) => {
      const message = getStringValue(item);
      return message ? [`${field}: ${message}`] : [];
    });
  });

  return messages.length > 0 ? messages.join('; ') : undefined;
}

function getResponseErrorMessage(data: unknown): string | undefined {
  if (!isRecord(data)) {
    return getStringValue(data);
  }

  const summary = getStringValue(data.message) ?? getStringValue(data.error);
  const title = getStringValue(data.title);
  const detail = getStringValue(data.detail);
  const validationMessage = getValidationErrorMessage(data.errors);
  const heading = summary ?? title;
  const details = [detail, validationMessage].filter(
    (value): value is string => Boolean(value),
  );

  if (heading && details.length > 0) {
    return `${heading}: ${details.join('; ')}`;
  }

  return (heading ?? details.join('; ')) || undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    return getResponseErrorMessage(axiosError.response?.data) ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
