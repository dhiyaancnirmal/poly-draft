// Polymarket CLOB WebSocket service for real-time price updates
// This runs on client-side to maintain persistent connections

export interface PriceUpdate {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  timestamp: number;
  priceChange?: number; // Change from previous price
}

export interface OrderBookUpdate {
  marketId: string;
  assetId: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  timestamp: number;
}

export interface LastTradeUpdate {
  marketId: string;
  assetId: string;
  price: string;
  size: string;
  side: 'BUY' | 'SELL';
  timestamp: number;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface MarketTokenMapping {
  marketId: string;
  tokenId: string;
  outcome: 'YES' | 'NO';
}

class PolymarketWebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>(); // token IDs
  private priceCallbacks = new Map<string, (update: PriceUpdate) => void>();
  private bookCallbacks = new Map<string, (update: OrderBookUpdate) => void>();
  private tradeCallbacks = new Map<string, (update: LastTradeUpdate) => void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private lastPrices = new Map<string, { yesPrice?: number; noPrice?: number }>();
  private tokenMap = new Map<string, MarketTokenMapping>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private status: ConnectionStatus = 'idle';

  private emitStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  // Connect to CLOB WebSocket
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.emitStatus('connecting');

    try {
      this.ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/');

      this.ws.onopen = () => {
        console.log('✅ Polymarket WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.emitStatus('connected');

        // Resubscribe to all markets after reconnection
        if (this.subscriptions.size > 0) {
          console.log(`🔄 Resubscribing to ${this.subscriptions.size} tokens after reconnect`);
          this.subscribeToTokens(Array.from(this.tokenMap.values()), true);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Polymarket WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        this.emitStatus('disconnected');

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.connect();
          }, this.reconnectDelay);
        }
      };

