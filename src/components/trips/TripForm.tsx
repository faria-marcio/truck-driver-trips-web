'use client';

import { useMemo, useState } from 'react';
import type { CreateTripInput } from '@/types';

interface TripFormProps {
  isSubmitting: boolean;
  onSubmit: (input: CreateTripInput) => Promise<void>;
}

interface FormValues {
  date: string;
  startTime: string;
  endTime: string;
  distance: string;
  pickupLocation: string;
  dropoffLocation: string;
}

const initialValues: FormValues = {
  date: '',
  startTime: '',
  endTime: '',
  distance: '',
  pickupLocation: '',
  dropoffLocation: '',
};

export function TripForm({ isSubmitting, onSubmit }: TripFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);

  const maxDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const updateField = (name: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const validate = (): CreateTripInput | null => {
    if (!values.date || !values.startTime || !values.endTime || !values.distance.trim()) {
      setError('Date, start time, end time, and distance are required.');
      return null;
    }

    if (!values.pickupLocation.trim() || !values.dropoffLocation.trim()) {
      setError('Pickup and dropoff locations are required.');
      return null;
    }

    if (values.endTime <= values.startTime) {
      setError('End time must be later than start time.');
      return null;
    }

    const distance = Number(values.distance);
    if (!Number.isFinite(distance) || distance <= 0) {
      setError('Distance must be a number greater than zero.');
      return null;
    }

    return {
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      distance,
      pickupLocation: values.pickupLocation.trim(),
      dropoffLocation: values.dropoffLocation.trim(),
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload = validate();
    if (!payload) {
      return;
    }

    await onSubmit(payload);
    setValues(initialValues);
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Log a trip</h2>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm text-gray-700">
            Date
            <input
              type="date"
              max={maxDate}
              value={values.date}
              onChange={(event) => updateField('date', event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </label>

          <label className="text-sm text-gray-700">
            Distance (km)
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={values.distance}
              onChange={(event) => updateField('distance', event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </label>

          <label className="text-sm text-gray-700">
            Start time
            <input
              type="time"
              value={values.startTime}
              onChange={(event) => updateField('startTime', event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </label>

          <label className="text-sm text-gray-700">
            End time
            <input
              type="time"
              value={values.endTime}
              onChange={(event) => updateField('endTime', event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </label>
        </div>

        <label className="block text-sm text-gray-700">
          Pickup location
          <input
            type="text"
            value={values.pickupLocation}
            onChange={(event) => updateField('pickupLocation', event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm text-gray-700">
          Dropoff location
          <input
            type="text"
            value={values.dropoffLocation}
            onChange={(event) => updateField('dropoffLocation', event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : 'Save trip'}
        </button>
      </form>
    </section>
  );
}
