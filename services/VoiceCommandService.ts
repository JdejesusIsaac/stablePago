// services/VoiceCommandService.ts - Enhanced with MCP & Market Data Features
import { ElevenLabsClient } from "elevenlabs";
import config from "@/config";

/** Address aliases for easy sending */
const ADDRESS_ALIASES: Record<string, `0x${string}`> = {
  grandma: "0x5C479D97997763A9fBaE700B42d1cE88AA8263Ea",
  // Add more aliases as needed
};

/** Supported wallet command types (expanded for MCP features) */
export type CommandType =
  // Wallet operations
  | "CREATE_WALLET"
  | "CHECK_BALANCE"
  | "SEND"
  | "GET_ADDRESS"
  | "GET_WALLET_ID"
  | "SWITCH_NETWORK"
  | "LIST_NETWORKS"
  | "CROSS_CHAIN_TRANSFER"
  // Trading operations
  | "SWAP"
  // Market data operations (NEW)
  | "RWA_QUERY"
  | "CHECK_PRICE"
  | "TOP_GAINERS_LOSERS"
  | "CHART_REQUEST"
  | "TRENDING_COINS"
  // General
  | "HELP"
  | "UNKNOWN";

/** Parsed command structure */
export interface ParsedCommand {
  type: CommandType;
  confidence: number; // 0-1 confidence score
  params?: {
    // Wallet params
    amount?: string;
    address?: string;
    alias?: string; // For address aliases like "grandma"
    network?: string;
    destinationNetwork?: string;
    // Trading params
    outputToken?: string;
    outputAmount?: string;
    maxUSDCIn?: string;
    // Market data params
    coinName?: string;
    query?: string;
    days?: string;
  };
  originalText: string;
  requiresConfirmation: boolean;
}

/** Transcription result with metadata */
export interface TranscriptionResult {
  text: string;
  languageCode?: string;
  duration?: number;
  confidence?: number;
}

/** Voice command processing result */
export interface VoiceCommandResult {
  command: ParsedCommand;
  transcription: TranscriptionResult;
  error?: string;
}

class VoiceCommandService {
  private elevenLabs: ElevenLabsClient;
  private readonly maxAudioSize = 25 * 1024 * 1024; // 25MB
  private readonly maxDuration = 300; // 5 minutes

  constructor() {
    const apiKey = config.elevenlabs?.apiKey;

    if (!apiKey) {
      throw new Error("ElevenLabs API key is required for voice commands");
    }

    this.elevenLabs = new ElevenLabsClient({
      apiKey,
    });
  }

