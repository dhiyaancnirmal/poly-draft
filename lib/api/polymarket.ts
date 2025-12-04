import { PolymarketEvent, PolymarketMarket, SearchResponse, Tag, MarketSelection, MARKET_CATEGORIES, MarketCategory, CATEGORY_PRIORITY } from '@/lib/types/polymarket';

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

// Cache for API responses to respect rate limits
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

// Helper function for caching
function getCachedData(key: string): any | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  apiCache.set(key, { data, timestamp: Date.now() });
}

// Generic fetch with caching and error handling
async function fetchWithCache(url: string, cacheKey: string): Promise<any> {
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PolyDraft/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`API Error for ${url}:`, error);
    throw error;
  }
}

// Search markets by date string (quoted for exact match)
export async function searchMarketsByDate(date: string): Promise<SearchResponse> {
  const searchQuery = `"${date}"`;
  const url = `${POLYMARKET_API}/public-search?q=${encodeURIComponent(searchQuery)}&limit=100&sort=volume&ascending=false&events_status=open`;
  const cacheKey = `search-${date}`;
  
  return fetchWithCache(url, cacheKey);
}

// Get all available tags for category mapping
export async function getTags(): Promise<Tag[]> {
  const url = `${POLYMARKET_API}/tags?limit=100&order=label&ascending=true`;
  const cacheKey = 'tags';
  
  return fetchWithCache(url, cacheKey);
}

// Get specific event by slug
export async function getEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  const url = `${POLYMARKET_API}/events/slug/${slug}`;
  const cacheKey = `event-${slug}`;
  
  try {
    return await fetchWithCache(url, cacheKey);
  } catch (error) {
    console.error(`Failed to fetch event ${slug}:`, error);
    return null;
  }
}

// Get markets by tag ID
export async function getMarketsByTag(tagId: string, limit: number = 50): Promise<PolymarketEvent[]> {
  const url = `${POLYMARKET_API}/events?tag_id=${tagId}&closed=false&limit=${limit}&order=volume&ascending=false`;
  const cacheKey = `tag-${tagId}-${limit}`;
  
  return fetchWithCache(url, cacheKey);
}

// Get all active events (for fallback)
export async function getActiveEvents(limit: number = 100, offset: number = 0): Promise<PolymarketEvent[]> {
  const url = `${POLYMARKET_API}/events?order=id&ascending=false&closed=false&limit=${limit}&offset=${offset}`;
  const cacheKey = `active-events-${limit}-${offset}`;
  
  return fetchWithCache(url, cacheKey);
}

// Date formatting utilities
export function getDateSearchStrings(targetDate: Date): string[] {
  const dateStrings = [
    // Full month name format
    `"${targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}"`, // "December 4"
    // Short month name format  
    `"${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}"`, // "Dec 4"
    // Numeric format
    `"${targetDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}"`, // "12/4/2025"
    // Alternative formats
    `"${targetDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}"`, // "4 December 4"
  ];
  
  return dateStrings;
}

export function getNextDayDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function getTodayDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// Category detection from market data
export function detectMarketCategory(event: PolymarketEvent): MarketCategory {
  const { title, category, tags } = event;
  
  // Use explicit category first
  if (category) {
    const normalizedCategory = category.toLowerCase();
    for (const value of Object.values(MARKET_CATEGORIES)) {
      if (normalizedCategory.includes(value)) {
        return value as MarketCategory;
      }
    }
  }
  
  // Fallback to keyword detection in title
  const titleLower = title.toLowerCase();
  
  // Weather patterns
  if (titleLower.includes('weather') || titleLower.includes('rain') || 
      titleLower.includes('temperature') || titleLower.includes('snow') ||
      titleLower.includes('london') || titleLower.includes('nyc') ||
      titleLower.includes('new york')) {
    return MARKET_CATEGORIES.WEATHER;
  }
  
  // Crypto patterns
  if (titleLower.includes('bitcoin') || titleLower.includes('btc') ||
      titleLower.includes('ethereum') || titleLower.includes('eth') ||
      titleLower.includes('crypto') || titleLower.includes('coin')) {
    return MARKET_CATEGORIES.CRYPTO;
  }
  
  // Finance patterns
  if (titleLower.includes('s&p') || titleLower.includes('stock') ||
      titleLower.includes('market') || titleLower.includes('nasdaq') ||
      titleLower.includes('dow') || titleLower.includes('index')) {
    return MARKET_CATEGORIES.FINANCE;
  }
  
  // Politics patterns
  if (titleLower.includes('election') || titleLower.includes('trump') ||
      titleLower.includes('biden') || titleLower.includes('congress') ||
      titleLower.includes('senate') || titleLower.includes('president')) {
    return MARKET_CATEGORIES.POLITICS;
  }
  
  // Technology patterns
  if (titleLower.includes('elon') || titleLower.includes('musk') ||
      titleLower.includes('twitter') || titleLower.includes('tesla') ||
      titleLower.includes('apple') || titleLower.includes('google')) {
    return MARKET_CATEGORIES.TECHNOLOGY;
  }
  
  // Business patterns
  if (titleLower.includes('earnings') || titleLower.includes('revenue') ||
      titleLower.includes('profit') || titleLower.includes('sales')) {
    return MARKET_CATEGORIES.BUSINESS;
  }
  
  // Science patterns
  if (titleLower.includes('covid') || titleLower.includes('vaccine') ||
      titleLower.includes('climate') || titleLower.includes('science')) {
    return MARKET_CATEGORIES.SCIENCE;
  }
  
  // Sports patterns
  if (titleLower.includes('game') || titleLower.includes('match') ||
      titleLower.includes('team') || titleLower.includes('win') ||
      titleLower.includes('score') || titleLower.includes('season')) {
    return MARKET_CATEGORIES.SPORTS;
  }
  
  return MARKET_CATEGORIES.OTHER;
}

