// services/TelegramService.ts (Updated with Voice Commands)
import TelegramBot from 'node-telegram-bot-api';
import config from "@/config";
import circleService from "./circleService";
import storageService from "./storageService";
import networkService, { type NetworkKey } from "./networkService";
import voiceCommandService, { type ParsedCommand } from "./VoiceCommandService";
import { CCTP, type DomainKey } from "@/config/cctp";

interface CurrentNetworkInfo {
  name: DomainKey | string;
  isTestnet?: boolean;
  usdcAddress?: `0x${string}`;
  usdcTokenId?: string;
}

type WalletEntry = {
  walletId: string;
  address: `0x${string}`;
};
type UserWallets = Record<string, WalletEntry>;

const isNetworkKey = (value: string): value is NetworkKey => {
  const networks = networkService.getAllNetworks();
  return Object.prototype.hasOwnProperty.call(networks, value);
};

const isDomainKey = (value: string): value is DomainKey => {
  return Object.prototype.hasOwnProperty.call(CCTP.domains, value);
};

/** Pending confirmations for financial operations */
interface PendingConfirmation {
  command: ParsedCommand;
  expiresAt: number;
  chatId: number;
  messageId: number;
}

class TelegramService {
  private bot: TelegramBot;
  private pendingConfirmations: Map<number, PendingConfirmation>;
  private readonly confirmationTimeout = 30000; // 30 seconds

  constructor() {
    if (!config?.telegram?.botToken) {
      throw new Error("Telegram bot token is missing");
    }

    this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
    this.pendingConfirmations = new Map();

    this.initializeCircleSDK().catch((error: unknown) => {
      console.error("Failed to initialize Circle SDK:", error);
    });

    this.setupCommands();
    this.setupVoiceHandler();
    this.cleanupExpiredConfirmations();
  }

  private async initializeCircleSDK(): Promise<void> {
    try {
      await circleService.init();
    } catch (error) {
      console.error("Error initializing Circle SDK:", error);
    }
  }

  private setupCommands(): void {
    // Standard text commands
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/createWallet/, this.handleCreateWallet.bind(this));
    this.bot.onText(/\/balance/, this.handleBalance.bind(this));
    this.bot.onText(/\/send (.+)/, this.handleSend.bind(this));
    this.bot.onText(/\/address/, this.handleAddress.bind(this));
    this.bot.onText(/\/walletId/, this.handleWalletId.bind(this));
    this.bot.onText(/\/network (.+)/, this.handleNetwork.bind(this));
    this.bot.onText(/\/networks/, this.handleListNetworks.bind(this));
    this.bot.onText(/\/cctp (.+)/, this.handleCCTP.bind(this));

