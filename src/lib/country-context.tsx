import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { Country } from './types';

const STORAGE_KEY = 'khedma_country';
const DEFAULT_COUNTRY = 'TN';

interface CountryContextValue {
  countries: Country[];
  countryCode: string;
  setCountryCode: (code: string) => void;
}

const CountryContext = createContext<CountryContextValue | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryCode, setCountryCodeState] = useState(DEFAULT_COUNTRY);

  useEffect(() => {
    api.get<Country[]>('/countries').then(setCountries).catch(() => setCountries([]));

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setCountryCodeState(stored);
      })
      .catch(() => {
        // AsyncStorage unavailable -- fall back to the default silently.
      });
  }, []);

  function setCountryCode(code: string) {
    setCountryCodeState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {
      // per-viewer convenience only, safe to ignore if storage is blocked.
    });
  }

  return (
    <CountryContext.Provider value={{ countries, countryCode, setCountryCode }}>{children}</CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry doit être utilisé dans un CountryProvider');
  return ctx;
}

/** Currency symbol for a given country code, falling back to DT. */
export function useCurrencySymbol(countryCode?: string | null) {
  const { countries } = useCountry();
  return countries.find((c) => c.code === (countryCode || 'TN'))?.currencySymbol || 'DT';
}
