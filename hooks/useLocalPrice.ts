import { useState, useEffect } from 'react';

const IP_API_URL = 'https://ipwhois.app/json/';
const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/USD';

interface LocalPriceData {
  currency: string;
  rate: number;
  isLoading: boolean;
  error: boolean;
}

export function useLocalPrice() {
  const [data, setData] = useState<LocalPriceData>({
    currency: 'USD',
    rate: 1,
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchLocalData() {
      try {
        // 1. Get user's local currency based on IP
        const ipRes = await fetch(IP_API_URL);
        if (!ipRes.ok) throw new Error('IP API failed');
        const ipData = await ipRes.json();
        const localCurrency = ipData.currency_code || ipData.currency || 'USD';

        if (localCurrency === 'USD') {
          if (mounted) setData({ currency: 'USD', rate: 1, isLoading: false, error: false });
          return;
        }

        // 2. Get exchange rate for USD to localCurrency
        const exRes = await fetch(EXCHANGE_API_URL);
        if (!exRes.ok) throw new Error('Exchange API failed');
        const exData = await exRes.json();
        
        const rate = exData.rates[localCurrency] || 1;

        if (mounted) {
          setData({
            currency: localCurrency,
            rate,
            isLoading: false,
            error: false,
          });
        }
      } catch (err) {
        console.warn('Failed to fetch local currency data:', err);
        if (mounted) {
          setData((prev) => ({ ...prev, isLoading: false, error: true }));
        }
      }
    }

    fetchLocalData();

    return () => {
      mounted = false;
    };
  }, []);

  const roundNice = (num: number): number => {
    if (num <= 0) return 0;
    if (num < 10) return Math.ceil(num);
    if (num < 100) return Math.ceil(num / 10) * 10;
    if (num < 1000) return Math.ceil(num / 100) * 100;
    return Math.ceil(num / 1000) * 1000;
  };

  const formatPrice = (usdAmount: number, overrideLang?: string) => {
    // Convert the base USD amount to local currency
    const rawAmount = usdAmount * data.rate;
    // Round to a nice closed number based on magnitude
    const localAmount = roundNice(rawAmount);
    
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: data.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(localAmount);
    } catch {
      // Fallback
      return `${data.currency} ${localAmount.toFixed(0)}`;
    }
  };

  return { ...data, formatPrice, roundNice };
}