// Group markets by category
export function groupMarketsByCategory(events: PolymarketEvent[]): Record<MarketCategory, PolymarketEvent[]> {
  const grouped: Record<string, PolymarketEvent[]> = {};
  
  // Initialize all categories
  Object.values(MARKET_CATEGORIES).forEach(category => {
    grouped[category] = [];
  });
  
  // Group events by detected category
  events.forEach(event => {
    const category = detectMarketCategory(event);
    grouped[category].push(event);
  });
  
  return grouped as Record<MarketCategory, PolymarketEvent[]>;
}

// Random selection within top markets by volume
export function randomizeTopMarkets(markets: PolymarketEvent[], count: number = 5): PolymarketEvent | null {
  if (markets.length === 0) return null;
  
  // Sort by volume (descending)
  const sorted = [...markets].sort((a, b) => b.volume - a.volume);
  
  // Take top N markets
  const topMarkets = sorted.slice(0, Math.min(count, sorted.length));
  
  // Fisher-Yates shuffle for true randomness
  for (let i = topMarkets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topMarkets[i], topMarkets[j]] = [topMarkets[j], topMarkets[i]];
  }
  
  return topMarkets[0];
}

// Main market selection algorithm with category diversity
export function selectDailyMarkets(events: PolymarketEvent[]): MarketSelection[] {
  const selectedMarkets: MarketSelection[] = [];
  const usedCategories = new Set<MarketCategory>();
  
  // Group by category and sort by volume
  const marketsByCategory = groupMarketsByCategory(events);
  
  // Try to pick one from each category in priority order
  for (const category of CATEGORY_PRIORITY) {
    const categoryMarkets = marketsByCategory[category] || [];
    
    if (categoryMarkets.length > 0 && !usedCategories.has(category)) {
      // Randomize within top volume markets to avoid repetition
      const selectedEvent = randomizeTopMarkets(categoryMarkets, 5);
      
      if (selectedEvent && selectedEvent.markets.length > 0) {
        // Get the first market from the event (most common case)
        const primaryMarket = selectedEvent.markets[0];
        
        selectedMarkets.push({
          event: selectedEvent,
          market: primaryMarket,
          category,
          confidence: calculateConfidence(selectedEvent, primaryMarket)
        });
        
        usedCategories.add(category);
      }
    }
  }
  
  return selectedMarkets;
}

// Calculate confidence score for market selection
function calculateConfidence(event: PolymarketEvent, market: PolymarketMarket): number {
  let confidence = 0;
  
  // Volume score (0-40 points)
  const volumeScore = Math.min(40, (event.volume24hr || event.volume) / 10000);
  confidence += volumeScore;
  
  // Liquidity score (0-20 points)
  if (event.liquidity) {
    confidence += Math.min(20, event.liquidity / 5000);
  }
  
  // Activity score (0-20 points)
  if (market.active && !event.closed) {
    confidence += 20;
  }
  
  // Recent activity score (0-20 points)
  if (event.volume24hr && event.volume24hr > 1000) {
    confidence += Math.min(20, event.volume24hr / 5000);
  }
  
  return Math.min(100, confidence);
}

// Fetch daily markets with fallback strategies
export async function fetchDailyMarkets(targetDate?: Date): Promise<MarketSelection[]> {
  const date = targetDate || new Date();
  const dateStrings = getDateSearchStrings(date);
  
  // Try each date format until we get results
  for (const dateQuery of dateStrings) {
    try {
      const response = await searchMarketsByDate(dateQuery);
      
      if (response.events && response.events.length > 0) {
        console.log(`Found ${response.events.length} markets for date: ${dateQuery}`);
        return selectDailyMarkets(response.events);
      }
    } catch (error) {
      console.warn(`Failed to search for date "${dateQuery}":`, error);
      continue;
    }
  }
  
  // Fallback: try to get active events and filter by date
  console.log('Date search failed, trying active events fallback...');
  try {
    const activeEvents = await getActiveEvents(200);
    
    // Filter events that might resolve tomorrow
    const tomorrowEvents = activeEvents.filter(event => {
      const endDate = new Date(event.endDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if event ends within the next 2 days
      const daysDiff = Math.abs(endDate.getTime() - tomorrow.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 2;
    });
    
    if (tomorrowEvents.length > 0) {
      console.log(`Fallback found ${tomorrowEvents.length} potential events`);
      return selectDailyMarkets(tomorrowEvents);
    }
  } catch (error) {
    console.error('Fallback to active events also failed:', error);
  }
  
  return []; // No markets found
}

// Utility to format volume for display
export function formatVolume(volume: number | string): string {
  const num = typeof volume === 'string' ? parseFloat(volume) : volume;
  
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  } else {
    return `$${num.toFixed(0)}`;
  }
}

// Utility to format end time
export function formatEndTime(endDate: string): string {
  const date = new Date(endDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h`;
  } else {
    return 'Soon';
  }
}