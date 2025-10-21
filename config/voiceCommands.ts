// config/voiceCommands.ts

export const VOICE_COMMAND_CONFIG = {
  // ElevenLabs Configuration
  elevenlabs: {
    modelId: "scribe_v1",
    tagAudioEvents: false,
    autoDetectLanguage: true,
    supportedLanguages: [
      "eng", // English
      "spa", // Spanish
      "fra", // French
      "deu", // German
      "ita", // Italian
      "por", // Portuguese
      "rus", // Russian
      "jpn", // Japanese
      "kor", // Korean
      "cmn", // Mandarin Chinese
    ],
  },

  // Audio Validation
  validation: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxDuration: 300, // 5 minutes (seconds)
    minDuration: 1, // 1 second
    supportedMimeTypes: [
      "audio/ogg",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/m4a",
      "audio/mp4",
    ],
  },

  // Command Configuration
  commands: {
    confirmationTimeout: 30000, // 30 seconds
    minConfidenceThreshold: 0.5, // Commands below this confidence are rejected
    
    // Sensitive commands that require explicit confirmation
    requiresConfirmation: [
      "SEND",
      "CROSS_CHAIN_TRANSFER",
    ],

    // Commands that are always executed immediately
    safeCommands: [
      "CHECK_BALANCE",
      "GET_ADDRESS",
      "GET_WALLET_ID",
      "LIST_NETWORKS",
      "HELP",
    ],
  },

  // Rate Limiting
  rateLimiting: {
    enabled: true,
    maxVoiceMessagesPerMinute: 5,
    maxVoiceMessagesPerHour: 30,
    maxVoiceMessagesPerDay: 100,
  },

  // Security
  security: {
    // Patterns to detect and reject (privacy/security)
    prohibitedPatterns: [
      /private\s*key/gi,
      /seed\s*phrase/gi,
      /mnemonic/gi,
      /password/gi,
      /secret/gi,
    ],

    // Maximum amounts (USD value) for different operations
    transactionLimits: {
      singleTransaction: 10000, // $10,000 USDC per transaction
      dailyLimit: 50000, // $50,000 USDC per day
      crossChainLimit: 25000, // $25,000 USDC for cross-chain
    },

    // Require additional verification for amounts above these thresholds
    enhancedVerificationThreshold: 5000, // $5,000 USDC
  },

  // User Experience
  userExperience: {
    // Show transcription confidence to user
    showConfidence: false,
    
    // Show what language was detected
    showLanguageDetection: true,
    
    // Provide command suggestions on unknown commands
    suggestCommands: true,
    
    // Number of command suggestions to show
    maxSuggestions: 3,
  },

  // Monitoring & Analytics
  monitoring: {
    logTranscriptions: true,
    logCommands: true,
    logErrors: true,
    
    // Track these metrics
    metrics: [
      "transcription_duration",
      "command_parse_duration",
      "command_execution_duration",
      "transcription_confidence",
      "command_success_rate",
      "error_rate_by_type",
    ],
  },

  // Error Messages
  errorMessages: {
    audioTooLarge: "🚫 Audio file is too large. Please send a shorter voice message (max 5 minutes).",
    audioTooShort: "🚫 Audio is too short. Please speak for at least 1 second.",
    transcriptionFailed: "🎤 Could not understand the audio. Please try speaking clearly.",
    unsupportedFormat: "🚫 Audio format not supported. Please use voice messages or common audio formats.",
    rateLimitExceeded: "⏱️ You're sending too many voice messages. Please wait a moment.",
    lowConfidence: "❓ I'm not sure I understood correctly. Could you try again or use text commands?",
    prohibitedContent: "🚫 Your message contains sensitive information. Please don't share private keys or passwords.",
    amountTooLarge: "💰 Amount exceeds maximum limit. Please use a smaller amount.",
    networkError: "🌐 Network error. Please try again in a moment.",
    serviceUnavailable: "⚠️ Voice commands are temporarily unavailable. Please use text commands.",
  },

  // Command Aliases (for better natural language understanding)
  commandAliases: {
    CREATE_WALLET: [
      "create wallet",
      "make wallet",
      "new wallet",
      "setup wallet",
      "generate wallet",
      "initialize wallet",
    ],
    CHECK_BALANCE: [
      "check balance",
      "show balance",
      "my balance",
      "how much",
      "what's my balance",
      "balance check",
    ],
    GET_ADDRESS: [
      "my address",
      "wallet address",
      "show address",
      "get address",
      "what's my address",
      "where do I receive",
    ],
    SEND: [
      "send",
      "transfer",
      "pay",
      "move",
      "transmit",
    ],
    CROSS_CHAIN_TRANSFER: [
      "cross chain",
      "bridge",
      "cctp",
      "cross-chain",
      "transfer between",
    ],
    SWITCH_NETWORK: [
      "switch to",
      "change to",
      "use network",
      "set network",
    ],
    LIST_NETWORKS: [
      "list networks",
      "show networks",
      "available networks",
      "which networks",
      "what networks",
    ],
  },

  // Example Phrases (for /help command)
  examplePhrases: {
    CREATE_WALLET: [
      "Create a new wallet",
      "Make me a wallet",
      "Set up a wallet",
    ],
    CHECK_BALANCE: [
      "Check my balance",
      "How much USDC do I have?",
      "Show my balance",
    ],
    GET_ADDRESS: [
      "What's my wallet address?",
      "Show my address",
      "Where do I receive funds?",
    ],
    SEND: [
      "Send 10 USDC to 0x1234...",
      "Transfer 25.5 USDC to 0xabcd...",
      "Pay 100 USDC to 0x9876...",
    ],
    CROSS_CHAIN_TRANSFER: [
      "Bridge 50 USDC to Arbitrum at 0x1234...",
      "Cross-chain transfer 100 USDC to Base at 0xabcd...",
      "Send 75 USDC to Polygon using CCTP at 0x9876...",
    ],
    SWITCH_NETWORK: [
      "Switch to Base Sepolia",
      "Change to Arbitrum",
      "Use Polygon network",
    ],
  },
} as const;

export type VoiceCommandConfig = typeof VOICE_COMMAND_CONFIG;

// Environment variable validation
export function validateVoiceCommandEnvironment(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.ELEVENLABS_API_KEY) {
    errors.push("ELEVENLABS_API_KEY environment variable is required");
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    errors.push("TELEGRAM_BOT_TOKEN environment variable is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Export for use in config/index.ts
export default VOICE_COMMAND_CONFIG;