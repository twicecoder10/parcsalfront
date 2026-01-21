'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Register the locale
countries.registerLocale(enLocale);

interface AddressAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  country?: string; // Optional single country restriction (deprecated, use allowedCountries)
  allowedCountries?: string[]; // Optional array of allowed country names
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  label,
  required = false,
  placeholder = 'Enter address',
  className,
  country,
  allowedCountries,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      
      // Create a dummy div for PlacesService
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
    }
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCountryCode = (countryName: string): string | undefined => {
    if (!countryName) return undefined;

    // Handle common variations and aliases first (fast path)
    const countryCodeMap: Record<string, string> = {
      'UK': 'gb',
      'United Kingdom': 'gb',
      'United Kingdom of Great Britain and Northern Ireland': 'gb',
      'Ireland': 'ie',
      'France': 'fr',
      'Spain': 'es',
      'Italy': 'it',
      'Germany': 'de',
      'Netherlands': 'nl',
      'Netherland': 'nl',
      'Belgium': 'be',
      'Beligium': 'be',
      'Switzerland': 'ch',
      'USA': 'us',
      'United States': 'us',
      'United States of America': 'us',
      'DRC': 'cd',
      'Democratic Republic of the Congo': 'cd',
      'Congo, Democratic Republic of the': 'cd',
      'Congo': 'cg',
      'Republic of the Congo': 'cg',
      'Ivory Coast': 'ci',
      "Côte d'Ivoire": 'ci',
      'Cote d\'Ivoire': 'ci',
      'Nigeria': 'ng',
      'Benin': 'bj',
      'Cameroon': 'cm',
      'Ghana': 'gh',
      'Senegal': 'sn',
      'Mali': 'ml',
      'Guinea': 'gn',
      'Togo': 'tg',
      'Burkina Faso': 'bf',
      'South Africa': 'za',
      'Zimbabwe': 'zw',
      'Tanzania': 'tz',
      'United Republic of Tanzania': 'tz',
      'Morocco': 'ma',
      'Algeria': 'dz',
    };

    // Check the map first (case-sensitive)
    if (countryCodeMap[countryName]) {
      return countryCodeMap[countryName];
    }

    // Try case-insensitive match in the map
    const normalizedName = countryName.toLowerCase();
    for (const [key, code] of Object.entries(countryCodeMap)) {
      if (key.toLowerCase() === normalizedName) {
        return code;
      }
    }

    // Fallback: try to get the country code from the library
    for (const [code, name] of Object.entries(countries.getNames('en', { select: 'official' }))) {
      if (name.toLowerCase() === countryName.toLowerCase()) {
        return code.toLowerCase();
      }
    }

    return undefined;
  };

  const getAllowedCountryCodes = (): string[] | undefined => {
    // If allowedCountries is provided, use it
    if (allowedCountries && allowedCountries.length > 0) {
      const codes = allowedCountries
        .map((countryName) => getCountryCode(countryName))
        .filter((code): code is string => code !== undefined);
      return codes.length > 0 ? codes : undefined;
    }
    
    // Fallback to single country prop for backward compatibility
    if (country) {
      const code = getCountryCode(country);
      return code ? [code] : undefined;
    }
    
    return undefined;
  };

  const fetchPredictions = (input: string) => {
    if (!autocompleteServiceRef.current || !input.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    const countryCodes = getAllowedCountryCodes();

    // Google Maps API only supports max 5 countries in componentRestrictions
    // If we have more than 5 countries, don't restrict via API and validate client-side instead
    const request: google.maps.places.AutocompletionRequest = {
      input: input,
      ...(countryCodes && countryCodes.length > 0 && countryCodes.length <= 5 && { 
        componentRestrictions: { country: countryCodes.length === 1 ? countryCodes[0] : countryCodes } 
      }),
    };

    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
          setShowSuggestions(true);
        } else {
          setPredictions([]);
          setShowSuggestions(false);
        }
        setLoading(false);
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    fetchPredictions(newValue);
  };

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    setInputValue(prediction.description);
    onChange(prediction.description);
    setShowSuggestions(false);
    setPredictions([]);

    // Get place details
    if (placesServiceRef.current && prediction.place_id) {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'address_components', 'geometry'],
      };

      placesServiceRef.current.getDetails(request, (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          // Validate that the selected place is in one of the allowed countries
          if (allowedCountries && allowedCountries.length > 0) {
            const placeCountry = place.address_components?.find(
              (component) => component.types.includes('country')
            )?.long_name;
            
            if (placeCountry) {
              // Normalize country names for comparison
              const countryNameMap: Record<string, string> = {
                'United Kingdom': 'UK',
                'United Kingdom of Great Britain and Northern Ireland': 'UK',
                "Côte d'Ivoire": 'Ivory Coast',
                "Cote d'Ivoire": 'Ivory Coast',
                'United States': 'USA',
                'United States of America': 'USA',
                'Democratic Republic of the Congo': 'DRC',
                'Congo, Democratic Republic of the': 'DRC',
                'Republic of the Congo': 'Congo',
                'United Republic of Tanzania': 'Tanzania',
              };
              
              const normalizedPlaceCountry = countryNameMap[placeCountry] || placeCountry;
              
              // Check if the place's country is in the allowed list
              const isAllowed = allowedCountries.some((allowed) => {
                const normalized = allowed.toLowerCase().trim();
                const placeNormalized = normalizedPlaceCountry.toLowerCase().trim();
                return normalized === placeNormalized;
              });
              
              if (!isAllowed) {
                // Place is not in allowed countries, show error
                setInputValue('');
                onChange('');
                alert(`Address must be in one of the allowed countries. Selected country: ${placeCountry}`);
                return;
              }
            }
          }
          
          if (onPlaceSelect) {
            onPlaceSelect(place);
          }
        }
      });
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="address-input" className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="h-11"
          required={required}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        {showSuggestions && predictions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPrediction(prediction)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium text-sm">{prediction.structured_formatting.main_text}</div>
                <div className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

