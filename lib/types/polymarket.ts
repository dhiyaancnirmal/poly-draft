// Polymarket API Types
// Based on Gamma API response structure

export interface PolymarketEvent {
  id: string;
  ticker?: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  resolutionSource?: string;
  startDate?: string;
  creationDate?: string;
  endDate: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  archived?: boolean;
  new?: boolean;
  featured?: boolean;
  restricted?: boolean;
  liquidity?: number;
  volume: number;
  openInterest?: number;
  sortBy?: string;
  category?: string;
  subcategory?: string;
  isTemplate?: boolean;
  templateVariables?: string;
  published_at?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  commentsEnabled?: boolean;
  competitive?: number;
  volume24hr?: number;
  volume1wk?: number;
  volume1mo?: number;
  volume1yr?: number;
  markets: PolymarketMarket[];
  tags?: Tag[];
  categories?: Category[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug?: string;
  twitterCardImage?: string;
  resolutionSource?: string;
  endDate: string;
  category?: string;
  ammType?: string;
  liquidity?: string;
  sponsorName?: string;
  sponsorImage?: string;
  startDate?: string;
  xAxisValue?: string;
  yAxisValue?: string;
  denominationToken?: string;
  fee?: string;
  image?: string;
  icon?: string;
  lowerBound?: string;
  upperBound?: string;
  description?: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  marketType?: string;
  formatType?: string;
  lowerBoundDate?: string;
  upperBoundDate?: string;
  closed: boolean;
  marketMakerAddress?: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  closedTime?: string;
  wideFormat?: boolean;
  new?: boolean;
  mailchimpTag?: string;
  featured?: boolean;
  archived?: boolean;
  resolvedBy?: string;
  restricted?: boolean;
  marketGroup?: number;
  groupItemTitle?: string;
  groupItemThreshold?: string;
  questionID?: string;
  umaEndDate?: string;
  enableOrderBook?: boolean;
  orderPriceMinTickSize?: number;
  orderMinSize?: number;
  umaResolutionStatus?: string;
  curationOrder?: number;
  volumeNum?: number;
  liquidityNum?: number;
  endDateIso?: string;
  startDateIso?: string;
  umaEndDateIso?: string;
  hasReviewedDates?: boolean;
  readyForCron?: boolean;
  commentsEnabled?: boolean;
  volume24hr?: number;
  volume1wk?: number;
  volume1mo?: number;
  volume1yr?: number;
  gameStartTime?: string;
  secondsDelay?: number;
  clobTokenIds?: string;
  disqusThread?: string;
  shortOutcomes?: string;
  teamAID?: string;
  teamBID?: string;
  umaBond?: string;
  umaReward?: string;
  fpmmLive?: boolean;
  volume24hrAmm?: number;
  volume1wkAmm?: number;
  volume1moAmm?: number;
  volume1yrAmm?: number;
  volume24hrClob?: number;
  volume1wkClob?: number;
  volume1moClob?: number;
  volume1yrClob?: number;
  volumeAmm?: number;
  volumeClob?: number;
  liquidityAmm?: number;
  liquidityClob?: number;
  makerBaseFee?: number;
  takerBaseFee?: number;
  customLiveness?: number;
  acceptingOrders?: boolean;
  notificationsEnabled?: boolean;
  score?: number;
  imageOptimized?: ImageOptimized;
  iconOptimized?: ImageOptimized;
  events?: any[];
  categories?: Category[];
  tags?: Tag[];
  creator?: string;
  ready?: boolean;
  funded?: boolean;
  pastSlugs?: string;
  readyTimestamp?: string;
  fundedTimestamp?: string;
  acceptingOrdersTimestamp?: string;
  competitive?: number;
  rewardsMinSize?: number;
  rewardsMaxSpread?: number;
  spread?: number;
  automaticallyResolved?: boolean;
  oneDayPriceChange?: number;
  oneHourPriceChange?: number;
  oneWeekPriceChange?: number;
  oneMonthPriceChange?: number;
  oneYearPriceChange?: number;
  lastTradePrice?: number;
  bestBid?: number;
  bestAsk?: number;
  automaticallyActive?: boolean;
  clearBookOnStart?: boolean;
  chartColor?: string;
  seriesColor?: string;
  showGmpSeries?: boolean;
  showGmpOutcome?: boolean;
  manualActivation?: boolean;
  negRiskOther?: boolean;
  gameId?: string;
  groupItemRange?: string;
  sportsMarketType?: string;
  line?: number;
  umaResolutionStatuses?: string;
  pendingDeployment?: boolean;
  deploying?: boolean;
  deployingTimestamp?: string;
  scheduledDeploymentTimestamp?: string;
  rfqEnabled?: boolean;
  eventStartTime?: string;
}

export interface Tag {
  id: string;
  label: string;
  slug: string;
  forceShow?: boolean;
  publishedAt?: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  forceHide?: boolean;
  isCarousel?: boolean;
  event_count?: number;
}

export interface Category {
  id: string;
  label: string;
  parentCategory?: string;
  slug: string;
  publishedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImageOptimized {
  id: string;
  imageUrlSource: string;
  imageUrlOptimized: string;
  imageSizeKbSource: number;
  imageSizeKbOptimized: number;
  imageOptimizedComplete: boolean;
  imageOptimizedLastUpdated: string;
  relID: number;
  field: string;
  relname: string;
}

export interface SearchResponse {
  events: PolymarketEvent[];
  tags?: Tag[];
  profiles?: any[];
  pagination?: {
    hasMore: boolean;
    totalResults: number;
  };
}

export interface MarketSelection {
  event: PolymarketEvent;
  market: PolymarketMarket;
  category: string;
  confidence: number;
}

// Market categories for diversity selection
export const MARKET_CATEGORIES = {
  WEATHER: 'weather',
  CRYPTO: 'crypto', 
  FINANCE: 'finance',
  POLITICS: 'politics',
  TECHNOLOGY: 'technology',
  BUSINESS: 'business',
  SCIENCE: 'science',
  SPORTS: 'sports',
  OTHER: 'other'
} as const;

export type MarketCategory = typeof MARKET_CATEGORIES[keyof typeof MARKET_CATEGORIES];

// Category priority for daily selection
export const CATEGORY_PRIORITY: MarketCategory[] = [
  MARKET_CATEGORIES.WEATHER,     // Always available (London/NYC)
  MARKET_CATEGORIES.FINANCE,      // High frequency 
  MARKET_CATEGORIES.CRYPTO,        // High frequency
  MARKET_CATEGORIES.POLITICS,      // Daily if available
  MARKET_CATEGORIES.TECHNOLOGY,    // Elon Musk tweets, etc.
  MARKET_CATEGORIES.BUSINESS,      // Stock movements
  MARKET_CATEGORIES.SCIENCE,       // If available
  MARKET_CATEGORIES.SPORTS,        // If available
  MARKET_CATEGORIES.OTHER          // Fallback
];

// Extended MarketCard interface to support Polymarket data
export interface ExtendedMarketCardProps {
  market?: {
    id: string;
    question: string;
    description?: string;
    outcomes: string[];
    outcomePrices: number[];
    yesPrice: number;
    noPrice: number;
    volume: string;
    volume24hr?: number;
    endTime: string;
    category?: string;
    slug?: string;
    liquidity?: string;
    active?: boolean;
    clobTokenIds?: string[];
  };
  loading?: boolean;
  onSelect?: (marketId: string, side: 'YES' | 'NO') => void;
  selectedSide?: 'YES' | 'NO' | null;
  selectedMarket?: string | null;
  livePrice?: MarketLivePrice;
  isLive?: boolean;
}

export interface MarketLivePrice {
  yesPrice: number;
  noPrice: number;
  priceChange?: number;
  lastUpdated?: number;
  source?: 'ws' | 'rest' | 'static';
}