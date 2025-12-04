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

export function CountrySelect({
  value,
  onChange,
  label,
  required = false,
  placeholder = 'Select country',
  className,
}: CountrySelectProps) {
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
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.name}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