  /**
   * Transcribe audio from URL
   */
  async transcribe(audioUrl: string, mimeType: string): Promise<TranscriptionResult> {
    try {
      // Validate audio before processing
      await this.validateAudio(audioUrl);

      // Fetch audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: mimeType });

      // Transcribe with ElevenLabs
      const result = await this.elevenLabs.speechToText.convert({
        file: audioBlob,
        model_id: "scribe_v1",
        tag_audio_events: false,
        language_code: undefined, // Auto-detect language
      });

      return {
        text: result.text || "",
        languageCode: result.language_code,
        confidence: result.language_probability,
      };
    } catch (error) {
      console.error("Transcription failed:", error);
      throw new Error(
        `Failed to transcribe audio: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Parse transcribed text into wallet command
   * Enhanced with market data and swap commands
   */
  parseCommand(text: string): ParsedCommand {
    const normalized = text.toLowerCase().trim();

    // Command patterns with priority order
    // IMPORTANT: Order matters! More specific patterns first, then general ones.
    // Financial operations → Market data → Wallet operations → Help
    const patterns: Array<{
      type: CommandType;
      pattern: RegExp;
      extract?: (match: RegExpMatchArray) => ParsedCommand["params"];
      requiresConfirmation: boolean;
    }> = [
      // ==========================================
      // FINANCIAL OPERATIONS (Highest Priority - Require Confirmation)
      // ==========================================

      // Send USDC with alias WITH amount (e.g., "send 10 to grandma")
      {
        type: "SEND",
        pattern: /(?:send|enviar|envia|envía|transfer)\s+(\d+\.?\d*)\s+(?:usdc\s+)?(?:to|a)\s+(grandma|abuela)/i,
        extract: (match) => {
          const alias = match[2].toLowerCase();
          const mappedAddress = alias === 'abuela' ? ADDRESS_ALIASES.grandma : ADDRESS_ALIASES[alias as keyof typeof ADDRESS_ALIASES];
          return {
            amount: match[1],
            address: mappedAddress,
            alias: match[2], // Store original alias for confirmation message
          };
        },
        requiresConfirmation: true,
      },

      // Send USDC with alias WITHOUT amount (e.g., "send to grandma")
      {
        type: "SEND",
        pattern: /(?:send|enviar|envia|envía|transfer)\s+(?:usdc\s+)?(?:to|a)\s+(grandma|abuela)/i,
        extract: (match) => {
          const alias = match[1].toLowerCase();
          const mappedAddress = alias === 'abuela' ? ADDRESS_ALIASES.grandma : ADDRESS_ALIASES[alias as keyof typeof ADDRESS_ALIASES];
          return {
            amount: "0.5", // Default small amount for testing
            address: mappedAddress,
            alias: match[1], // Store original alias for confirmation message
          };
        },
        requiresConfirmation: true,
      },

      // Send USDC with full address WITH amount
      {
        type: "SEND",
        pattern: /(?:send|enviar|envia|envía|transfer)\s+(\d+\.?\d*)\s+(?:usdc\s+)?(?:to|a)\s+(0x[a-f0-9]{40})/i,
        extract: (match) => ({
          amount: match[1],
          address: match[2] as `0x${string}`,
        }),
        requiresConfirmation: true,
      },

      // Cross-chain transfer (English)
      {
        type: "CROSS_CHAIN_TRANSFER",
        pattern:
          /(?:cross[- ]?chain|cctp|bridge|puente)\s+(\d+\.?\d*)\s+(?:usdc\s+)?(?:to|a)\s+([a-z\-\s]+)\s+(?:at|to|en)\s+(0x[a-f0-9]{40})/i,
        extract: (match) => ({
          amount: match[1],
          destinationNetwork: match[2].toUpperCase().replace(/\s+/g, "-"),
          address: match[3] as `0x${string}`,
        }),
        requiresConfirmation: true,
      },

      // Swap commands (English & Spanish)
      {
        type: "SWAP",
        pattern:
          /(?:swap|exchange|cambiar|intercambiar)\s+(?:for|por|to)?\s*(\d+\.?\d*)\s+([a-z]+)/i,
        extract: (match) => ({
          outputAmount: match[1],
          outputToken: match[2].toUpperCase(),
        }),
        requiresConfirmation: true,
      },
      {
        type: "SWAP",
        pattern:
          /(?:buy|comprar|get)\s+(?:some\s+)?(\d+\.?\d*)\s+([a-z]+)/i,
        extract: (match) => ({
          outputAmount: match[1],
          outputToken: match[2].toUpperCase(),
        }),
        requiresConfirmation: true,
      },
      // Swap by name (e.g., "swap for gold", "buy gold")
      {
        type: "SWAP",
        pattern:
          /(?:swap|exchange|cambiar|buy|comprar)\s+(?:for|por|to)?\s*(gold|oro|weth|eth|dai|uni)/i,
        extract: (match) => ({
          outputToken: match[1].toUpperCase(),
          outputAmount: "0.1", // Default small amount
        }),
        requiresConfirmation: true,
      },

      // ==========================================
      // MARKET DATA QUERIES (No Confirmation)
      // ==========================================

      // Top gainers/losers (English & Spanish) - MCP feature
      {
        type: "TOP_GAINERS_LOSERS",
        pattern:
          /(?:top|mejores|show|muestra|what|cuáles)\s+(?:gainers|losers|ganadores|perdedores|movers|subieron|bajaron)/i,
        requiresConfirmation: false,
      },
      {
        type: "TOP_GAINERS_LOSERS",
        pattern:
          /(?:which|qué|cuáles)\s+(?:coins|tokens|monedas)\s+(?:went up|went down|subieron|bajaron|gained|lost)/i,
        requiresConfirmation: false,
      },
      {
        type: "TOP_GAINERS_LOSERS",
        pattern:
          /(?:show|muestra|dime|tell me)\s+(?:me\s+)?(?:the\s+)?(?:top\s+)?(?:market\s+)?(?:movers|ganadores|perdedores|winners|losers)/i,
        requiresConfirmation: false,
      },

      // Chart requests (English & Spanish)
      {
        type: "CHART_REQUEST",
        pattern:
          /(?:show|muestra|get|obtener|display)\s+(?:me\s+)?(?:the\s+)?(?:chart|gráfico|graph)\s+(?:of|for|de|para)\s+([a-z]+)(?:\s+(\d+)\s+(?:days?|días?))?/i,
        extract: (match) => ({
          coinName: match[1],
          days: match[2] || "7",
        }),
        requiresConfirmation: false,
      },
      {
        type: "CHART_REQUEST",
        pattern:
          /([a-z]+)\s+(?:chart|gráfico|price chart|gráfico de precio)(?:\s+(\d+)\s+(?:days?|días?))?/i,
        extract: (match) => ({
          coinName: match[1],
          days: match[2] || "7",
        }),
        requiresConfirmation: false,
      },

      // Price checks (English & Spanish) - Multiple patterns for flexibility
      {
        type: "CHECK_PRICE",
        pattern:
          /(?:what(?:'s| is)|cuál es|how much is|cuánto (?:cuesta|vale))\s+(?:the\s+)?(?:price of|precio de)?\s+([a-z\s]+?)(?:\s+(?:today|now|ahora|hoy))?\s*$/i,
        extract: (match) => ({
          coinName: match[1].trim(),
        }),
        requiresConfirmation: false,
      },
      {
        type: "CHECK_PRICE",
        pattern:
          /(?:price|precio)\s+(?:of|de)\s+([a-z\s]+?)\s*$/i,
        extract: (match) => ({
          coinName: match[1].trim(),
        }),
        requiresConfirmation: false,
      },
      {
        type: "CHECK_PRICE",
        pattern:
          /^(?:the\s+)?(?:price|precio)\s+(?:of|de)\s+([a-z\s]+?)\s*$/i,
        extract: (match) => ({
          coinName: match[1].trim(),
        }),
        requiresConfirmation: false,
      },

      // Trending coins (English & Spanish)
      {
        type: "TRENDING_COINS",
        pattern:
          /(?:trending|tendencia|popular|moda|hot)\s+(?:coins|tokens|monedas|cryptos)/i,
        requiresConfirmation: false,
      },
      {
        type: "TRENDING_COINS",
        pattern:
          /(?:what(?:'s| is)|cuáles son|show me|muéstrame)\s+(?:the\s+)?(?:trending|populares|en tendencia)/i,
        requiresConfirmation: false,
      },

      // General RWA queries (English & Spanish) - Flexible patterns
      {
        type: "RWA_QUERY",
        pattern:
          /(?:list|lista|show|muestra|give me|dame)\s+(?:me\s+)?(?:the\s+)?(?:top|best|mejores|principales)?\s*(?:rwa|real world asset|activos reales)?\s*(?:tokens|coins|monedas)/i,
        extract: (match) => ({
          query: match[0],
        }),
        requiresConfirmation: false,
      },
      {
        type: "RWA_QUERY",
        pattern:
          /(?:top|best|mejores|principales)\s+(?:rwa|real world asset|activos)?\s*(?:tokens|coins|monedas)/i,
        extract: (match) => ({
          query: match[0],
        }),
        requiresConfirmation: false,
      },
      {
        type: "RWA_QUERY",
        pattern:
          /(?:gold|oro|silver|plata)\s+(?:tokens|backed|respaldados|en|on)/i,
        extract: (match) => ({
          query: match[0],
        }),
        requiresConfirmation: false,
      },
      {
        type: "RWA_QUERY",
        pattern:
          /(?:show|muestra|dime)\s+(?:me\s+)?(?:gold|oro)\s+(?:tokens|on|en)/i,
        extract: (match) => ({
          query: match[0],
        }),
        requiresConfirmation: false,
      },
      {
        type: "RWA_QUERY",
        pattern:
          /(?:tell me|dime|háblame|information|info)\s+(?:about|de|sobre)\s+([a-z\s]+)/i,
        extract: (match) => ({
          query: match[1].trim(),
        }),
        requiresConfirmation: false,
      },
      {
        type: "RWA_QUERY",
        pattern:
          /(?:what|qué|cuál|which)\s+(?:are|is|es|son)\s+(?:the\s+)?(?:rwa|activos)/i,
        extract: (match) => ({
          query: match[0],
        }),
        requiresConfirmation: false,
      },
      // Catch-all for RWA-related keywords (must be before wallet ops to avoid conflicts)
      {
        type: "RWA_QUERY",
        pattern:
          /\b(?:rwa|real world asset|activos reales|ondo|paxg|usyc|buidl|backed|respaldado)\b/i,
        extract: (match) => ({
          query: match.input || match[0], // Use full input text as query
        }),
        requiresConfirmation: false,
      },

      // ==========================================
      // WALLET OPERATIONS (No Confirmation)
      // ==========================================

      // Create wallet (English & Spanish)
      {
        type: "CREATE_WALLET",
        pattern: /(?:create|make|new|setup|crea|crear|nueva)\s+(?:a\s+)?(?:una\s+)?(?:wallet|billetera|cartera)/i,
        requiresConfirmation: false,
      },

      // Check balance (English & Spanish)
      {
        type: "CHECK_BALANCE",
        pattern: /(?:check|show|get)\s+(?:my\s+)?(?:wallet\s+)?(?:balance)/i,
        requiresConfirmation: false,
      },
      {
        type: "CHECK_BALANCE",
        pattern: /(?:what'?s|what\s+is)\s+(?:my\s+)?(?:wallet\s+)?(?:balance)/i,
        requiresConfirmation: false,
      },
      {
        type: "CHECK_BALANCE",
        pattern: /(?:ver|muestra|mostrar|revisa|revisar)\s+(?:mi\s+)?(?:wallet\s+)?(?:balance|saldo)/i,
        requiresConfirmation: false,
      },
      {
        type: "CHECK_BALANCE",
        pattern: /(?:how much|cuánto)\s+(?:usdc\s+)?(?:do\s+)?(?:i\s+)?(?:have|tengo)/i,
        requiresConfirmation: false,
      },

      // Get address (English & Spanish)
      {
        type: "GET_ADDRESS",
        pattern: /(?:show|get)\s+(?:my\s+)?(?:wallet\s+)?(?:address)/i,
        requiresConfirmation: false,
      },
      {
        type: "GET_ADDRESS",
        pattern: /(?:what'?s|what\s+is)\s+(?:my\s+)?(?:wallet\s+)?(?:address)/i,
        requiresConfirmation: false,
      },
      {
        type: "GET_ADDRESS",
        pattern: /(?:ver|muestra|mostrar)\s+(?:mi\s+)?(?:wallet\s+)?(?:dirección|address)/i,
        requiresConfirmation: false,
      },

      // Get wallet ID (English & Spanish)
      {
        type: "GET_WALLET_ID",
        pattern: /(?:show|get)\s+(?:my\s+)?wallet\s+(?:id|identification)/i,
        requiresConfirmation: false,
      },
      {
        type: "GET_WALLET_ID",
        pattern: /(?:what'?s|what\s+is)\s+(?:my\s+)?wallet\s+(?:id|identification)/i,
        requiresConfirmation: false,
      },
      {
        type: "GET_WALLET_ID",
        pattern: /(?:ver|muestra|mostrar)\s+(?:mi\s+)?wallet\s+(?:id|identification)/i,
        requiresConfirmation: false,
      },

      // Switch network (English & Spanish)
      {
        type: "SWITCH_NETWORK",
        pattern: /(?:switch|change|use|cambiar|usar)\s+(?:to\s+)?(?:network\s+)?([a-z\-\s]+)/i,
        extract: (match) => ({
          network: match[1].toUpperCase().replace(/\s+/g, "-"),
        }),
        requiresConfirmation: false,
      },

      // List networks (English & Spanish)
      {
        type: "LIST_NETWORKS",
        pattern: /(?:list|show|what|lista|listar|muestra|mostrar|cuáles)\s+(?:available\s+)?(?:me\s+)?(?:las\s+)?(?:networks|redes|cadenas)/i,
        requiresConfirmation: false,
      },

      // Help (English & Spanish)
      {
        type: "HELP",
        pattern: /^(?:help|ayuda|what\s+can\s+you\s+do|qué puedes hacer|commands|comandos)$/i,
        requiresConfirmation: false,
      },
    ];

    // Try to match patterns
    for (const { type, pattern, extract, requiresConfirmation } of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        return {
          type,
          confidence: this.calculateConfidence(normalized, pattern),
          params: extract ? extract(match) : undefined,
          originalText: text,
          requiresConfirmation,
        };
      }
    }

    // Unknown command
    return {
      type: "UNKNOWN",
      confidence: 0,
      originalText: text,
      requiresConfirmation: false,
    };
  }

  /**
   * Process voice message end-to-end
   */
  async processVoiceCommand(
    audioUrl: string,
    mimeType: string
  ): Promise<VoiceCommandResult> {
    try {
      // Transcribe audio
      const transcription = await this.transcribe(audioUrl, mimeType);

      // Parse command from transcript
      const command = this.parseCommand(transcription.text);

      // Validate command
      this.validateCommand(command);

      return {
        command,
        transcription,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return {
        command: {
          type: "UNKNOWN",
          confidence: 0,
          originalText: "",
          requiresConfirmation: false,
        },
        transcription: { text: "" },
        error: errorMsg,
      };
    }
  }

  /**
   * Validate audio file before processing
   */
  private async validateAudio(audioUrl: string): Promise<void> {
    try {
      const response = await fetch(audioUrl, { method: "HEAD" });
      const contentLength = response.headers.get("content-length");

      if (contentLength && parseInt(contentLength) > this.maxAudioSize) {
        throw new Error(
          `Audio file too large: ${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB. Maximum is ${this.maxAudioSize / 1024 / 1024}MB`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("too large")) {
        throw error;
      }
      // If HEAD request fails, continue (will fail later with better error)
      console.warn("Audio validation failed, continuing:", error);
    }
  }

  /**
   * Validate parsed command parameters
   */
  private validateCommand(command: ParsedCommand): void {
    // Validate SEND and CROSS_CHAIN_TRANSFER
    if (command.type === "SEND" || command.type === "CROSS_CHAIN_TRANSFER") {
      // Validate amount
      const amount = command.params?.amount;
      if (!amount) {
        throw new Error("Amount is required for send commands");
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }

      if (numAmount > 1000000) {
        throw new Error(`Amount too large: ${amount} USDC (max 1,000,000)`);
      }

      // Validate address
      const address = command.params?.address;
      if (!address || !address.match(/^0x[a-f0-9]{40}$/i)) {
        throw new Error(`Invalid Ethereum address: ${address}`);
      }
    }

    // Validate CROSS_CHAIN_TRANSFER
    if (command.type === "CROSS_CHAIN_TRANSFER") {
      const network = command.params?.destinationNetwork;
      if (!network) {
        throw new Error("Destination network is required for cross-chain transfers");
      }
    }

    // Validate SWAP
    if (command.type === "SWAP") {
      const token = command.params?.outputToken;
      if (!token) {
        throw new Error("Token name is required for swap");
      }

      // Validate supported tokens
      const supportedTokens = ["WETH", "ETH", "DAI", "UNI", "GOLD", "ORO"];
      if (!supportedTokens.includes(token.toUpperCase())) {
        throw new Error(
          `Unsupported token: ${token}. Supported: WETH, DAI, UNI, GOLD`
        );
      }

      // Validate amount if provided
      if (command.params?.outputAmount) {
        const amount = parseFloat(command.params.outputAmount);
        if (isNaN(amount) || amount <= 0) {
          throw new Error(`Invalid amount: ${command.params.outputAmount}`);
        }
      }
    }

    // Validate SWITCH_NETWORK
    if (command.type === "SWITCH_NETWORK") {
      const network = command.params?.network;
      if (!network) {
        throw new Error("Network name is required");
      }
    }

    // Validate CHART_REQUEST
    if (command.type === "CHART_REQUEST") {
      const coinName = command.params?.coinName;
      if (!coinName) {
        throw new Error("Coin name is required for chart");
      }

      // Validate days if provided
      if (command.params?.days) {
        const days = parseInt(command.params.days);
        if (isNaN(days) || days <= 0 || days > 365) {
          throw new Error(`Invalid days: ${command.params.days} (must be 1-365)`);
        }
      }
    }

    // Validate CHECK_PRICE
    if (command.type === "CHECK_PRICE") {
      const coinName = command.params?.coinName;
      if (!coinName) {
        throw new Error("Coin name is required for price check");
      }
    }
  }

  /**
   * Calculate confidence score for pattern match
   */
  private calculateConfidence(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    if (!match) return 0;

    // Base confidence from match
    let confidence = 0.7;

    // Boost confidence if entire text matches
    if (match[0].length === text.length) {
      confidence += 0.2;
    }

    // Boost confidence for clear numeric values
    if (match[0].match(/\d+\.?\d*/)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate user-friendly error message (bilingual)
   */
  getErrorMessage(error: string): string {
    if (error.includes("too large")) {
      return "🚫 Archivo de audio muy grande. Por favor envía un mensaje de voz más corto (máx 5 minutos).";
    }

    if (error.includes("transcribe")) {
      return "🎤 No pude entender el audio. Por favor habla claramente y verifica tu micrófono.";
    }

    if (error.includes("Invalid amount")) {
      return "💰 Cantidad inválida. Por favor di el monto claramente (ej: 'enviar 10 USDC').";
    }

    if (error.includes("Invalid Ethereum address")) {
      return "📍 Dirección de wallet inválida. Por favor proporciona una dirección Ethereum válida (0x...).";
    }

    if (error.includes("Unsupported token")) {
      return "❌ Token no soportado. Tokens disponibles: WETH, DAI, UNI, GOLD.";
    }

    if (error.includes("Coin name is required")) {
      return "❌ Nombre de moneda requerido. Por favor di el nombre claramente (ej: 'Bitcoin', 'ONDO').";
    }

    return "❌ Lo siento, no pude procesar ese comando de voz. Intenta escribir /help para ver comandos disponibles.";
  }

  /**
   * Generate command confirmation message (bilingual)
   */
  getConfirmationMessage(command: ParsedCommand): string {
    switch (command.type) {
      case "SEND":
        const recipientDisplay = command.params?.alias 
          ? `${command.params.alias} 👵 (${command.params.address})`
          : command.params?.address;
        return (
          `🔐 Confirmar Transacción\n\n` +
          `Enviar: ${command.params?.amount} USDC\n` +
          `A: ${recipientDisplay}\n\n` +
          `⚠️ Responde "CONFIRM" o "CONFIRMAR" en 30 segundos para proceder.\n` +
          `Esta acción no se puede deshacer.`
        );

      case "CROSS_CHAIN_TRANSFER":
        return (
          `🌉 Confirmar Transferencia Entre Cadenas\n\n` +
          `Cantidad: ${command.params?.amount} USDC\n` +
          `A Red: ${command.params?.destinationNetwork}\n` +
          `A Dirección: ${command.params?.address}\n\n` +
          `⚠️ Responde "CONFIRM" o "CONFIRMAR" en 30 segundos para proceder.\n` +
          `Las transferencias entre cadenas pueden tomar 10-20 minutos.`
        );

      case "SWAP":
        const token = command.params?.outputToken || "tokens";
        const amount = command.params?.outputAmount || "cantidad especificada";
        return (
          `💱 Confirmar Intercambio\n\n` +
          `Intercambiar por: ${amount} ${token}\n` +
          `Usando USDC de tu wallet\n\n` +
          `⚠️ Responde "CONFIRM" o "CONFIRMAR" en 30 segundos para proceder.\n` +
          `El precio puede variar ligeramente debido al slippage.`
        );

      default:
        return "Por favor confirma esta acción respondiendo 'CONFIRM' o 'CONFIRMAR'.";
    }
  }

  /**
   * Format command for display (bilingual)
   */
  formatCommand(command: ParsedCommand): string {
    switch (command.type) {
      case "CREATE_WALLET":
        return "📝 Creando una nueva wallet...";
      
      case "CHECK_BALANCE":
        return "💰 Revisando tu balance...";
      
      case "GET_ADDRESS":
        return "📍 Obteniendo tu dirección de wallet...";
      
      case "GET_WALLET_ID":
        return "🆔 Obteniendo tu Wallet ID...";
      
      case "SWITCH_NETWORK":
        return `🔄 Cambiando a ${command.params?.network}...`;
      
      case "LIST_NETWORKS":
        return "🌐 Listando redes disponibles...";
      
      case "SEND":
        return `💸 Preparando para enviar ${command.params?.amount} USDC...`;
      
      case "CROSS_CHAIN_TRANSFER":
        return `🌉 Preparando transferencia entre cadenas...`;
      
      case "SWAP":
        const token = command.params?.outputToken || "tokens";
        const amount = command.params?.outputAmount || "";
        return `💱 Preparando intercambio por ${amount} ${token}...`;
      
      // Market data commands
      case "CHECK_PRICE":
        return `💰 Consultando precio de ${command.params?.coinName}...`;
      
      case "TOP_GAINERS_LOSERS":
        return "📊 Obteniendo top ganadores y perdedores...";
      
      case "CHART_REQUEST":
        const days = command.params?.days || "7";
        return `📈 Obteniendo gráfico de ${command.params?.coinName} (${days} días)...`;
      
      case "TRENDING_COINS":
        return "🔥 Obteniendo monedas en tendencia...";
      
      case "RWA_QUERY":
        return "📊 Buscando información de tokens RWA...";
      
      case "HELP":
        return "📚 Aquí está lo que puedo hacer...";
      
      default:
        return "❓ No entendí ese comando.";
    }
  }

  /**
   * Get suggested follow-up questions based on command type
   */
  getSuggestedQuestions(command: ParsedCommand): string[] {
    switch (command.type) {
      case "CHECK_PRICE":
        return [
          "¿Quieres ver el gráfico?",
          "¿Te interesa comprar?",
          "¿Necesitas más información?"
        ];
      
      case "TOP_GAINERS_LOSERS":
        return [
          "¿Quieres ver detalles de alguna?",
          "¿Te interesa el gráfico?",
          "¿Quieres ver las tendencias?"
        ];
      
      case "CHART_REQUEST":
        return [
          "¿Quieres ver otro período?",
          "¿Te interesa el precio actual?",
          "¿Necesitas más información?"
        ];
      
      case "CHECK_BALANCE":
        return [
          "¿Quieres enviar USDC?",
          "¿Te interesa hacer un swap?",
          "¿Necesitas ver tu dirección?"
        ];
      
      case "SWAP":
        return [
          "¿Quieres ver el precio actual?",
          "¿Necesitas revisar tu balance?",
          "¿Te interesa otra transacción?"
        ];
      
      default:
        return [];
    }
  }
}

export default new VoiceCommandService();