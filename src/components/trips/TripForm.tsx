'use client';

import { useEffect, useRef, useState } from 'react';
import type { Trip, TripInput } from '@/types';
import { CityAutocomplete } from '@/components/trips/CityAutocomplete';
import { getRouteDistance, type CitySuggestion, type RouteDistance } from '@/lib/locations';

interface TripFormProps {
  isOpen: boolean;
  trip: Trip | null;
  isSubmitting: boolean;
  defaultStartKm?: number;
  accessToken?: string;
  onCancel: () => void;
  onSubmit: (input: TripInput) => Promise<boolean>;
}

interface FormValues {
  date: string;
  truckId: string;
  startKm: string;
  endKm: string;
  pickupLocation: string;
  dropoffLocation: string;
  commissionAmount: string;
  bolNumber: string;
  fuelCostAmount: string;
  waitTimeMinutes: string;
  notes: string;
}

type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

function getTodayInput(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getInitialValues(trip: Trip | null, defaultStartKm?: number): FormValues {
  if (!trip) {
    return {
      date: getTodayInput(),
      truckId: '',
      startKm: defaultStartKm === undefined ? '' : formatOdometerValue(defaultStartKm),
      endKm: '',
      pickupLocation: '',
      dropoffLocation: '',
      commissionAmount: '',
      bolNumber: '',
      fuelCostAmount: '',
      waitTimeMinutes: '',
      notes: '',
    };
  }

  return {
    date: trip.date,
    truckId: trip.truckId,
    startKm: formatOdometerValue(trip.startKm),
    endKm: formatOdometerValue(trip.endKm),
    pickupLocation: trip.pickupLocation,
    dropoffLocation: trip.dropoffLocation,
    commissionAmount: String(trip.commissionAmount),
    bolNumber: trip.bolNumber ?? '',
    fuelCostAmount: String(trip.fuelCostAmount),
    waitTimeMinutes: String(trip.waitTimeMinutes),
    notes: trip.notes ?? '',
  };
}

function getInputClass(hasError: boolean): string {
  return `mt-1 min-h-12 w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30 ${
    hasError ? 'border-red-600' : 'border-gray-300'
  }`;
}

function getNumberValue(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatOdometerValue(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 3,
  }).format(value);
}

