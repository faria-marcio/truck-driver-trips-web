'use client';

import { useEffect, useRef, useState } from 'react';
import type { Truck, TruckInput } from '@/types';

interface TruckFormProps {
  isOpen: boolean;
  truck: Truck | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: TruckInput) => Promise<boolean>;
}

interface FormValues {
  registrationNumber: string;
  make: string;
  model: string;
}

type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

function getInitialValues(truck: Truck | null): FormValues {
  return {
    registrationNumber: truck?.registrationNumber ?? '',
    make: truck?.make ?? '',
    model: truck?.model ?? '',
  };
}

function getInputClass(hasError: boolean): string {
  return `mt-1 min-h-12 w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30 ${
    hasError ? 'border-red-600' : 'border-gray-300'
  }`;
}

export function TruckForm({
  isOpen,
  truck,
  isSubmitting,
  onCancel,
  onSubmit,
}: TruckFormProps) {
  const [values, setValues] = useState<FormValues>(() => getInitialValues(truck));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
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

  const validate = (): TruckInput | null => {
    const nextErrors: FieldErrors = {};
    const registrationNumber = values.registrationNumber.trim();
    const make = values.make.trim();
    const model = values.model.trim();

    if (!registrationNumber) {
      nextErrors.registrationNumber = 'Registration number is required.';
    } else if (registrationNumber.length > 100) {
      nextErrors.registrationNumber = 'Registration number must be 100 characters or fewer.';
    }
    if (make.length > 100) {
      nextErrors.make = 'Make must be 100 characters or fewer.';
    }
    if (model.length > 100) {
      nextErrors.model = 'Model must be 100 characters or fewer.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError('Please correct the highlighted fields.');
      return null;
    }

    return {
      registrationNumber,
      make: make || null,
      model: model || null,
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
        aria-labelledby="truck-form-title"
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Fleet</p>
            <h2 id="truck-form-title" className="mt-1 text-xl font-bold text-gray-950">
              {truck ? 'Edit truck' : 'Add truck'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close truck form"
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
            <legend className="sr-only">Truck details</legend>

            <label className="text-sm font-medium text-gray-800">
              Registration number
              <input
                ref={firstInputRef}
                type="text"
                value={values.registrationNumber}
                onChange={(event) => updateField('registrationNumber', event.target.value)}
                aria-invalid={Boolean(errors.registrationNumber)}
                aria-describedby={describedBy('registrationNumber')}
                className={getInputClass(Boolean(errors.registrationNumber))}
                maxLength={100}
                placeholder="e.g. TRK-104"
                required
              />
              {fieldError('registrationNumber')}
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-800">
                Make <span className="font-normal text-gray-500">(optional)</span>
                <input
                  type="text"
                  value={values.make}
                  onChange={(event) => updateField('make', event.target.value)}
                  aria-invalid={Boolean(errors.make)}
                  aria-describedby={describedBy('make')}
                  className={getInputClass(Boolean(errors.make))}
                  maxLength={100}
                />
                {fieldError('make')}
              </label>

              <label className="text-sm font-medium text-gray-800">
                Model <span className="font-normal text-gray-500">(optional)</span>
                <input
                  type="text"
                  value={values.model}
                  onChange={(event) => updateField('model', event.target.value)}
                  aria-invalid={Boolean(errors.model)}
                  aria-describedby={describedBy('model')}
                  className={getInputClass(Boolean(errors.model))}
                  maxLength={100}
                />
                {fieldError('model')}
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
              {isSubmitting ? 'Saving truck...' : truck ? 'Save changes' : 'Add truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
