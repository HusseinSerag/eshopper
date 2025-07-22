// contexts/GeoContext.tsx
'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export interface GeoData {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  countryName: string;
  currency: string;
  currencyName: string;
  timezone: string;
  languages: string[];
  latitude: number;
  longitude: number;
  postal: string;
  callingCode: string;
  isEU: boolean;
  detectedAt: string;
}

interface GeoContextType {
  geoData: GeoData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const GeoContext = createContext<GeoContextType | undefined>(undefined);

// API service to fetch geo data with fallbacks
const fetchGeoData = async (): Promise<GeoData> => {
  // Try primary service first (ipapi.co)
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('Primary service failed');

    const data = (await response.json()) as any;

    return {
      ip: data.ip || '',
      city: data.city || '',
      region: data.region || '',
      country: data.country_code || '',
      countryCode: data.country_code || '',
      countryName: data.country_name || '',
      currency: data.currency || '',
      currencyName: data.currency_name || '',
      timezone: data.timezone || '',
      languages: data.languages?.split(',') || [],
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      postal: data.postal || '',
      callingCode: data.country_calling_code || '',
      isEU: data.in_eu || false,
      detectedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Primary geo service failed, trying fallback...');

    // Fallback to ipinfo.io
    try {
      const response = await fetch('https://ipinfo.io/json');
      if (!response.ok) throw new Error('Fallback service failed');

      const data = (await response.json()) as any;
      const [lat, lng] = data.loc?.split(',') || ['0', '0'];

      return {
        ip: data.ip || '',
        city: data.city || '',
        region: data.region || '',
        country: data.country || '',
        countryCode: data.country || '',
        countryName: data.country || '', // ipinfo doesn't provide full name
        currency: '', // not available in basic ipinfo
        currencyName: '',
        timezone: data.timezone || '',
        languages: [],
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        postal: data.postal || '',
        callingCode: '',
        isEU: false,
        detectedAt: new Date().toISOString(),
      };
    } catch (fallbackError) {
      console.error('All geo services failed');
      throw new Error('Unable to detect location');
    }
  }
};

interface GeoProviderProps {
  children: ReactNode;
}

export const GeoProvider = ({ children }: GeoProviderProps) => {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we have cached data (optional)

      // @ts-expect-error local storage exist on client
      const cached = localStorage.getItem('geoData');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheAge =
          Date.now() - new Date(parsedCache.detectedAt).getTime();

        // Use cached data if less than 1 hour old
        if (cacheAge < 60 * 60 * 1000) {
          setGeoData(parsedCache);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const data = await fetchGeoData();
      setGeoData(data);

      // Cache the result
      // @ts-expect-error local storage exist on client
      localStorage.setItem('geoData', JSON.stringify(data));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch location data';
      setError(errorMessage);
      console.error('Geo detection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = async () => {
    // @ts-expect-error local storage exist on client
    localStorage.removeItem('geoData'); // Clear cache
    await fetchData();
  };

  return (
    <GeoContext.Provider value={{ geoData, isLoading, error, refetch }}>
      {children}
    </GeoContext.Provider>
  );
};

// Custom hook to use the geo context
export const useGeo = (): GeoContextType => {
  const context = useContext(GeoContext);
  if (context === undefined) {
    throw new Error('useGeo must be used within a GeoProvider');
  }
  return context;
};

// Additional utility hooks for common use cases
export const useCountry = () => {
  const { geoData, isLoading } = useGeo();
  return {
    country: geoData?.countryName || null,
    countryCode: geoData?.countryCode || null,
    isEU: geoData?.isEU || false,
    isLoading,
  };
};

export const useCurrency = () => {
  const { geoData } = useGeo();
  return {
    currency: geoData?.currency || 'USD',
    currencyName: geoData?.currencyName || 'US Dollar',
  };
};

export const useTimezone = () => {
  const { geoData } = useGeo();
  return geoData?.timezone || 'UTC';
};

export const useLocation = () => {
  const { geoData } = useGeo();
  return {
    city: geoData?.city || null,
    region: geoData?.region || null,
    country: geoData?.countryName || null,
    coordinates: geoData
      ? {
          lat: geoData.latitude,
          lng: geoData.longitude,
        }
      : null,
  };
};