function formatOdometerInput(value: string): string {
  const normalized = value.replace(/[^\d,]/g, '');
  if (!normalized) {
    return '';
  }

  const [integerPart, decimalPart] = normalized.split(',');
  const groupedInteger = (integerPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return decimalPart === undefined ? groupedInteger : `${groupedInteger},${decimalPart.slice(0, 3)}`;
}

function getOdometerValue(value: string): number | null {
  return getNumberValue(value.replace(/\./g, '').replace(',', '.'));
}

export function TripForm({
  isOpen,
  trip,
  isSubmitting,
  defaultStartKm,
  accessToken,
  onCancel,
  onSubmit,
}: TripFormProps) {
  const [values, setValues] = useState<FormValues>(() => getInitialValues(trip, defaultStartKm));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pickupCity, setPickupCity] = useState<CitySuggestion | null>(null);
  const [dropoffCity, setDropoffCity] = useState<CitySuggestion | null>(null);
  const [routeDistance, setRouteDistance] = useState<RouteDistance | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => firstInputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  useEffect(() => {
    if (!pickupCity || !dropoffCity || !accessToken) {
      return;
    }

    const controller = new AbortController();

    void getRouteDistance(accessToken, pickupCity, dropoffCity, controller.signal)
      .then((distance) => {
        if (!controller.signal.aborted) {
          setRouteDistance(distance);
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setRouteDistance(null);
          setRouteError(
            requestError instanceof Error ? requestError.message : 'Failed to calculate route distance',
          );
        }
      })
    return () => controller.abort();
  }, [accessToken, dropoffCity, pickupCity]);

  const handlePickupCitySelection = (city: CitySuggestion | null) => {
    setPickupCity(city);
    setRouteDistance(null);
    setRouteError(null);
  };

  const handleDropoffCitySelection = (city: CitySuggestion | null) => {
    setDropoffCity(city);
    setRouteDistance(null);
    setRouteError(null);
  };

  if (!isOpen) {
    return null;
  }

  const updateField = (name: FieldName, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
    setFormError(null);
  };

  const updateOdometerField = (name: 'startKm' | 'endKm', value: string) => {
    updateField(name, formatOdometerInput(value));
  };

  const validate = (): TripInput | null => {
    const nextErrors: FieldErrors = {};
    const dateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(values.date) && !Number.isNaN(new Date(`${values.date}T00:00:00`).getTime());

    if (!dateIsValid) {
      nextErrors.date = 'Enter a valid date.';
    }

    if (!values.truckId.trim()) {
      nextErrors.truckId = 'Truck ID is required.';
    }

    const startKm = getOdometerValue(values.startKm);
    const endKm = getOdometerValue(values.endKm);
    if (startKm === null || startKm < 0) {
      nextErrors.startKm = 'Enter an odometer value of zero or more.';
    }
    if (endKm === null || endKm < 0) {
      nextErrors.endKm = 'Enter an odometer value of zero or more.';
    } else if (startKm !== null && endKm <= startKm) {
      nextErrors.endKm = 'End odometer must be greater than start odometer.';
    }

    if (!values.pickupLocation.trim()) {
      nextErrors.pickupLocation = 'Pickup location is required.';
    }
    if (!values.dropoffLocation.trim()) {
      nextErrors.dropoffLocation = 'Dropoff location is required.';
    }

    const commissionAmount = getNumberValue(values.commissionAmount);
    if (commissionAmount === null || commissionAmount < 0) {
      nextErrors.commissionAmount = 'Enter a commission amount of zero or more.';
    }

    const fuelCostAmount = values.fuelCostAmount.trim() ? getNumberValue(values.fuelCostAmount) : 0;
    if (fuelCostAmount === null || fuelCostAmount < 0) {
      nextErrors.fuelCostAmount = 'Enter a fuel cost of zero or more.';
    }

    const waitTimeMinutes = values.waitTimeMinutes.trim() ? getNumberValue(values.waitTimeMinutes) : 0;
    if (
      waitTimeMinutes === null ||
      waitTimeMinutes < 0 ||
      !Number.isInteger(waitTimeMinutes)
    ) {
      nextErrors.waitTimeMinutes = 'Enter whole minutes of zero or more.';
    }

    if (values.bolNumber.length > 100) {
      nextErrors.bolNumber = 'BOL number must be 100 characters or fewer.';
    }
    if (values.notes.length > 2000) {
      nextErrors.notes = 'Notes must be 2,000 characters or fewer.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError('Please correct the highlighted fields.');
      return null;
    }

    if (
      startKm === null ||
      endKm === null ||
      commissionAmount === null ||
      fuelCostAmount === null ||
      waitTimeMinutes === null
    ) {
      setFormError('Enter valid numeric values before saving.');
      return null;
    }

    return {
      date: values.date,
      truckId: values.truckId.trim(),
      startKm,
      endKm,
      pickupLocation: values.pickupLocation.trim(),
      dropoffLocation: values.dropoffLocation.trim(),
      commissionAmount,
      bolNumber: values.bolNumber.trim(),
      fuelCostAmount,
      waitTimeMinutes,
      notes: values.notes.trim(),
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const payload = validate();
    if (!payload) {
      return;
    }

    const success = await onSubmit(payload);
    if (success) {
      setErrors({});
      setFormError(null);
    }
  };

  const fieldError = (name: FieldName) => {
    const error = errors[name];
    return error ? (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
        {error}
      </p>
    ) : null;
  };

  const describedBy = (name: FieldName) => (errors[name] ? `${name}-error` : undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-form-title"
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Daily trip</p>
            <h2 id="trip-form-title" className="mt-1 text-xl font-bold text-gray-950">
              {trip ? 'Edit trip' : 'Add trip'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close trip form"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-gray-300 text-2xl leading-none text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-4 py-5 sm:px-6">
          {formError ? (
            <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-800">
              {formError}
            </div>
          ) : null}

          <fieldset disabled={isSubmitting} className="space-y-5">
            <legend className="sr-only">Trip details</legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-800">
                Date
                <input
                  ref={firstInputRef}
                  type="date"
                  value={values.date}
                  onChange={(event) => updateField('date', event.target.value)}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={describedBy('date')}
                  className={getInputClass(Boolean(errors.date))}
                  required
                />
                {fieldError('date')}
              </label>

              <label className="text-sm font-medium text-gray-800">
                Truck ID
                <input
                  type="text"
                  value={values.truckId}
                  onChange={(event) => updateField('truckId', event.target.value)}
                  aria-invalid={Boolean(errors.truckId)}
                  aria-describedby={describedBy('truckId')}
                  className={getInputClass(Boolean(errors.truckId))}
                  placeholder="e.g. TRK-104"
                  required
                />
                {fieldError('truckId')}
              </label>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-950">Odometer</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-800">
                  Start km
                  <input
                    type="text"
                    inputMode="decimal"
                    tabIndex={-1}
                    value={values.startKm}
                    onChange={(event) => updateOdometerField('startKm', event.target.value)}
                    aria-invalid={Boolean(errors.startKm)}
                    aria-describedby={describedBy('startKm')}
                    className={getInputClass(Boolean(errors.startKm))}
                    required
                  />
                  {fieldError('startKm')}
                </label>

                <label className="text-sm font-medium text-gray-800">
                  End km
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values.endKm}
                    onChange={(event) => updateOdometerField('endKm', event.target.value)}
                    aria-invalid={Boolean(errors.endKm)}
                    aria-describedby={describedBy('endKm')}
                    className={getInputClass(Boolean(errors.endKm))}
                    required
                  />
                  {fieldError('endKm')}
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-600">Distance is calculated from the two odometer readings.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CityAutocomplete
                id="pickup-location"
                label="Pickup location"
                value={values.pickupLocation}
                accessToken={accessToken}
                error={errors.pickupLocation}
                onChange={(value) => updateField('pickupLocation', value)}
                onSelect={handlePickupCitySelection}
              />
              <CityAutocomplete
                id="dropoff-location"
                label="Dropoff location"
                value={values.dropoffLocation}
                accessToken={accessToken}
                error={errors.dropoffLocation}
                onChange={(value) => updateField('dropoffLocation', value)}
                onSelect={handleDropoffCitySelection}
              />
            </div>
            {routeDistance ? (
              <p className="text-sm text-blue-800">
                Estimated road distance: {routeDistance.distanceKm.toLocaleString('pt-BR')} km
              </p>
            ) : null}
            {routeError ? <p className="text-sm text-amber-800">{routeError}</p> : null}

            <div>
              <h3 className="text-sm font-semibold text-gray-950">Money and time</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-800">
                  Commission ($)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={values.commissionAmount}
                    onChange={(event) => updateField('commissionAmount', event.target.value)}
                    aria-invalid={Boolean(errors.commissionAmount)}
                    aria-describedby={describedBy('commissionAmount')}
                    className={getInputClass(Boolean(errors.commissionAmount))}
                    required
                  />
                  {fieldError('commissionAmount')}
                </label>

                <label className="text-sm font-medium text-gray-800">
                  Fuel cost ($)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={values.fuelCostAmount}
                    onChange={(event) => updateField('fuelCostAmount', event.target.value)}
                    aria-invalid={Boolean(errors.fuelCostAmount)}
                    aria-describedby={describedBy('fuelCostAmount')}
                    className={getInputClass(Boolean(errors.fuelCostAmount))}
                    placeholder="0"
                  />
                  {fieldError('fuelCostAmount')}
                </label>

                <label className="text-sm font-medium text-gray-800">
                  Wait time (minutes)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={values.waitTimeMinutes}
                    onChange={(event) => updateField('waitTimeMinutes', event.target.value)}
                    aria-invalid={Boolean(errors.waitTimeMinutes)}
                    aria-describedby={describedBy('waitTimeMinutes')}
                    className={getInputClass(Boolean(errors.waitTimeMinutes))}
                    placeholder="0"
                  />
                  {fieldError('waitTimeMinutes')}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-800">
                BOL number <span className="font-normal text-gray-500">(optional)</span>
                <input
                  type="text"
                  value={values.bolNumber}
                  onChange={(event) => updateField('bolNumber', event.target.value)}
                  aria-invalid={Boolean(errors.bolNumber)}
                  aria-describedby={describedBy('bolNumber')}
                  className={getInputClass(Boolean(errors.bolNumber))}
                  maxLength={100}
                />
                {fieldError('bolNumber')}
              </label>

              <label className="text-sm font-medium text-gray-800">
                Notes <span className="font-normal text-gray-500">(optional)</span>
                <textarea
                  value={values.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={describedBy('notes')}
                  className={`${getInputClass(Boolean(errors.notes))} min-h-12`}
                  rows={2}
                  maxLength={2000}
                />
                {fieldError('notes')}
              </label>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="min-h-12 rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? 'Saving trip...' : trip ? 'Save changes' : 'Save trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
