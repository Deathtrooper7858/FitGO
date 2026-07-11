import { useState, useEffect } from 'react';
import { IP_WHOIS_URL, EXCHANGE_RATE_URL } from '../constants/urls';

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
        const ipRes = await fetch(IP_WHOIS_URL);
        if (!ipRes.ok) throw new Error('IP API failed');
        const ipData = await ipRes.json();
        const localCurrency = ipData.currency_code || ipData.currency || 'USD';

        if (localCurrency === 'USD') {
          if (mounted) setData({ currency: 'USD', rate: 1, isLoading: false, error: false });
          return;
        }

        // COP and ARS use hardcoded prices in formatPrice() due to high volatility,
        // but we still store the currency so the badge shows correctly.
        // For all other currencies, fetch the live exchange rate.
        const VOLATILE_CURRENCIES = ['COP', 'ARS'];
        if (VOLATILE_CURRENCIES.includes(localCurrency)) {
          if (mounted) setData({ currency: localCurrency, rate: 1, isLoading: false, error: false });
          return;
        }

        // 2. Get live exchange rate for USD → localCurrency (covers MXN, BRL, EUR, GBP, etc.)
        const exRes = await fetch(EXCHANGE_RATE_URL);
        if (!exRes.ok) throw new Error('Exchange API failed');
        const exData = await exRes.json();

        const rate = exData.rates[localCurrency];

        if (!rate) {
          // Currency not found in exchange rates — fall back to USD display
          if (mounted) setData({ currency: 'USD', rate: 1, isLoading: false, error: false });
          return;
        }

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
    // Round to nearest 100 for numbers >= 1000 to allow prices like 11800 or 5900
    return Math.round(num / 100) * 100;
  };

  const formatPrice = (usdAmount: number, overrideLang?: string) => {
    if (data.currency === 'COP') {
      // Hardcoded COP prices — exchange rate APIs often underestimate COP
      // Based on ~4,000 COP/USD real market rate
      // discounted = $4.99 USD → ~20,000 COP | original = $9.99 USD → ~40,000 COP
      const isDiscounted = usdAmount < 6.00;
      const copVal = isDiscounted ? 19900 : 39900;
      try {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(copVal);
      } catch {
        return `$ ${copVal.toLocaleString('es-CO')}`;
      }
    }

    if (data.currency === 'ARS') {
      // Hardcoded ARS prices — highly volatile currency, APIs often outdated
      // Based on ~1,100 ARS/USD market rate
      const isDiscounted = usdAmount < 6.00;
      const arsVal = isDiscounted ? 5500 : 10900;
      try {
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(arsVal);
      } catch {
        return `$ ${arsVal.toLocaleString('es-AR')}`;
      }
    }

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
