'use client';

import { useEffect, useState } from 'react';
import { searchBrazilianCities, type CitySuggestion } from '@/lib/locations';

interface CityAutocompleteProps {
  id: string;
  label: string;
  value: string;
  accessToken?: string;
  error?: string;
  onChange: (value: string) => void;
  onSelect: (city: CitySuggestion | null) => void;
}

export function CityAutocomplete({
  id,
  label,
  value,
  accessToken,
  error,
  onChange,
  onSelect,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = `${id}-suggestions`;

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2 || !accessToken) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setSearchError(null);

      void searchBrazilianCities(accessToken, query, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) {
            setSuggestions(results);
            setActiveIndex(-1);
          }
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setSearchError(requestError instanceof Error ? requestError.message : 'Failed to search cities');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [accessToken, value]);

  const selectCity = (city: CitySuggestion) => {
    onChange(city.name);
    onSelect(city);
    setSuggestions([]);
    setActiveIndex(-1);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectCity(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="text-sm font-medium text-gray-800">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          onSelect(null);
          setSuggestions([]);
          setSearchError(null);
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={handleKeyDown}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        role="combobox"
        autoComplete="off"
        required
        className={`mt-1 min-h-12 w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30 ${
          error ? 'border-red-600' : 'border-gray-300'
        }`}
        placeholder="Search Brazilian cities"
      />
      {isOpen && value.trim().length >= 2 ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {isLoading ? <p className="px-3 py-2 text-sm text-gray-600">Searching cities...</p> : null}
          {!isLoading && searchError ? <p className="px-3 py-2 text-sm text-red-700">{searchError}</p> : null}
          {!isLoading && !searchError && suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-600">No Brazilian cities found.</p>
          ) : null}
          {suggestions.map((city, index) => (
            <button
              key={`${city.name}-${city.latitude}-${city.longitude}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectCity(city)}
              className={`block w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-blue-50 ${
                index === activeIndex ? 'bg-blue-50' : ''
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
