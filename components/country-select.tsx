'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

// Register the locale
countries.registerLocale(enLocale);

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  allowedCountries?: string[]; // Optional list of allowed country names
}

// Get all countries from the library
const getCountriesList = () => {
  const countryNames = countries.getNames('en', { select: 'official' });
  return Object.entries(countryNames)
    .map(([code, name]) => ({
      code: code as string,
      name: name as string,
    }))
    .filter((country) => country.name) // Filter out any invalid entries
    .sort((a, b) => a.name.localeCompare(b.name));
};

const COUNTRIES = getCountriesList();

// Mapping of user-friendly names to official country names
const COUNTRY_NAME_MAP: Record<string, string[]> = {
  'UK': ['United Kingdom', 'United Kingdom of Great Britain and Northern Ireland'],
  'Ireland': ['Ireland'],
  'France': ['France'],
  'Spain': ['Spain'],
  'Italy': ['Italy'],
  'Germany': ['Germany'],
  'Netherland': ['Netherlands'],
  'Netherlands': ['Netherlands'],
  'Beligium': ['Belgium'],
  'Belgium': ['Belgium'],
  'Switzerland': ['Switzerland'],
  'USA': ['United States of America', 'United States'],
  'Senegal': ['Senegal'],
  'Mali': ['Mali'],
  'Guinea': ['Guinea'],
  'Togo': ['Togo'],
  'Burkina Faso': ['Burkina Faso'],
  'Congo': ['Republic of the Congo', 'Congo'],
  'DRC': ['Democratic Republic of the Congo', 'Congo, Democratic Republic of the'],
  'South Africa': ['South Africa'],
  'Zimbabwe': ['Zimbabwe'],
  'Tanzania': ['Tanzania', 'United Republic of Tanzania'],
  'Morocco': ['Morocco'],
  'Algeria': ['Algeria'],
  'Cameroon': ['Cameroon'],
  'Nigeria': ['Nigeria'],
  'Ghana': ['Ghana'],
  'Ivory Coast': ['Ivory Coast', "Côte d'Ivoire", 'Cote d\'Ivoire'],
  'Benin': ['Benin'],
};

// Helper function to match country names strictly
const matchesCountry = (countryName: string, allowedName: string): boolean => {
  const normalizedCountry = countryName.toLowerCase().trim();
  
  // Check if the allowed name has a mapping
  const mappedNames = COUNTRY_NAME_MAP[allowedName] || [allowedName];
  
  // Only match exact names (case-insensitive) to avoid false positives
  // For example, "Guinea" should not match "Guinea-Bissau" or "Equatorial Guinea"
  return mappedNames.some(mapped => {
    const normalizedMapped = mapped.toLowerCase().trim();
    // Exact match only
    return normalizedCountry === normalizedMapped;
  });
};

export function CountrySelect({
  value,
  onChange,
  label,
  required = false,
  placeholder = 'Select country',
  className,
  allowedCountries,
}: CountrySelectProps) {
  // Filter countries if allowedCountries is provided
  const countriesToShow = allowedCountries
    ? COUNTRIES.filter((country) =>
        allowedCountries.some((allowed) => matchesCountry(country.name, allowed))
      )
    : COUNTRIES;

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="country-select" className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select value={value || ''} onValueChange={onChange} required={required}>
        <SelectTrigger id="country-select" className="h-11">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {countriesToShow.map((country) => (
            <SelectItem key={country.code} value={country.name}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
