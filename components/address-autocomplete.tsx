'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  country?: string; // Optional country restriction
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
    const countryCodeMap: Record<string, string> = {
      'United States': 'us',
      'United Kingdom': 'gb',
      'Canada': 'ca',
      'Australia': 'au',
      'Germany': 'de',
      'France': 'fr',
      'Italy': 'it',
      'Spain': 'es',
      'Netherlands': 'nl',
      'Belgium': 'be',
      'Switzerland': 'ch',
      'Austria': 'at',
      'Sweden': 'se',
      'Norway': 'no',
      'Denmark': 'dk',
      'Finland': 'fi',
      'Poland': 'pl',
      'Ireland': 'ie',
      'Portugal': 'pt',
      'Greece': 'gr',
      'Czech Republic': 'cz',
      'Hungary': 'hu',
      'Romania': 'ro',
      'Bulgaria': 'bg',
      'Croatia': 'hr',
      'Slovakia': 'sk',
      'Slovenia': 'si',
      'Lithuania': 'lt',
      'Latvia': 'lv',
      'Estonia': 'ee',
      'Mexico': 'mx',
      'Brazil': 'br',
      'Argentina': 'ar',
      'Chile': 'cl',
      'Colombia': 'co',
      'Peru': 'pe',
      'South Africa': 'za',
      'Egypt': 'eg',
      'Nigeria': 'ng',
      'Kenya': 'ke',
      'India': 'in',
      'China': 'cn',
      'Japan': 'jp',
      'South Korea': 'kr',
      'Singapore': 'sg',
      'Malaysia': 'my',
      'Thailand': 'th',
      'Vietnam': 'vn',
      'Philippines': 'ph',
      'Indonesia': 'id',
      'United Arab Emirates': 'ae',
      'Saudi Arabia': 'sa',
      'Israel': 'il',
      'Turkey': 'tr',
      'Russia': 'ru',
      'Ukraine': 'ua',
      'New Zealand': 'nz',
    };
    return countryCodeMap[countryName]?.toLowerCase();
  };

  const fetchPredictions = (input: string) => {
    if (!autocompleteServiceRef.current || !input.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    const countryCode = country ? getCountryCode(country) : undefined;

    const request: google.maps.places.AutocompletionRequest = {
      input: input,
      ...(countryCode && { componentRestrictions: { country: countryCode } }),
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
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place && onPlaceSelect) {
          onPlaceSelect(place);
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