    // Handle non-command text messages (for confirmations only)
    // This runs AFTER command handlers, so commands take priority
    this.bot.on("message", this.handleTextMessage.bind(this));
  }

  /**
   * Setup voice message handler
   */
  private setupVoiceHandler(): void {
    this.bot.on("voice", async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;

      if (!userId) return;

      const voice = msg.voice;
      if (!voice) {
        await this.bot.sendMessage(
          chatId,
          "❌ Sorry, I couldn't access your voice message. Please try again."
        );
        return;
      }

      try {
        // Get voice file
        const file = await this.bot.getFile(voice.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${file.file_path}`;

        // Show processing message
        const processingMsg = await this.bot.sendMessage(
          chatId,
          "🎤 Processing your voice command..."
        );

        // Process voice command
        const result = await voiceCommandService.processVoiceCommand(
          fileUrl,
          voice.mime_type || "audio/ogg"
        );

        // Delete processing message
        await this.bot.deleteMessage(chatId, processingMsg.message_id);

        // Handle errors
        if (result.error) {
          await this.bot.sendMessage(
            chatId,
            voiceCommandService.getErrorMessage(result.error)
          );
          return;
        }

        // Show what was understood
        await this.bot.sendMessage(
          chatId,
          `📝 I heard: "${result.transcription.text}"\n\n` +
            voiceCommandService.formatCommand(result.command)
        );

        // Execute command
        await this.executeVoiceCommand(result.command, chatId, userId, msg.message_id);
      } catch (error) {
        console.error("Voice command error:", error);
        await this.bot.sendMessage(
          chatId,
          "❌ Sorry, I couldn't process your voice message. Please try again or use text commands."
        );
      }
    });
  }

  /**
   * Execute parsed voice command
   */
  private async executeVoiceCommand(
    command: ParsedCommand,
    chatId: number,
    userId: number,
    messageId: number
  ): Promise<void> {
    // Check if command requires confirmation
    if (command.requiresConfirmation) {
      await this.requestConfirmation(command, chatId, userId, messageId);
      return;
    }

    // Execute non-sensitive commands immediately
    switch (command.type) {
      case "CREATE_WALLET":
        await this.handleCreateWalletVoice(chatId, userId);
        break;

      case "CHECK_BALANCE":
        await this.handleBalanceVoice(chatId, userId);
        break;

      case "GET_ADDRESS":
        await this.handleAddressVoice(chatId, userId);
        break;

      case "GET_WALLET_ID":
        await this.handleWalletIdVoice(chatId, userId);
        break;

      case "SWITCH_NETWORK":
        if (command.params?.network) {
          await this.handleNetworkVoice(chatId, command.params.network);
        }
        break;

      case "LIST_NETWORKS":
        await this.handleListNetworksVoice(chatId);
        break;

      case "HELP":
        await this.handleHelpVoice(chatId);
        break;

      case "UNKNOWN":
        await this.bot.sendMessage(
          chatId,
          "❓ I didn't understand that command.\n\n" +
            "Try saying things like:\n" +
            "• 'Create a wallet'\n" +
            "• 'Check my balance'\n" +
            "• 'Show my address'\n" +
            "• 'Send 10 USDC to 0x...'\n\n" +
            "Or type /help for all commands."
        );
        break;
    }
  }

  /**
   * Request confirmation for sensitive operations
   */
  private async requestConfirmation(
    command: ParsedCommand,
    chatId: number,
    userId: number,
    messageId: number
  ): Promise<void> {
    // Store pending confirmation
    this.pendingConfirmations.set(userId, {
      command,
      expiresAt: Date.now() + this.confirmationTimeout,
      chatId,
      messageId,
    });

    // Send confirmation request
    await this.bot.sendMessage(
      chatId,
      voiceCommandService.getConfirmationMessage(command)
    );

    // Auto-cleanup after timeout
    setTimeout(() => {
      if (this.pendingConfirmations.has(userId)) {
        this.pendingConfirmations.delete(userId);
        this.bot.sendMessage(
          chatId,
          "⏱️ Confirmation timeout. Command cancelled for your security."
        );
      }
    }, this.confirmationTimeout);
  }

  /**
   * Handle text messages for confirmations
   * Only processes non-command messages when there's a pending confirmation
   */
  private async handleTextMessage(msg: TelegramBot.Message): Promise<void> {
    const userId = msg.from?.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!userId || !text) return;

    // Ignore commands (they're handled by onText handlers)
    if (text.startsWith('/')) return;

    // Ignore voice messages (handled separately)
    if (msg.voice) return;

    // Check for pending confirmation
    const pending = this.pendingConfirmations.get(userId);
    if (!pending) return; // No pending confirmation, ignore message

    const upperText = text.toUpperCase();

    // Check if confirmation expired
    if (Date.now() > pending.expiresAt) {
      this.pendingConfirmations.delete(userId);
      await this.bot.sendMessage(chatId, "⏱️ Confirmation expired. Please try again.");
      return;
    }

    // Handle confirmation response
    if (upperText === "CONFIRM") {
      this.pendingConfirmations.delete(userId);
      await this.bot.sendMessage(chatId, "✅ Confirmed. Processing...");
      await this.executeConfirmedCommand(pending.command, chatId, userId);
    } else if (upperText === "CANCEL") {
      this.pendingConfirmations.delete(userId);
      await this.bot.sendMessage(chatId, "❌ Command cancelled.");
    }
    // Ignore other text when waiting for confirmation
  }

  /**
   * Execute confirmed sensitive command
   */
  private async executeConfirmedCommand(
    command: ParsedCommand,
    chatId: number,
    userId: number
  ): Promise<void> {
    try {
      switch (command.type) {
        case "SEND":
          if (
            command.params?.amount &&
            command.params?.address &&
            this.isHexAddress(command.params.address)
          ) {
            await this.executeSend(
              chatId,
              userId,
              command.params.address,
              command.params.amount
            );
          }
          break;

        case "CROSS_CHAIN_TRANSFER":
          if (
            command.params?.amount &&
            command.params?.address &&
            this.isHexAddress(command.params.address)
          ) {
            const destinationNetwork = command.params.destinationNetwork?.toUpperCase();
            if (!destinationNetwork || !isDomainKey(destinationNetwork)) {
              await this.bot.sendMessage(
                chatId,
                `❌ Unsupported destination network: ${command.params?.destinationNetwork ?? "unknown"}`
              );
              break;
            }

            await this.executeCCTP(
              chatId,
              userId,
              destinationNetwork,
              command.params.address,
              command.params.amount
            );
          }
          break;
      }
    } catch (error) {
      console.error("Confirmed command execution error:", error);
      await this.bot.sendMessage(
        chatId,
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Voice command implementations
   */

  private async handleCreateWalletVoice(chatId: number, userId: number): Promise<void> {
    const currentNetwork = networkService.getCurrentNetwork() as CurrentNetworkInfo;
    const networkName = String(currentNetwork.name);

    try {
      await circleService.init();
      const userWallets = storageService.getWallet(userId) || {};

      if (userWallets[networkName]) {
        await this.bot.sendMessage(
          chatId,
          `✅ You already have a wallet on ${networkName}!\n` +
            `Address: ${userWallets[networkName].address}`
        );
        return;
      }

      const walletResponse = await circleService.createWallet();
      const firstWallet = walletResponse?.walletData?.data?.wallets?.[0];

      if (!firstWallet) {
        throw new Error("Failed to create wallet");
      }

      storageService.saveWallet(userId, {
        ...(storageService.getWallet(userId) || {}),
        [networkName]: {
          walletId: walletResponse.walletId,
          address: firstWallet.address,
        },
      });

      await this.bot.sendMessage(
        chatId,
        `✅ Wallet created on ${networkName}!\n\n` +
          `📍 Address: ${firstWallet.address}\n\n` +
          `You can now receive and send USDC!`
      );
    } catch (error) {
      console.error("Create wallet error:", error);
      await this.bot.sendMessage(chatId, "❌ Failed to create wallet. Please try again.");
    }
  }

  private async handleBalanceVoice(chatId: number, userId: number): Promise<void> {
    const currentNetworkName = String(
      (networkService.getCurrentNetwork() as CurrentNetworkInfo).name
    );

    try {
      const wallets = storageService.getWallet(userId);
      if (!wallets || !wallets[currentNetworkName]) {
        await this.bot.sendMessage(
          chatId,
          "❌ No wallet found. Say 'create a wallet' first."
        );
        return;
      }

      const balance = await circleService.getWalletBalance(
        wallets[currentNetworkName].walletId
      );
      await this.bot.sendMessage(
        chatId,
        `💰 Balance on ${balance.network}:\n\n` +
          `${balance.usdc} USDC`
      );
    } catch (error) {
      console.error("Balance error:", error);
      await this.bot.sendMessage(chatId, "❌ Error getting balance. Try again later.");
    }
  }

  private async handleAddressVoice(chatId: number, userId: number): Promise<void> {
    const currentNetworkName = String(
      (networkService.getCurrentNetwork() as CurrentNetworkInfo).name
    );
    const wallets = storageService.getWallet(userId);

    if (!wallets || !wallets[currentNetworkName]) {
      await this.bot.sendMessage(
        chatId,
        `❌ No wallet found for ${currentNetworkName}. Say 'create a wallet' first.`
      );
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `📍 Your wallet address on ${currentNetworkName}:\n\n` +
        `\`${wallets[currentNetworkName].address}\``,
      { parse_mode: "Markdown" }
    );
  }

  private async handleWalletIdVoice(chatId: number, userId: number): Promise<void> {
    const currentNetworkName = String(
      (networkService.getCurrentNetwork() as CurrentNetworkInfo).name
    );
    const wallets = storageService.getWallet(userId);

    if (!wallets || !wallets[currentNetworkName]) {
      await this.bot.sendMessage(
        chatId,
        `❌ No wallet found for ${currentNetworkName}.`
      );
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `🆔 Your wallet ID on ${currentNetworkName}:\n\n` +
        `\`${wallets[currentNetworkName].walletId}\``,
      { parse_mode: "Markdown" }
    );
  }

  private async handleNetworkVoice(chatId: number, networkName: string): Promise<void> {
    const upper = networkName.toUpperCase();

    if (!isNetworkKey(upper)) {
      await this.bot.sendMessage(
        chatId,
        `❌ Invalid network: ${networkName}\n\nSay "list networks" to see available options.`
      );
      return;
    }

    try {
      const net = networkService.setNetwork(upper);
      await this.bot.sendMessage(
        chatId,
        `✅ Switched to ${net.name} ${net.isTestnet ? "(Testnet)" : ""}\n\n` +
          `USDC Address: ${net.usdcAddress ?? "N/A"}`
      );
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error switching network: ${networkName}`);
    }
  }

  private async handleListNetworksVoice(chatId: number): Promise<void> {
    const nets = networkService.getAllNetworks() as Record<
      string,
      { name: string; isTestnet?: boolean }
    >;

    const networksList = Object.values(nets)
      .map((n) => `• ${n.name} ${n.isTestnet ? "(Testnet)" : ""}`)
      .join("\n");

    await this.bot.sendMessage(
      chatId,
      `🌐 Available networks:\n\n${networksList}\n\n` +
        `Say "switch to [network]" to change networks.`
    );
  }

  private async handleHelpVoice(chatId: number): Promise<void> {
    await this.bot.sendMessage(
      chatId,
      `🎙️ Voice Commands:\n\n` +
        `💬 Just say what you want to do!\n\n` +
        `Examples:\n` +
        `• "Create a wallet"\n` +
        `• "Check my balance"\n` +
        `• "Show my address"\n` +
        `• "Send 10 USDC to 0x..."\n` +
        `• "Switch to Base Sepolia"\n` +
        `• "List networks"\n\n` +
        `💡 For cross-chain transfers:\n` +
        `"Bridge 50 USDC to Arbitrum at 0x..."\n\n` +
        `🔐 Financial operations require confirmation for security.`
    );
  }

  /**
   * Execute send transaction
   */
  private async executeSend(
    chatId: number,
    userId: number,
    destinationAddress: `0x${string}`,
    amount: string
  ): Promise<void> {
    const currentNetworkName = String(
      (networkService.getCurrentNetwork() as CurrentNetworkInfo).name
    );
    const wallets = storageService.getWallet(userId);

    if (!wallets || !wallets[currentNetworkName]) {
      throw new Error(`No wallet found for ${currentNetworkName}`);
    }

    await this.bot.sendMessage(chatId, `Processing transaction on ${currentNetworkName}...`);

    const txResponse = await circleService.sendTransaction(
      wallets[currentNetworkName].walletId,
      destinationAddress,
      amount
    );

    await this.bot.sendMessage(
      chatId,
      `✅ Transaction submitted!\n\n` +
        `Amount: ${amount} USDC\n` +
        `To: ${destinationAddress}\n` +
        `Transaction ID: ${txResponse.id}`
    );
  }

  private isHexAddress(address: string): address is `0x${string}` {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  /**
   * Execute CCTP transfer
   */
  private async executeCCTP(
    chatId: number,
    userId: number,
    destinationNetwork: DomainKey,
    destinationAddress: `0x${string}`,
    amount: string
  ): Promise<void> {
    const wallet = storageService.getWallet(userId);
    if (!wallet) {
      throw new Error("No wallet found");
    }

    const currentNetwork = networkService.getCurrentNetwork() as CurrentNetworkInfo;
    const currentKey = String(currentNetwork.name);
    const userWallet = wallet[currentKey];

    if (!userWallet) {
      throw new Error(`No wallet found for ${currentKey}`);
    }

    const destinationWallet = wallet[destinationNetwork];
    if (!destinationWallet) {
      throw new Error(
        `No wallet found for ${destinationNetwork}. Create one first with "create wallet".`
      );
    }

    await this.bot.sendMessage(chatId, "🌉 Initiating cross-chain transfer...");

    const result = await circleService.crossChainTransfer({
      walletId: userWallet.walletId,
      destinationNetwork,
      destinationAddress,
      amount,
      chatId,
      destinationWalletId: destinationWallet.walletId,
    });

    await this.bot.sendMessage(
      chatId,
      `✅ Cross-chain transfer complete!\n\n` +
        `From: ${currentKey}\n` +
        `To: ${destinationNetwork}\n` +
        `Amount: ${amount} USDC\n\n` +
        `Transactions:\n` +
        `Approve: ${result.approveTx}\n` +
        `Burn: ${result.burnTx}\n` +
        `Receive: ${result.receiveTx}`
    );
  }

  /**
   * Cleanup expired confirmations periodically
   */
  private cleanupExpiredConfirmations(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [userId, pending] of this.pendingConfirmations.entries()) {
        if (now > pending.expiresAt) {
          this.pendingConfirmations.delete(userId);
        }
      }
    }, 60000); // Cleanup every minute
  }

  // Original command handlers remain the same
  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const message =
      `Welcome to Circle Wallet Bot! 🎙️\n\n` +
      `Choose your preferred method:\n\n` +
      `💬 **Text Commands:**\n` +
      `/createWallet - Create a wallet\n` +
      `/address - Get wallet address\n` +
      `/balance - Check USDC balance\n` +
      `/send <address> <amount> - Send USDC\n` +
      `/network <network> - Switch network\n` +
      `/networks - List networks\n` +
      `/cctp <network> <address> <amount> - Cross-chain transfer\n\n` +
      `🎤 **OR use voice messages:**\n` +
      `"Create a wallet"\n` +
      `"Check my balance"\n` +
      `"Send 10 USDC to 0x..."\n\n` +
      `👆 Both work the same way - use whatever you prefer!`;

    await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  }

  // Keep all original handlers (handleCreateWallet, handleBalance, etc.)
  // ... [rest of the original implementation]

  private async handleCreateWallet(msg: TelegramBot.Message): Promise<void> {
    await this.handleCreateWalletVoice(msg.chat.id, msg.from?.id || 0);
  }

  private async handleBalance(msg: TelegramBot.Message): Promise<void> {
    await this.handleBalanceVoice(msg.chat.id, msg.from?.id || 0);
  }

  private async handleAddress(msg: TelegramBot.Message): Promise<void> {
    await this.handleAddressVoice(msg.chat.id, msg.from?.id || 0);
  }

  private async handleWalletId(msg: TelegramBot.Message): Promise<void> {
    await this.handleWalletIdVoice(msg.chat.id, msg.from?.id || 0);
  }

  private async handleNetwork(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const chatId = msg.chat.id;
    const rawName = match?.[1]?.toUpperCase();
    if (!rawName) {
      await this.bot.sendMessage(chatId, `Usage: /network <name>`);
      return;
    }
    await this.handleNetworkVoice(chatId, rawName);
  }

  private async handleListNetworks(msg: TelegramBot.Message): Promise<void> {
    await this.handleListNetworksVoice(msg.chat.id);
  }

  private async handleSend(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id ?? "");

    try {
      const raw = match?.[1] ?? "";
      const parts = raw.split(" ").filter(Boolean);
      if (parts.length !== 2) {
        throw new Error("Invalid format. Use: /send <address> <amount>");
      }

      const [destinationAddress, amount] = parts as [`0x${string}`, string];
      await this.executeSend(chatId, Number(userId), destinationAddress, amount);
    } catch (error: unknown) {
      console.error("Error sending transaction:", error);
      await this.bot.sendMessage(
        chatId,
        `❌ Error: ${(error as any)?.message ?? "Failed to send transaction"}`
      );
    }
  }

  private async handleCCTP(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id ?? "");

    try {
      const raw = match?.[1] ?? "";
      const parts = raw.split(" ").filter(Boolean);
      if (parts.length !== 3) {
        await this.bot.sendMessage(chatId, "Invalid format. Use: /cctp <network> <address> <amount>");
        return;
      }

      const [destinationNetwork, destinationAddress, amount] = parts;
      const upperNetwork = destinationNetwork.toUpperCase();

      if (!isDomainKey(upperNetwork)) {
        await this.bot.sendMessage(
          chatId,
          `❌ Unsupported destination network: ${destinationNetwork}.`
        );
        return;
      }

      await this.executeCCTP(
        chatId,
        Number(userId),
        upperNetwork,
        destinationAddress as `0x${string}`,
        amount
      );
    } catch (error: unknown) {
      console.error("Error in CCTP transfer:", error);
      await this.bot.sendMessage(
        chatId,
        `❌ Error: ${(error as any)?.message ?? "Failed to execute cross-chain transfer"}`
      );
    }
  }
}

const telegramService = new TelegramService();
export default telegramService;
