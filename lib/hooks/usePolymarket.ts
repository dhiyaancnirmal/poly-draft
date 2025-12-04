import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDailyMarkets, MarketSelection } from '@/lib/api/polymarket';
import { MarketLivePrice } from '@/lib/types/polymarket';
import { polymarketWS, ConnectionStatus, MarketTokenMapping, PriceUpdate } from '@/lib/websocket/polymarket';

// Query keys for React Query
export const QUERY_KEYS = {
  dailyMarkets: ['daily-markets'],
  polymarket: ['polymarket'],
} as const;

// Hook for fetching daily markets with category diversity
export function useDailyMarkets(targetDate?: Date, options?: Partial<UseQueryOptions<MarketSelection[], Error>>) {
  return useQuery({
    queryKey: [...QUERY_KEYS.dailyMarkets, targetDate?.toISOString()],
    queryFn: async () => {
      // Use API route instead of direct fetch to Polymarket (fixes CORS)
      const url = targetDate
        ? `/api/polymarket/daily-markets?date=${targetDate.toISOString()}`
        : '/api/polymarket/daily-markets'

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch markets')
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refresh every 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// Hook for fetching markets for specific date (for testing different dates)
export function useMarketsForDate(date: Date, options?: Partial<UseQueryOptions<MarketSelection[], Error>>) {
  return useQuery({
    queryKey: [...QUERY_KEYS.dailyMarkets, date.toISOString()],
    queryFn: () => fetchDailyMarkets(date),
    staleTime: 1000 * 60 * 2, // 2 minutes for specific date queries
    enabled: !!date,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
    ...options,
  });
}

// Hook for getting market selection status
export function useMarketSelection() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO' | null>(null);
  const [picks, setPicks] = useState<Array<{ marketId: string; side: 'YES' | 'NO'; timestamp: number }>>([]);

  const selectMarket = (marketId: string, side: 'YES' | 'NO') => {
    setSelectedMarket(marketId);
    setSelectedSide(side);
  };

  const confirmPick = () => {
    if (selectedMarket && selectedSide) {
      const newPick = {
        marketId: selectedMarket,
        side: selectedSide,
        timestamp: Date.now(),
      };
      
      setPicks((prev) => [...prev, newPick]);
      setSelectedMarket(null);
      setSelectedSide(null);
      
      return newPick;
    }
    return null;
  };

  const clearSelection = () => {
    setSelectedMarket(null);
    setSelectedSide(null);
  };

  const removePick = (marketId: string) => {
    setPicks((prev) => prev.filter((pick) => pick.marketId !== marketId));
  };

  const clearAllPicks = () => {
    setPicks([]);
    setSelectedMarket(null);
    setSelectedSide(null);
  };

  return {
    selectedMarket,
    selectedSide,
    picks,
    selectMarket,
    confirmPick,
    clearSelection,
    removePick,
    clearAllPicks,
    hasSelection: !!selectedMarket && !!selectedSide,
    totalPicks: picks.length,
  };
}

// Live price hook powered by CLOB WebSocket + price REST fallback
export function usePolymarketLivePrices(markets?: MarketSelection[]) {
  const [livePrices, setLivePrices] = useState<Record<string, MarketLivePrice>>({});
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Map markets to token IDs (YES = index 0, NO = index 1)
  const tokenMappings = useMemo<MarketTokenMapping[]>(() => {
    if (!markets || markets.length === 0) return [];

    return markets.flatMap((selection) => {
      const tokens = selection.market.clobTokenIds
        ? selection.market.clobTokenIds.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      return tokens.map((tokenId, index) => ({
        marketId: selection.market.id,
        tokenId,
        outcome: index === 0 ? 'YES' : 'NO',
      }));
    });
  }, [markets]);

  // Seed baseline prices from static market data
  useEffect(() => {
    if (!markets || markets.length === 0) return;

    const baseline: Record<string, MarketLivePrice> = {};

    markets.forEach((selection) => {
      const prices = selection.market.outcomePrices?.split(',').map(Number) || [];
      if (prices.length >= 2 && !Number.isNaN(prices[0]) && !Number.isNaN(prices[1])) {
        baseline[selection.market.id] = {
          yesPrice: prices[0],
          noPrice: prices[1],
          lastUpdated: Date.now(),
          source: 'static',
        };
      }
    });

    setLivePrices((prev) => ({ ...baseline, ...prev }));
  }, [markets]);

  // Fetch current prices via REST as a fast initial snapshot
  useEffect(() => {
    if (!markets || markets.length === 0) return;

    const controller = new AbortController();
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/polymarket/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marketIds: markets.map((m) => m.market.id) }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch live prices');
        }

        const { prices } = await response.json();
        if (Array.isArray(prices)) {
          const snapshot: Record<string, MarketLivePrice> = {};
          prices.forEach((price: any) => {
            if (price?.marketId && typeof price.yesPrice === 'number' && typeof price.noPrice === 'number') {
              snapshot[price.marketId] = {
                yesPrice: price.yesPrice,
                noPrice: price.noPrice,
                priceChange: price.priceChange,
                lastUpdated: price.timestamp || Date.now(),
                source: 'rest',
              };
            }
          });
          setLivePrices((prev) => ({ ...prev, ...snapshot }));
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error(err);
          setError('Unable to load live prices');
        }
      }
    };

    fetchPrices();
    return () => controller.abort();
  }, [markets]);

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    if (tokenMappings.length === 0) return;

    let mounted = true;

    const handleStatus = (next: ConnectionStatus) => {
      if (!mounted) return;
      setStatus(next);
      if (next === 'error') {
        setError('WebSocket connection error');
      }
    };

    const seenMarkets = new Set<string>();
    tokenMappings.forEach(({ marketId }) => {
      if (seenMarkets.has(marketId)) return;
      seenMarkets.add(marketId);

      polymarketWS.onPriceUpdate(marketId, (update: PriceUpdate) => {
        if (!mounted) return;
        setLivePrices((prev) => {
          const current = prev[marketId];
          const priceChange =
            update.priceChange !== undefined
              ? update.priceChange
              : current?.yesPrice !== undefined
                ? update.yesPrice - current.yesPrice
                : undefined;

          return {
            ...prev,
            [marketId]: {
              yesPrice: update.yesPrice,
              noPrice: update.noPrice,
              priceChange,
              lastUpdated: update.timestamp,
              source: 'ws',
            },
          };
        });
      });
    });

    polymarketWS.onStatusChange(handleStatus);
    setStatus(polymarketWS.getStatus());
    polymarketWS.subscribeToTokens(tokenMappings, true);

    return () => {
      mounted = false;
      polymarketWS.offStatusChange(handleStatus);
      const uniqueMarkets = Array.from(new Set(tokenMappings.map((m) => m.marketId)));
      const uniqueTokens = Array.from(new Set(tokenMappings.map((m) => m.tokenId)));
      uniqueMarkets.forEach((marketId) => polymarketWS.removeCallbacks(marketId));
      polymarketWS.unsubscribeFromTokens(uniqueTokens);
    };
  }, [tokenMappings]);

  return {
    livePrices,
    status,
    error,
  };
}

// Backwards-compatible alias
export function useRealTimeMarkets(markets?: MarketSelection[]) {
  return usePolymarketLivePrices(markets);
}

// Hook for market filtering and search
export function useMarketFilter(markets: MarketSelection[]) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [volumeFilter, setVolumeFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMarkets = useMemo(() => {
    return markets.filter(selection => {
      // Category filter
      if (categoryFilter !== 'all' && selection.category !== categoryFilter) {
        return false;
      }

      // Volume filter
      if (volumeFilter > 0) {
        const volume = selection.event.volume24hr || selection.event.volume;
        if (volume < volumeFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = selection.event.title.toLowerCase();
        const description = selection.event.description?.toLowerCase() || '';
        
        if (!title.includes(query) && !description.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [markets, categoryFilter, volumeFilter, searchQuery]);

  return {
    filteredMarkets,
    categoryFilter,
    setCategoryFilter,
    volumeFilter,
    setVolumeFilter,
    searchQuery,
    setSearchQuery,
  };
}

// Hook for draft timer management
export function useDraftTimer(initialTime: number = 45) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback((time: number = initialTime) => {
    setTimeLeft(time);
    setIsRunning(false);
  }, [initialTime]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return {
    timeLeft,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime: () => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  };
}