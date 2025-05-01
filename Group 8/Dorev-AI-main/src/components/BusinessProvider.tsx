import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Business, ReviewCollectionSettings } from '../lib/supabase';

interface BusinessContextType {
  business: Business | null;
  settings: ReviewCollectionSettings | null;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextType>({
  business: null,
  settings: null,
  loading: true,
});

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [settings, setSettings] = useState<ReviewCollectionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      // Fetch default business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', 'default-business-id')
        .single();

      if (businessData) {
        setBusiness(businessData);

        // Fetch settings
        const { data: settingsData } = await supabase
          .from('review_collection_settings')
          .select('*')
          .eq('id', 1)
          .single();

        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BusinessContext.Provider value={{ business, settings, loading }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
} 