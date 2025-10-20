// services/TelegramService.ts
import  TelegramBot  from 'node-telegram-bot-api';
import config from "@/config";
import circleService from "./circleService"; // if you export a singleton + class
import storageService from "./storageService";
import networkService, { type NetworkKey } from "./networkService";
import { CCTP, type DomainKey } from "@/config/cctp";   

/** What we minimally expect from networkService.getCurrentNetwork() */
interface CurrentNetworkInfo {
  name: DomainKey | string;      // keep wide in case your current impl isn't narrowed yet
  isTestnet?: boolean;
  usdcAddress?: `0x${string}`;
  usdcTokenId?: string;
}

/** Stored wallet shape keyed by network name */
type WalletEntry = {
  walletId: string;
  address: `0x${string}`;
};
type UserWallets = Record<string, WalletEntry>; // keys are network names (e.g., "ARB-SEPOLIA")

const isNetworkKey = (value: string): value is NetworkKey => {
  const networks = networkService.getAllNetworks();
  return Object.prototype.hasOwnProperty.call(networks, value);
};

/** Storage service surface we rely on */
interface StorageService {
  getWallet(userId: string | number): UserWallets | undefined;
  saveWallet(userId: string | number, data: UserWallets): void;
}

/** Circle service surface we call (match your TS implementation) */
interface CircleSvc {
  init(): Promise<unknown>;
  createWallet(): Promise<{ walletId: string; walletData: { data: { wallets: { address: `0x${string}` }[] } } }>;
  getWalletBalance(walletId: string): Promise<{ usdc: string; network: string }>;
  sendTransaction(walletId: string, destinationAddress: `0x${string}`, amount: string): Promise<{ id: string }>;
  crossChainTransfer(params: {
    walletId: string;
    destinationNetwork: DomainKey | string;
    destinationAddress: `0x${string}`;
    amount: string;
    chatId: string | number;
    destinationWalletId: string;
  }): Promise<{ approveTx: string; burnTx: string; receiveTx: string }>;
}

class TelegramService {
  private bot: TelegramBot;
  private circleService: CircleSvc;
  private storage: StorageService;

  constructor() {
    if (!config?.telegram?.botToken) {
      throw new Error("Telegram bot token is missing");
    }
    this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
    this.circleService = circleService as unknown as CircleSvc;
    this.storage = storageService as unknown as StorageService;

    this.initializeCircleSDK().catch((error: unknown) => {
      console.error("Failed to initialize Circle SDK:", error);
    });
    this.setupCommands();
  }

  private async initializeCircleSDK(): Promise<void> {
    try {
      await this.circleService.init();
    } catch (error) {
      console.error("Error initializing Circle SDK:", error);
    }
  }

