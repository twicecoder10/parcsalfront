'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Register the locale
countries.registerLocale(enLocale);

interface CitySelectProps {
  value?: string;
  onChange: (value: string) => void;
  country?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CitySelect({
  value,
  onChange,
  country,
  label,
  required = false,
  placeholder = 'Select city',
  className,
  disabled = false,
}: CitySelectProps) {
  // Initialize cities with the current value if it exists
  const [cities, setCities] = useState<string[]>(value ? [value] : []);
  const [loading, setLoading] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  useEffect(() => {
    if (!country || disabled) {
      setCities([]);
      if (!country) {
        onChange('');
      }
      return;
    }

    // Fetch cities for the selected country, passing current value to preserve it
    fetchCitiesForCountry(country, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, disabled]);

  // Ensure selected value is always in the cities list immediately
  useEffect(() => {
    if (value && !cities.includes(value)) {
      setCities((prev) => {
        // Only add if not already in the list
        if (!prev.includes(value)) {
          const updated = [...prev, value].sort();
          return updated;
        }
        return prev;
      });
    }
  }, [value, cities]);

  const getCountryCode = (countryName: string): string | undefined => {
    if (!countryName) return undefined;
    
    // Use the library to get the country code from the country name
    const countryNames = countries.getNames('en', { select: 'official' });
    
    // Normalize strings for comparison (remove accents, lowercase, trim)
    const normalize = (str: string) => 
      str.toLowerCase()
         .normalize('NFD')
         .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
         .trim();
    
    const normalizedInput = normalize(countryName);
    
    // Find the country code by exact name match
    for (const [code, name] of Object.entries(countryNames)) {
      if (name === countryName) {
        return code.toLowerCase();
      }
    }
    
    // Try normalized match (handles accents and case differences)
    for (const [code, name] of Object.entries(countryNames)) {
      if (name && normalize(name) === normalizedInput) {
        return code.toLowerCase();
      }
    }
    
    // Fallback: try to find by partial match or common variations
    // This handles cases like "United States" vs "United States of America"
    for (const [code, name] of Object.entries(countryNames)) {
      if (name) {
        const normalizedLibName = normalize(name);
        if (normalizedLibName.includes(normalizedInput) || normalizedInput.includes(normalizedLibName)) {
          return code.toLowerCase();
        }
      }
    }
    
    // Special cases for common variations
    const specialCases: Record<string, string> = {
      'cote divoire': 'ci',
      "côte d'ivoire": 'ci',
      'ivory coast': 'ci',
      'usa': 'us',
      'united states': 'us',
      'uk': 'gb',
      'united kingdom': 'gb',
    };
    
    const specialCase = specialCases[normalizedInput];
    if (specialCase) {
      return specialCase;
    }
    
    return undefined;
  };

  const fetchCitiesForCountry = async (countryName: string, currentValue?: string) => {
    if (!autocompleteServiceRef.current) return;

    setLoading(true);
    try {
      const countryCode = getCountryCode(countryName);
      
      // Fetch multiple batches of cities to get a comprehensive list
      const citySet = new Set<string>();
      
      // If there's a selected value, ensure it's included
      const selectedValue = currentValue || value;
      if (selectedValue) {
        citySet.add(selectedValue);
      }
      
      const searchTerms = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
      ];

      // Fetch cities starting with all letters (not just first 10)
      const requests = searchTerms.map((letter) => {
        const request: google.maps.places.AutocompletionRequest = {
          input: letter,
          types: ['(cities)'],
          ...(countryCode && { componentRestrictions: { country: countryCode } }),
        };

        return new Promise<void>((resolve) => {
          autocompleteServiceRef.current.getPlacePredictions(
            request,
            (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                predictions.forEach((prediction) => {
                  const cityName = prediction.structured_formatting.main_text;
                  if (cityName) {
                    citySet.add(cityName);
                  }
                });
              }
              resolve();
            }
          );
        });
      });

      await Promise.all(requests);
      
      // Also try fetching with the country name and major city names to get more cities
      const additionalSearches = [
        countryName,
        'city',
        'capital',
        'major',
      ];

      const additionalRequests = additionalSearches.map((searchTerm) => {
        const request: google.maps.places.AutocompletionRequest = {
          input: searchTerm,
          types: ['(cities)'],
          ...(countryCode && { componentRestrictions: { country: countryCode } }),
        };

        return new Promise<void>((resolve) => {
          autocompleteServiceRef.current.getPlacePredictions(
            request,
            (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                predictions.forEach((prediction) => {
                  const cityName = prediction.structured_formatting.main_text;
                  if (cityName) {
                    citySet.add(cityName);
                  }
                });
              }
              resolve();
            }
          );
        });
      });

      await Promise.all(additionalRequests);

      const sortedCities = Array.from(citySet).sort();
      // Ensure the current value is always in the list
      const finalCities = sortedCities.includes(selectedValue || '') 
        ? sortedCities 
        : selectedValue 
          ? [...sortedCities, selectedValue].sort()
          : sortedCities;
      setCities(finalCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      // Ensure selected value is still in the list even if fetch fails
      const selectedValue = value;
      if (selectedValue) {
        setCities([selectedValue]);
      } else {
        setCities([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="city-select" className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select 
        value={value || undefined} 
        onValueChange={(newValue) => {
          onChange(newValue);
          // Immediately add to cities list if not already there
          if (newValue && !cities.includes(newValue)) {
            setCities((prev) => [...prev, newValue].sort());
          }
        }}
        disabled={disabled || !country || loading}
        required={required}
      >
        <SelectTrigger id="city-select" className="h-11">
          <SelectValue placeholder={!country ? 'Select country first' : loading ? 'Loading cities...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="__loading__" disabled>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading cities...
              </div>
            </SelectItem>
          ) : cities.length === 0 && country ? (
            <SelectItem value="__no_cities__" disabled>No cities found</SelectItem>
          ) : (
            cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))
          )}
          {/* Always include the selected value if it's not in the list */}
          {value && !cities.includes(value) && !loading && (
            <SelectItem value={value}>
              {value}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
