// services/CoinGeckoService.ts - Updated with MCP Integration
import axios from 'axios';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

/**
 * CoinGecko Service with MCP Integration
 * Supports both REST API (fallback) and MCP Server (preferred)
 * 
 * MCP Server: https://mcp.api.coingecko.com/mcp (keyless)
 *             https://mcp.pro-api.coingecko.com/mcp (authenticated)
 */

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image?: string;
}

interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  description: {
    en: string;
  };
  market_data: {
    current_price: {
      usd: number;
    };
    market_cap: {
      usd: number;
    };
    market_cap_rank?: number;
    total_volume: {
      usd: number;
    };
    price_change_percentage_24h: number;
    high_24h?: { usd: number };
    low_24h?: { usd: number };
    circulating_supply?: number;
    total_supply?: number;
  };
  market_cap_rank?: number;
  platforms?: Record<string, string>;
  image?: {
    thumb: string;
    small: string;
    large: string;
  };
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
  };
}

interface TrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number;
    price_btc: number;
    thumb?: string;
    score?: number;
  };
}

interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
  }>;
}

class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private apiKey: string | undefined;
  private mcpClient: Client | null = null;
  private mcpTransport: SSEClientTransport | null = null;
  private useMCP: boolean = true; // Prefer MCP by default
  private mcpInitialized: boolean = false;
  private availableMCPTools: Set<string> = new Set(); // Track available MCP tools

  constructor() {
    // Optional: Add API key for higher rate limits (REST API)
    this.apiKey = process.env.COINGECKO_API_KEY;
    
    // Initialize MCP connection (non-blocking)
    this.initializeMCP().catch((error) => {
      console.warn('MCP initialization failed, falling back to REST API:', error);
      this.useMCP = false;
      this.mcpInitialized = false;
    });
  }

  /**
   * Ensure MCP is ready (wait for initialization if in progress)
   */
  private async ensureMCPReady(): Promise<void> {
    // If MCP is already initialized or disabled, return immediately
    if (this.mcpInitialized || !this.useMCP) {
      return;
    }

    // Wait up to 3 seconds for MCP to initialize
    const maxWait = 3000;
    const startTime = Date.now();
    
    while (!this.mcpInitialized && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Initialize MCP Client connection to CoinGecko MCP Server
   */
  private async initializeMCP(): Promise<void> {
    try {
      // Use authenticated endpoint if API key available, otherwise use public
      const mcpUrl = this.apiKey 
        ? 'https://mcp.pro-api.coingecko.com/sse'
        : 'https://mcp.api.coingecko.com/sse';

      console.log(`Initializing CoinGecko MCP client: ${mcpUrl}`);

      // Create SSE transport
      this.mcpTransport = new SSEClientTransport(
        new URL(mcpUrl)
      );

      // Create MCP client
      this.mcpClient = new Client(
        {
          name: 'circle-wallet-bot',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Connect to MCP server
      await this.mcpClient.connect(this.mcpTransport);

      // List available tools
      const tools = await this.mcpClient.listTools();
      console.log(`✅ MCP connected. Available tools: ${tools.tools.length}`);
      
      // Log tool names AND descriptions for debugging (critical for development)
      const toolNames = tools.tools.map(t => t.name).sort();
      console.log('📋 Available MCP tools:', toolNames);
      
      // Log detailed tool info for first 10 tools
      console.log('\n🔍 MCP Tool Details (first 10):');
      tools.tools.slice(0, 10).forEach((tool, idx) => {
        console.log(`  ${idx + 1}. ${tool.name}`);
        if (tool.description) {
          console.log(`     📝 ${tool.description}`);
        }
      });
      console.log('');
      
      // Store available tool names for runtime checks
      this.availableMCPTools = new Set(toolNames);

      this.mcpInitialized = true;
      this.useMCP = true;
      
      console.log('🚀 CoinGecko MCP Server ready!');
      console.log(`📡 Endpoint: ${mcpUrl}`);
      console.log(`🔑 Mode: ${this.apiKey ? 'Authenticated (Pro)' : 'Public (Keyless)'}`);
      console.log(`⚡ Rate limits: ${this.apiKey ? 'Pro tier' : 'Shared (30 calls/min)'}`);
      console.log('');
      console.log('💡 TIP: To see available tools, check the console log above');
      console.log('📖 Docs: https://docs.coingecko.com/docs/mcp-server');
    } catch (error) {
      console.error('Failed to initialize MCP:', error);
      this.useMCP = false;
      throw error;
    }
  }

  /**
   * Check if MCP tool is available
   */
  private isMCPToolAvailable(toolName: string): boolean {
    return this.availableMCPTools.has(toolName);
  }

  /**
   * Call MCP tool and parse response
   */
  private async callMCPTool(
    toolName: string, 
    args: Record<string, any>
  ): Promise<any> {
    if (!this.mcpClient || !this.mcpInitialized) {
      throw new Error('MCP client not initialized');
    }

    // Pre-check if tool exists (fail fast)
    if (!this.isMCPToolAvailable(toolName)) {
      console.warn(`⚠️  MCP tool '${toolName}' not available in current server`);
      console.warn(`Available tools: ${Array.from(this.availableMCPTools).slice(0, 5).join(', ')}...`);
      throw new Error(`MCP tool '${toolName}' not available, falling back to REST`);
    }

    try {
      console.log(`🔧 Calling MCP tool: ${toolName}`, args);
      
      const result = await this.mcpClient.callTool({
        name: toolName,
        arguments: args,
      }) as MCPToolResult;

      console.log(`✅ MCP tool '${toolName}' succeeded`);

      // Parse JSON response from MCP tool
      const textContent = result.content.find(c => c.type === 'text')?.text;
      if (!textContent) {
        throw new Error('No text content in MCP response');
      }

      return JSON.parse(textContent);
    } catch (error: any) {
      // Log the error with helpful context
      console.error(`❌ MCP tool call failed (${toolName}):`, error.message || error);
      
      // If tool not found, suggest using REST fallback
      if (error.code === -32603 || error.message?.includes('Unknown tool')) {
        throw new Error(`MCP tool '${toolName}' not available, falling back to REST`);
      }
      
      throw error;
    }
  }
  
  /**
   * Get list of all available MCP tools (for debugging)
   */
  getAvailableMCPTools(): string[] {
    return Array.from(this.availableMCPTools).sort();
  }
  
  /**
   * Print MCP tool usage statistics
   */
  printMCPDebugInfo(): void {
    console.log('\n🔍 MCP Debug Information:');
    console.log(`Connected: ${this.mcpInitialized}`);
    console.log(`Tools available: ${this.availableMCPTools.size}`);
    console.log(`Mode: ${this.apiKey ? 'Pro' : 'Public'}`);
    console.log('\nAvailable tools:');
    this.getAvailableMCPTools().forEach((tool, idx) => {
      console.log(`  ${idx + 1}. ${tool}`);
    });
    console.log('');
  }

  /**
   * Get request headers with optional API key (REST API)
   */
  private getHeaders() {
    return this.apiKey
      ? { 'x-cg-pro-api-key': this.apiKey }
      : {};
  }

  /**
   * Get top coins by market cap (MCP-first, with REST fallback)
   */
  async getTopCoins(params?: {
    category?: string;
    limit?: number;
    vsCurrency?: string;
  }): Promise<CoinMarketData[]> {
    const {
      category,
      limit = 10,
      vsCurrency = 'usd'
    } = params || {};

    // Try MCP first (wait for init if needed)
    await this.ensureMCPReady();
    
    if (this.useMCP && this.mcpInitialized && this.isMCPToolAvailable('get_coins_markets')) {
      try {
        const mcpParams: Record<string, any> = {
          vs_currency: vsCurrency,
          per_page: limit,
          page: 1,
        };

        if (category) {
          mcpParams.category = category;
        }

        const response = await this.callMCPTool('get_coins_markets', mcpParams);
        return this.normalizeCoinMarketData(response);
      } catch (error) {
        console.warn('MCP call failed, falling back to REST:', error);
      }
    }

    // Fallback to REST API
    try {
      const url = `${this.baseUrl}/coins/markets`;
      const queryParams: any = {
        vs_currency: vsCurrency,
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: false,
      };

      if (category) {
        queryParams.category = category;
      }

      const response = await axios.get<CoinMarketData[]>(url, {
        params: queryParams,
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching top coins:', error);
      throw new Error('Failed to fetch market data from CoinGecko');
    }
  }

  /**
   * Get detailed information about a specific coin (MCP-first)
   */
  async getCoinDetails(coinId: string): Promise<CoinDetails> {
    // Try MCP first with correct tool name: get_id_coins
    if (this.useMCP && this.mcpInitialized && this.isMCPToolAvailable('get_id_coins')) {
      try {
        const response = await this.callMCPTool('get_id_coins', {
          id: coinId,
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        });

        return this.normalizeCoinDetails(response);
      } catch (error) {
        console.warn('MCP call failed for coin details, falling back to REST:', error);
      }
    }

    // Fallback to REST API
    try {
      const url = `${this.baseUrl}/coins/${coinId}`;
      const response = await axios.get<CoinDetails>(url, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching coin details for ${coinId}:`, error);
      throw new Error(`Coin '${coinId}' not found or API error`);
    }
  }

  /**
   * Search for coins by name or symbol (MCP-first)
   */
  async searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string }>> {
    // Try MCP first
    if (this.useMCP && this.mcpInitialized && this.isMCPToolAvailable('get_search')) {
      try {
        const response = await this.callMCPTool('get_search', {
          query: query,
        });

        return response.coins || [];
      } catch (error) {
        console.warn('MCP search failed, falling back to REST:', error);
      }
    }

    // Fallback to REST API
    try {
      const url = `${this.baseUrl}/search`;
      const response = await axios.get(url, {
        params: { query },
        headers: this.getHeaders(),
      });

      return response.data.coins || [];
    } catch (error) {
      console.error(`Error searching for ${query}:`, error);
      throw new Error('Failed to search coins');
    }
  }

  /**
   * Get trending coins (MCP-first)
   */
  async getTrendingCoins(): Promise<TrendingCoin[]> {
    // Try MCP first
    if (this.useMCP && this.mcpInitialized && this.isMCPToolAvailable('get_search_trending')) {
      try {
        const response = await this.callMCPTool('get_search_trending', {});
        return response.coins || [];
      } catch (error) {
        console.warn('MCP trending call failed, falling back to REST:', error);
      }
    }

    // Fallback to REST API
    try {
      const url = `${this.baseUrl}/search/trending`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
      });

      return response.data.coins || [];
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      throw new Error('Failed to fetch trending coins');
    }
  }

  /**
   * Get simple price for multiple coins (MCP-first)
   */
  async getSimplePrice(
    coinIds: string[],
    vsCurrencies: string[] = ['usd']
  ): Promise<Record<string, Record<string, number>>> {
    // Try MCP first
    if (this.useMCP && this.mcpInitialized && this.isMCPToolAvailable('get_simple_price')) {
      try {
        const response = await this.callMCPTool('get_simple_price', {
          ids: coinIds.join(','),
          vs_currencies: vsCurrencies.join(','),
          include_24hr_change: true,
        });

        return response;
      } catch (error) {
        console.warn('MCP simple price call failed, falling back to REST:', error);
      }
    }

    // Fallback to REST API
    try {
      const url = `${this.baseUrl}/simple/price`;
      const response = await axios.get(url, {
        params: {
          ids: coinIds.join(','),
          vs_currencies: vsCurrencies.join(','),
          include_24hr_change: true,
        },
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching simple price:', error);
      throw new Error('Failed to fetch price data');
    }
  }

  /**
   * Get top gainers and losers (MCP-specific feature)
   */
  async getTopGainersLosers(): Promise<{
    top_gainers: CoinMarketData[];
    top_losers: CoinMarketData[];
  }> {
    if (!this.useMCP || !this.mcpInitialized || !this.isMCPToolAvailable('get_coins_top_gainers_losers')) {
      throw new Error('Top gainers/losers requires MCP connection with get_coins_top_gainers_losers tool');
    }

    try {
      const response = await this.callMCPTool('get_coins_top_gainers_losers', {
        vs_currency: 'usd',
      });

      // Debug: Log response structure
      console.log('🔍 MCP Gainers/Losers response sample:', {
        hasTopGainers: !!response.top_gainers,
        gainersCount: response.top_gainers?.length || 0,
        firstGainer: response.top_gainers?.[0],
        hasTopLosers: !!response.top_losers,
        losersCount: response.top_losers?.length || 0,
        firstLoser: response.top_losers?.[0],
      });

      return {
        top_gainers: this.normalizeCoinMarketData(response.top_gainers || []),
        top_losers: this.normalizeCoinMarketData(response.top_losers || []),
      };
    } catch (error) {
      console.error('Error fetching top gainers/losers:', error);
      throw new Error('Failed to fetch top gainers/losers (requires Pro plan)');
    }
  }

  /**
   * Get coin OHLC data (MCP-specific feature)
   */
  async getCoinOHLC(
    coinId: string,
    vsCurrency: string = 'usd',
    days: number = 7
  ): Promise<Array<[number, number, number, number, number]>> {
    if (!this.useMCP || !this.mcpInitialized || !this.isMCPToolAvailable('get_range_coins_ohlc')) {
      throw new Error('OHLC data requires MCP connection with get_range_coins_ohlc tool');
    }

    try {
      const response = await this.callMCPTool('get_range_coins_ohlc', {
        id: coinId,
        vs_currency: vsCurrency,
        days: days,
      });

      return response;
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      throw new Error('Failed to fetch OHLC data');
    }
  }

  /**
   * Get coin market chart data (MCP-first)
   */
  async getCoinMarketChart(
    coinId: string,
    vsCurrency: string = 'usd',
    days: number = 7
  ): Promise<{
    prices: Array<[number, number]>;
    market_caps: Array<[number, number]>;
    total_volumes: Array<[number, number]>;
  }> {
    // Try MCP first
    if (this.useMCP && this.mcpInitialized && this.isMCPToolAvailable('get_range_coins_market_chart')) {
      try {
        const response = await this.callMCPTool('get_range_coins_market_chart', {
          id: coinId,
          vs_currency: vsCurrency,
          days: days,
        });

        return response;
      } catch (error) {
        console.warn('MCP market chart call failed, falling back to REST:', error);
      }
    }

    // Fallback to REST API
    try {
      const url = `${this.baseUrl}/coins/${coinId}/market_chart`;
      const response = await axios.get(url, {
        params: {
          vs_currency: vsCurrency,
          days: days,
        },
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching market chart:', error);
      throw new Error('Failed to fetch market chart data');
    }
  }

  /**
   * Format coin data for voice/text response (Spanish)
   */
  formatCoinResponse(coin: CoinMarketData, language: 'es' | 'en' = 'es'): string {
    // Handle undefined values from MCP responses
    const priceFormatted = coin.current_price 
      ? coin.current_price.toFixed(2) 
      : 'N/A';
    const change24h = coin.price_change_percentage_24h?.toFixed(2) || '0.00';
    const changeEmoji = parseFloat(change24h) >= 0 ? '📈' : '📉';
    const marketCapFormatted = coin.market_cap 
      ? this.formatLargeNumber(coin.market_cap)
      : 'N/A';

    if (language === 'es') {
      return (
        `${coin.name || 'Unknown'} (${coin.symbol?.toUpperCase() || 'N/A'})\n` +
        `💰 Precio: $${priceFormatted} USD\n` +
        `${changeEmoji} Cambio 24h: ${change24h}%\n` +
        `📊 Cap. de mercado: $${marketCapFormatted}\n` +
        `🏆 Ranking: #${coin.market_cap_rank || 'N/A'}`
      );
    } else {
      return (
        `${coin.name || 'Unknown'} (${coin.symbol?.toUpperCase() || 'N/A'})\n` +
        `💰 Price: $${priceFormatted} USD\n` +
        `${changeEmoji} 24h Change: ${change24h}%\n` +
        `📊 Market Cap: $${marketCapFormatted}\n` +
        `🏆 Rank: #${coin.market_cap_rank || 'N/A'}`
      );
    }
  }

  /**
   * Format large numbers (e.g., 1,900,000,000 → "1.9B")
   */
  private formatLargeNumber(num: number): string {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  }

  /**
   * Get RWA-specific tokens (MCP-first)
   */
  async getRWATokens(): Promise<CoinMarketData[]> {
    try {
      // Try to get from RWA category via MCP
      const coins = await this.getTopCoins({
        category: 'real-world-assets-rwa',
        limit: 10,
      });

      if (coins.length > 0) {
        return coins;
      }

      // Fallback to known RWA tokens
      return this.searchAndGetRWAFallback();
    } catch (error) {
      console.error('Error fetching RWA tokens:', error);
      return this.searchAndGetRWAFallback();
    }
  }

  /**
   * Fallback method to get RWA tokens by searching for known ones
   */
  private async searchAndGetRWAFallback(): Promise<CoinMarketData[]> {
    const knownRWATokens = [
      // Top RWA Platforms
      'ondo-finance', 'ondo-us-dollar-yield', 'mantra-dao', 'polymesh',
      'pyth-network', 'quant-network', 'reserve-rights-token', 'algorand',
      'origintrail', 'crossfi', 'stellar',
      
      // Stablecoins
      'usd-coin', 'tether', 'usd-yield-coin', 'paypal-usd',
      
      // Gold-backed
      'paxos-gold', 'tether-gold', 'matrixdock-gold',
      
      // Institutional
      'blackrock-usd-institutional-digital-liquidity-fund',
      'figure-heloc', 'goldfinch', 'creditcoin', 'provenance-blockchain',
      
      // Major cryptos (for comparison)
      'chainlink', 'ethereum', 'bitcoin',
    ];

    try {
      const coins = await this.getTopCoins({ limit: 200 });
      const rwaCoins = coins.filter(coin => knownRWATokens.includes(coin.id));
      return rwaCoins.slice(0, 10);
    } catch (error) {
      console.error('Fallback RWA search failed:', error);
      return [];
    }
  }

  /**
   * Normalize coin market data from MCP response
   */
  private normalizeCoinMarketData(data: any[]): CoinMarketData[] {
    return data.map(coin => ({
      id: coin.id || coin.coin_id || '',
      symbol: coin.symbol || '',
      name: coin.name || '',
      current_price: coin.current_price ?? coin.usd ?? coin.price ?? undefined,
      market_cap: coin.market_cap ?? coin.usd_market_cap ?? coin.market_cap_usd ?? undefined,
      market_cap_rank: coin.market_cap_rank ?? coin.market_cap_rank_24h ?? undefined,
      price_change_percentage_24h: coin.price_change_percentage_24h ?? coin.usd_24h_change ?? undefined,
      total_volume: coin.total_volume ?? coin.usd_24h_vol ?? coin.total_volume_24h ?? undefined,
      image: coin.image ?? coin.thumb ?? coin.large ?? undefined,
    }));
  }

  /**
   * Normalize coin details from MCP response
   */
  private normalizeCoinDetails(data: any): CoinDetails {
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      description: data.description || { en: '' },
      market_data: data.market_data,
      market_cap_rank: data.market_cap_rank,
      platforms: data.platforms,
      image: data.image,
      links: data.links,
    };
  }

  /**
   * Get MCP connection status with detailed info
   */
  getMCPStatus(): { 
    connected: boolean; 
    mode: string;
    toolCount: number;
    sampleTools: string[];
    endpoint: string;
    authenticated: boolean;
  } {
    return {
      connected: this.mcpInitialized,
      mode: this.useMCP ? 'MCP' : 'REST',
      toolCount: this.availableMCPTools.size,
      sampleTools: Array.from(this.availableMCPTools).slice(0, 10),
      endpoint: this.apiKey 
        ? 'mcp.pro-api.coingecko.com' 
        : 'mcp.api.coingecko.com',
      authenticated: !!this.apiKey,
    };
  }

  /**
   * Close MCP connection
   */
  async closeMCP(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.close();
      this.mcpClient = null;
      this.mcpInitialized = false;
    }
  }
}

const coinGeckoService = new CoinGeckoService();
export default coinGeckoService;
