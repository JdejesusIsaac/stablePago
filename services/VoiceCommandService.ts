// services/VoiceCommandService.ts
import { ElevenLabsClient } from "elevenlabs";
import config from "@/config";
import { VOICE_COMMAND_CONFIG } from "../config/voiceCommands";

/** Supported wallet command types */
export type CommandType =
  | "CREATE_WALLET"
  | "CHECK_BALANCE"
  | "SEND"
  | "GET_ADDRESS"
  | "GET_WALLET_ID"
  | "SWITCH_NETWORK"
  | "LIST_NETWORKS"
  | "CROSS_CHAIN_TRANSFER"
  | "HELP"
  | "UNKNOWN";

/** Parsed command structure */
export interface ParsedCommand {
  type: CommandType;
  confidence: number; // 0-1 confidence score
  params?: {
    amount?: string;
    address?: string;
    network?: string;
    destinationNetwork?: string;
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
   */
  parseCommand(text: string): ParsedCommand {
    const normalized = text.toLowerCase().trim();

    // Command patterns with priority order
    const patterns: Array<{
      type: CommandType;
      pattern: RegExp;
      extract?: (match: RegExpMatchArray) => ParsedCommand["params"];
      requiresConfirmation: boolean;
    }> = [
      // Send USDC (most specific first)
      {
        type: "SEND",
        pattern: /send\s+(\d+\.?\d*)\s+usdc\s+to\s+(0x[a-f0-9]{40})/i,
        extract: (match) => ({
          amount: match[1],
          address: match[2] as `0x${string}`,
        }),
        requiresConfirmation: true,
      },
      {
        type: "SEND",
        pattern: /transfer\s+(\d+\.?\d*)\s+usdc\s+to\s+(0x[a-f0-9]{40})/i,
        extract: (match) => ({
          amount: match[1],
          address: match[2] as `0x${string}`,
        }),
        requiresConfirmation: true,
      },

      // Cross-chain transfer
      {
        type: "CROSS_CHAIN_TRANSFER",
        pattern:
          /(?:cross[- ]?chain|cctp|bridge)\s+(\d+\.?\d*)\s+usdc\s+to\s+([a-z\-]+)\s+(?:at|to)\s+(0x[a-f0-9]{40})/i,
        extract: (match) => ({
          amount: match[1],
          destinationNetwork: match[2].toUpperCase().replace(/\s+/g, "-"),
          address: match[3] as `0x${string}`,
        }),
        requiresConfirmation: true,
      },

      // Create wallet
      {
        type: "CREATE_WALLET",
        pattern: /(?:create|make|new|setup)\s+(?:a\s+)?wallet/i,
        requiresConfirmation: false,
      },

      // Check balance
      {
        type: "CHECK_BALANCE",
        pattern: /(?:check|show|what'?s|get)\s+(?:my\s+)?balance/i,
        requiresConfirmation: false,
      },
      {
        type: "CHECK_BALANCE",
        pattern: /how\s+much\s+(?:usdc\s+)?(?:do\s+)?i\s+have/i,
        requiresConfirmation: false,
      },

      // Get address
      {
        type: "GET_ADDRESS",
        pattern: /(?:show|get|what'?s)\s+(?:my\s+)?(?:wallet\s+)?address/i,
        requiresConfirmation: false,
      },

      // Get wallet ID
      {
        type: "GET_WALLET_ID",
        pattern: /(?:show|get|what'?s)\s+(?:my\s+)?wallet\s+id/i,
        requiresConfirmation: false,
      },

      // Switch network
      {
        type: "SWITCH_NETWORK",
        pattern: /(?:switch|change|use)\s+(?:to\s+)?(?:network\s+)?([a-z\-]+)/i,
        extract: (match) => ({
          network: match[1].toUpperCase().replace(/\s+/g, "-"),
        }),
        requiresConfirmation: false,
      },

      // List networks
      {
        type: "LIST_NETWORKS",
        pattern: /(?:list|show|what)\s+(?:available\s+)?networks/i,
        requiresConfirmation: false,
      },

      // Help
      {
        type: "HELP",
        pattern: /^(?:help|what\s+can\s+you\s+do|commands)$/i,
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

    if (command.type === "CROSS_CHAIN_TRANSFER") {
      const network = command.params?.destinationNetwork;
      if (!network) {
        throw new Error("Destination network is required for cross-chain transfers");
      }
    }

    if (command.type === "SWITCH_NETWORK") {
      const network = command.params?.network;
      if (!network) {
        throw new Error("Network name is required");
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
   * Generate user-friendly error message
   */
  getErrorMessage(error: string): string {
    if (error.includes("too large")) {
      return "🚫 Audio file is too large. Please send a shorter voice message (max 5 minutes).";
    }

    if (error.includes("transcribe")) {
      return "🎤 Could not understand the audio. Please try speaking clearly and check your microphone.";
    }

    if (error.includes("Invalid amount")) {
      return "💰 Invalid amount specified. Please say the amount clearly (e.g., 'send 10 USDC').";
    }

    if (error.includes("Invalid Ethereum address")) {
      return "📍 Invalid wallet address. Please provide a valid Ethereum address (0x...).";
    }

    return "❌ Sorry, I couldn't process that voice command. Try typing /help for available commands.";
  }

  /**
   * Generate command confirmation message
   */
  getConfirmationMessage(command: ParsedCommand): string {
    switch (command.type) {
      case "SEND":
        return (
          `🔐 Confirm Transaction\n\n` +
          `Send: ${command.params?.amount} USDC\n` +
          `To: ${command.params?.address}\n\n` +
          `⚠️ Reply "CONFIRM" within 30 seconds to proceed.\n` +
          `This action cannot be undone.`
        );

      case "CROSS_CHAIN_TRANSFER":
        return (
          `🌉 Confirm Cross-Chain Transfer\n\n` +
          `Amount: ${command.params?.amount} USDC\n` +
          `To Network: ${command.params?.destinationNetwork}\n` +
          `To Address: ${command.params?.address}\n\n` +
          `⚠️ Reply "CONFIRM" within 30 seconds to proceed.\n` +
          `Cross-chain transfers may take 10-20 minutes.`
        );

      default:
        return "Please confirm this action by replying 'CONFIRM'.";
    }
  }

  /**
   * Format command for display
   */
  formatCommand(command: ParsedCommand): string {
    switch (command.type) {
      case "CREATE_WALLET":
        return "📝 Creating a new wallet...";
      case "CHECK_BALANCE":
        return "💰 Checking your balance...";
      case "GET_ADDRESS":
        return "📍 Getting your wallet address...";
      case "GET_WALLET_ID":
        return "🆔 Getting your wallet ID...";
      case "SWITCH_NETWORK":
        return `🔄 Switching to ${command.params?.network}...`;
      case "LIST_NETWORKS":
        return "🌐 Listing available networks...";
      case "SEND":
        return `💸 Preparing to send ${command.params?.amount} USDC...`;
      case "CROSS_CHAIN_TRANSFER":
        return `🌉 Preparing cross-chain transfer...`;
      case "HELP":
        return "📚 Here's what I can do...";
      default:
        return "❓ I didn't understand that command.";
    }
  }
}

export default new VoiceCommandService();