      this.ws.onerror = (event) => {
        const errEvent = event as ErrorEvent;
        const details = {
          type: errEvent.type,
          message: errEvent.message,
        };
        console.error('Polymarket WebSocket error:', details);
        this.isConnecting = false;
        this.emitStatus('error');
      };

    } catch (error) {
      console.error('Failed to connect to Polymarket WebSocket:', error);
      this.isConnecting = false;
      this.emitStatus('error');
    }
  }

  // Handle incoming WebSocket messages
  private handleMessage(data: any): void {
    const messageType = data.type || data.event_type;
    switch (messageType) {
      case 'book':
      case 'book_update':
        this.handleOrderBookUpdate(data);
        break;
      case 'price_change':
      case 'price_update':
        this.handlePriceChange(data);
        break;
      case 'last_trade_price':
      case 'trade':
        this.handleLastTradePrice(data);
        break;
      default:
        break;
    }
  }

  // Handle order book updates
  private handleOrderBookUpdate(data: any): void {
    const tokenId = (data.asset_id || data.token_id || data.market || '').toString();
    const mapping = this.tokenMap.get(tokenId);
    const marketId = mapping?.marketId || data.market;
    if (!marketId) return;

    const update: OrderBookUpdate = {
      marketId,
      assetId: tokenId,
      bids: data.bids || [],
      asks: data.asks || [],
      timestamp: parseInt(data.timestamp)
    };

    // Calculate mid-price from best bid and ask
    const bestBid = update.bids.length > 0 ? parseFloat(update.bids[0].price) : 0;
    const bestAsk = update.asks.length > 0 ? parseFloat(update.asks[0].price) : 1;
    const midPrice = (bestBid + bestAsk) / 2;

    // Update cached price using token mapping
    this.handleTokenPrice(tokenId, midPrice, update.timestamp);

    const bookCallback = this.bookCallbacks.get(update.marketId);
    if (bookCallback) {
      bookCallback(update);
    }
  }

  private handleTokenPrice(tokenId: string, price: number, timestamp: number): void {
    if (price === undefined || Number.isNaN(price)) return;

    const mapping = this.tokenMap.get(tokenId);
    if (!mapping) return;

    const { marketId, outcome } = mapping;
    const lastPrice = this.lastPrices.get(marketId) || {};

    const nextYes = outcome === 'YES'
      ? price
      : lastPrice.yesPrice ?? (lastPrice.noPrice !== undefined ? 1 - lastPrice.noPrice : undefined);

    const nextNo = outcome === 'NO'
      ? price
      : lastPrice.noPrice ?? (lastPrice.yesPrice !== undefined ? 1 - lastPrice.yesPrice : undefined);

    const resolvedYes = nextYes ?? (outcome === 'NO' ? Math.max(0, Math.min(1, 1 - price)) : undefined);
    const resolvedNo = nextNo ?? (outcome === 'YES' ? Math.max(0, Math.min(1, 1 - price)) : undefined);

    const priceChange = outcome === 'YES' && lastPrice.yesPrice !== undefined
      ? price - lastPrice.yesPrice
      : outcome === 'NO' && lastPrice.noPrice !== undefined
        ? price - lastPrice.noPrice
        : undefined;

    this.lastPrices.set(marketId, {
      yesPrice: resolvedYes,
      noPrice: resolvedNo
    });

    const callback = this.priceCallbacks.get(marketId);
    if (callback && resolvedYes !== undefined && resolvedNo !== undefined) {
      // Log first update or every 10th update to avoid spam
      const shouldLog = !this.lastPrices.has(marketId) || Math.random() < 0.1;
      if (shouldLog) {
        console.log(`💰 Price update: ${marketId.slice(0, 8)}... YES: $${resolvedYes.toFixed(2)} NO: $${resolvedNo.toFixed(2)}`,
          priceChange !== undefined ? `(${priceChange > 0 ? '+' : ''}${(priceChange * 100).toFixed(2)}%)` : '');
      }
      callback({
        marketId,
        yesPrice: resolvedYes,
        noPrice: resolvedNo,
        timestamp,
        priceChange,
      });
    }
  }

  // Handle price change updates
  private handlePriceChange(data: any): void {
    const { market, price_changes } = data;

    if (Array.isArray(price_changes)) {
      price_changes.forEach((change: any) => {
        const price = parseFloat(change.price);
        const tokenId = (change.asset_id || change.token_id || market || '').toString();
        this.handleTokenPrice(tokenId, price, parseInt(data.timestamp));
      });
      return;
    }

    // Alternate message shape { type: 'price_update', data: [{ token_id, price, timestamp }] }
    if (Array.isArray(data.data)) {
      data.data.forEach((entry: any) => {
        const tokenId = (entry.token_id || entry.asset_id || market || '').toString();
        this.handleTokenPrice(tokenId, parseFloat(entry.price), parseInt(entry.timestamp || data.timestamp));
      });
    }
  }

  // Handle last trade price updates
  private handleLastTradePrice(data: any): void {
    const tokenId = (data.asset_id || data.token_id || data.market || '').toString();
    const mapping = this.tokenMap.get(tokenId);
    const marketId = mapping?.marketId || data.market;
    if (!marketId) return;

    const update: LastTradeUpdate = {
      marketId,
      assetId: tokenId,
      price: data.price,
      size: data.size,
      side: data.side,
      timestamp: parseInt(data.timestamp)
    };

    const callback = this.tradeCallbacks.get(update.marketId);
    if (callback) {
      callback(update);
    }
  }

  private async waitForOpen(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    await this.connect();
    await new Promise<void>((resolve) => {
      const check = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  // Subscribe to specific token IDs (maps to markets/outcomes)
  async subscribeToTokens(mappings: MarketTokenMapping[], replace: boolean = false): Promise<void> {
    if (replace) {
      const existingTokens = Array.from(this.subscriptions);
      if (existingTokens.length > 0) {
        this.unsubscribeFromTokens(existingTokens);
      }
      this.tokenMap.clear();
    }

    const tokenIds: string[] = [];
    mappings.forEach((mapping) => {
      if (!mapping.tokenId) return;
      const normalizedId = mapping.tokenId.toString();
      this.tokenMap.set(normalizedId, mapping);
      if (!this.subscriptions.has(normalizedId)) {
        this.subscriptions.add(normalizedId);
        tokenIds.push(normalizedId);
      }
    });

    if (tokenIds.length === 0) return;

    await this.waitForOpen();

    tokenIds.forEach((tokenId) => {
      const subscribeMessage = {
        type: 'subscribe',
        channel: 'market',
        market_id: tokenId,
      };
      this.ws!.send(JSON.stringify(subscribeMessage));
    });
    console.log(`📡 Subscribed to ${tokenIds.length} tokens:`, tokenIds.slice(0, 5), tokenIds.length > 5 ? `... (+${tokenIds.length - 5} more)` : '');
  }

  // Unsubscribe from specific token IDs
  unsubscribeFromTokens(tokenIds: string[]): void {
    tokenIds.forEach((tokenId) => {
      this.subscriptions.delete(tokenId);
      this.tokenMap.delete(tokenId);
    });

    if (this.ws && this.ws.readyState === WebSocket.OPEN && tokenIds.length > 0) {
      tokenIds.forEach((tokenId) => {
        const unsubscribeMessage = {
          type: 'unsubscribe',
          channel: 'market',
          market_id: tokenId,
        };
        this.ws!.send(JSON.stringify(unsubscribeMessage));
      });
    }
  }

  // Register callbacks for price updates
  onPriceUpdate(marketId: string, callback: (update: PriceUpdate) => void): void {
    this.priceCallbacks.set(marketId, callback);
  }

  // Register callbacks for order book updates
  onOrderBookUpdate(marketId: string, callback: (update: OrderBookUpdate) => void): void {
    this.bookCallbacks.set(marketId, callback);
  }

  // Register callbacks for trade updates
  onTradeUpdate(marketId: string, callback: (update: LastTradeUpdate) => void): void {
    this.tradeCallbacks.set(marketId, callback);
  }

  // Remove callbacks
  removeCallbacks(marketId: string): void {
    this.priceCallbacks.delete(marketId);
    this.bookCallbacks.delete(marketId);
    this.tradeCallbacks.delete(marketId);
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.priceCallbacks.clear();
    this.bookCallbacks.clear();
    this.tradeCallbacks.clear();
    this.lastPrices.clear();
    this.emitStatus('disconnected');
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.add(listener);
  }

  offStatusChange(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.delete(listener);
  }

  // Get subscribed markets
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

// Singleton instance for the entire application
export const polymarketWS = new PolymarketWebSocketService();

// Export types and service
export { PolymarketWebSocketService };