  private setupCommands(): void {
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/createWallet/, this.handleCreateWallet.bind(this));
    this.bot.onText(/\/balance/, this.handleBalance.bind(this));
    this.bot.onText(/\/send (.+)/, this.handleSend.bind(this));
    this.bot.onText(/\/address/, this.handleAddress.bind(this));
    this.bot.onText(/\/walletId/, this.handleWalletId.bind(this));
    this.bot.onText(/\/network (.+)/, this.handleNetwork.bind(this));
    this.bot.onText(/\/networks/, this.handleListNetworks.bind(this));
    this.bot.onText(/\/cctp (.+)/, this.handleCCTP.bind(this));
  }

  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const message =
      `Welcome to Circle Wallet Bot!\n\nCommands:\n` +
      `/createWallet - Create a wallet\n` +
      `/address - Get wallet address\n` +
      `/walletId - Get wallet ID\n` +
      `/balance - Check USDC balance\n` +
      `/send <address> <amount> - Send USDC\n` +
      `/network <network> - Switch network\n` +
      `/networks - List available networks\n` +
      `/cctp <destination-network> <address> <amount> - Cross-chain transfer`;
    await this.bot.sendMessage(chatId, message);
  }

  private async handleNetwork(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const chatId = msg.chat.id;
    const rawName = match?.[1]?.toUpperCase();
    if (!rawName) {
      await this.bot.sendMessage(chatId, `Usage: /network <name>`);
      return;
    }

    if (!isNetworkKey(rawName)) {
      await this.bot.sendMessage(chatId, `Error: Invalid network. Use /networks to see available networks.`);
      return;
    }

    try {
      const net = networkService.setNetwork(rawName);
      await this.bot.sendMessage(
        chatId,
        `Switched to network: ${net.name} ${net.isTestnet ? "(Testnet)" : ""}\n` +
          `USDC Address: ${net.usdcAddress ?? "N/A"}`
      );
    } catch {
      await this.bot.sendMessage(chatId, `Error: Invalid network. Use /networks to see available networks.`);
    }
  }

  private async handleListNetworks(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const nets = networkService.getAllNetworks() as Record<
      string,
      { name: string; isTestnet?: boolean }
    >;

    const networksMessage = Object.values(nets)
      .map((n) => `${n.name} ${n.isTestnet ? "(Testnet)" : ""}`)
      .join("\n");

    await this.bot.sendMessage(
      chatId,
      `Available networks:\n${networksMessage}\n\nUse /network <name> to switch networks`
    );
  }

  private async handleCreateWallet(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) return;

    const currentNetwork = networkService.getCurrentNetwork() as CurrentNetworkInfo;
    const networkName = String(currentNetwork.name);

    try {
      await this.circleService.init();
      const userWallets = this.storage.getWallet(userId) || {};

      if (userWallets[networkName]) {
        await this.bot.sendMessage(
          chatId,
          `You already have a wallet on ${networkName}!\n` +
            `Your wallet address: ${userWallets[networkName].address}\n\n` +
            `Use /network <network-name> to switch networks if you want to create a wallet on another network.`
        );
        return;
      }

      const walletResponse = await this.circleService.createWallet();
      const firstWallet = walletResponse?.walletData?.data?.wallets?.[0];
      if (!firstWallet) {
        throw new Error("Failed to create wallet - invalid response from Circle API");
      }

      this.storage.saveWallet(userId, {
        ...(this.storage.getWallet(userId) || {}),
        [networkName]: {
          walletId: walletResponse.walletId,
          address: firstWallet.address,
        },
      });

      await this.bot.sendMessage(
        chatId,
        `✅ Wallet created on ${networkName}!\nAddress: ${firstWallet.address}`
      );
    } catch (err: unknown) {
      console.error("Wallet creation error:", err);
      const errorMessage =
        (err as any)?.response?.data?.message || (err as any)?.message || "Unknown error occurred";
      await this.bot.sendMessage(chatId, `❌ Error creating wallet: ${errorMessage}\nPlease try again later.`);
    }
  }

  private async handleBalance(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) return;

    const currentNetworkName = String((networkService.getCurrentNetwork() as CurrentNetworkInfo).name);

    try {
      const wallets = this.storage.getWallet(userId);
      if (!wallets || !wallets[currentNetworkName]) {
        await this.bot.sendMessage(chatId, "Create a wallet first with /createWallet");
        return;
      }

      const balance = await this.circleService.getWalletBalance(wallets[currentNetworkName].walletId);
      await this.bot.sendMessage(chatId, `USDC Balance on ${balance.network}: ${balance.usdc} USDC`);
    } catch (err) {
      console.error("Error in handleBalance:", err);
      await this.bot.sendMessage(chatId, "Error getting balance. Try again later.");
    }
  }

  private async handleAddress(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) return;

    const currentNetworkName = String((networkService.getCurrentNetwork() as CurrentNetworkInfo).name);
    const wallets = this.storage.getWallet(userId);

    if (!wallets || !wallets[currentNetworkName]) {
      await this.bot.sendMessage(chatId, `No wallet found for ${currentNetworkName}. Create one with /createWallet`);
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `Wallet address on ${currentNetworkName}: ${wallets[currentNetworkName].address}`
    );
  }

  private async handleWalletId(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) return;

    const currentNetworkName = String((networkService.getCurrentNetwork() as CurrentNetworkInfo).name);
    const wallets = this.storage.getWallet(userId);

    if (!wallets || !wallets[currentNetworkName]) {
      await this.bot.sendMessage(chatId, `No wallet found for ${currentNetworkName}. Create one with /createWallet`);
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `Wallet ID on ${currentNetworkName}: ${wallets[currentNetworkName].walletId}`
    );
  }

  private async handleSend(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id ?? "");

    try {
      const currentNetworkName = String((networkService.getCurrentNetwork() as CurrentNetworkInfo).name);
      const wallets = this.storage.getWallet(userId);
      if (!wallets || !wallets[currentNetworkName]) {
        throw new Error(`No wallet found for ${currentNetworkName}. Please create a wallet first using /createWallet`);
      }

      const raw = match?.[1] ?? "";
      const parts = raw.split(" ").filter(Boolean);
      if (parts.length !== 2) {
        throw new Error("Invalid format. Use: /send <address> <amount>");
      }

      const [destinationAddress, amount] = parts as [`0x${string}`, string];

      await this.bot.sendMessage(chatId, `Processing transaction on ${currentNetworkName}...`);

      const txResponse = await this.circleService.sendTransaction(
        wallets[currentNetworkName].walletId,
        destinationAddress,
        amount
      );

      const message =
        `✅ Transaction submitted on ${currentNetworkName}!\n\n` +
        `Amount: ${amount} USDC\n` +
        `To: ${destinationAddress}\n` +
        `Transaction ID: ${txResponse.id}`;

      await this.bot.sendMessage(chatId, message);
    } catch (err: unknown) {
      console.error("Error sending transaction:", err);
      await this.bot.sendMessage(
        chatId,
        `❌ Error: ${(err as any)?.message ?? "Failed to send transaction. Please try again later."}`
      );
    }
  }

  private async handleCCTP(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id ?? "");

    try {
      const wallet = this.storage.getWallet(userId);
      if (!wallet) {
        await this.bot.sendMessage(chatId, "Create a wallet first with /createWallet");
        return;
      }

      const raw = match?.[1] ?? "";
      const parts = raw.split(" ").filter(Boolean);
      if (parts.length !== 3) {
        await this.bot.sendMessage(chatId, "Invalid format. Use: /cctp <destination-network> <address> <amount>");
        return;
      }

      const [destinationNetworkRaw, destinationAddressRaw, amount] = parts;
      const destinationNetwork = destinationNetworkRaw.toUpperCase();
      const destinationAddress = destinationAddressRaw as `0x${string}`;

      const currentNetwork = networkService.getCurrentNetwork() as CurrentNetworkInfo;
      const currentKey = String(currentNetwork.name);
      const userWallet = wallet[currentKey];

      if (!userWallet) {
        await this.bot.sendMessage(
          chatId,
          `No wallet found for ${currentKey}. Create one first with /createWallet`
        );
        return;
      }

      const destinationWallet = wallet[destinationNetwork];
      if (!destinationWallet) {
        await this.bot.sendMessage(
          chatId,
          `No wallet found for ${destinationNetwork}. Create one first with /createWallet`
        );
        return;
      }

      await this.bot.sendMessage(chatId, "Initiating cross-chain transfer...");
      const result = await this.circleService.crossChainTransfer({
        walletId: userWallet.walletId,
        destinationNetwork,
        destinationAddress,
        amount,
        chatId,
        destinationWalletId: destinationWallet.walletId,
      });

      const message =
        `✅ Cross-chain transfer initiated!\n\n` +
        `From: ${currentKey}\n` +
        `To: ${destinationNetwork}\n` +
        `Amount: ${amount} USDC\n` +
        `Recipient: ${destinationAddress}\n\n` +
        `Transactions:\n` +
        `Approve: ${result.approveTx}\n` +
        `Burn: ${result.burnTx}\n` +
        `Receive: ${result.receiveTx}`;

      await this.bot.sendMessage(chatId, message);
    } catch (err: unknown) {
      console.error("Error in CCTP transfer:", err);
      await this.bot.sendMessage(
        chatId,
        `❌ Error: ${(err as any)?.message ?? "Failed to execute cross-chain transfer"}`
      );
    }
  }
}

const telegramService = new TelegramService();
export default telegramService;
