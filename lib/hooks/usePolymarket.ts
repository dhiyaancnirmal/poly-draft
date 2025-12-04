import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDailyMarkets, getTags, MarketSelection, Tag } from '@/lib/api/polymarket';

// Query keys for React Query
export const QUERY_KEYS = {
  dailyMarkets: ['daily-markets'],
  tags: ['tags'],
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

// Hook for fetching available tags
export function useTags(options?: Partial<UseQueryOptions<Tag[], Error>>) {
  return useQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn: () => getTags(),
    staleTime: 1000 * 60 * 60, // 1 hour - tags don't change often
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
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

// Hook for real-time market updates (placeholder for WebSocket integration)
export function useRealTimeMarkets(marketIds: string[]) {
  const [priceUpdates, setPriceUpdates] = useState<Record<string, { price: number; timestamp: number }>>({});

  // This is a placeholder for WebSocket integration
  // In the future, this will connect to Polymarket WebSocket for real-time updates
  useEffect(() => {
    if (marketIds.length === 0) return;

    // Simulate price updates for demo purposes
    const interval = setInterval(() => {
      setPriceUpdates(prev => {
        const updates = { ...prev };
        marketIds.forEach(id => {
          // Simulate small price changes
          const currentPrice = updates[id]?.price || Math.random() * 0.5 + 0.25;
          const change = (Math.random() - 0.5) * 0.02; // ±1% change
          updates[id] = {
            price: Math.max(0.01, Math.min(0.99, currentPrice + change)),
            timestamp: Date.now(),
          };
        });
        return updates;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [marketIds]);

  return priceUpdates;
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