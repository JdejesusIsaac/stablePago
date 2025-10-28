// services/TelegramService.ts - Updated with MCP-Enhanced RWA Features
import TelegramBot from 'node-telegram-bot-api';
import config from "@/config";
import circleService from "./circleService";
import storageService from "./storageService";
import networkService, { type NetworkKey } from "./networkService";
import voiceCommandService, { type ParsedCommand } from "./VoiceCommandService";
import swapService from "./SwapService";
import coinGeckoService from "./CoinGeckoService";
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
    // Wallet commands
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/createWallet/, this.handleCreateWallet.bind(this));
    this.bot.onText(/\/balance/, this.handleBalance.bind(this));
    this.bot.onText(/\/send (.+)/, this.handleSend.bind(this));
    this.bot.onText(/\/address/, this.handleAddress.bind(this));
    this.bot.onText(/\/walletId/, this.handleWalletId.bind(this));
    this.bot.onText(/\/network (.+)/, this.handleNetwork.bind(this));
    this.bot.onText(/\/networks/, this.handleListNetworks.bind(this));
    this.bot.onText(/\/cctp (.+)/, this.handleCCTP.bind(this));
    this.bot.onText(/\/swap (.+)/, this.handleSwap.bind(this));

    // RWA/Market data commands (MCP-enhanced)
    this.bot.onText(/\/rwa(.*)/, this.handleRWA.bind(this));
    this.bot.onText(/\/gainers/, this.handleGainersLosers.bind(this));
    this.bot.onText(/\/chart (.+)/, this.handleChart.bind(this));
    this.bot.onText(/\/mcpstatus/, this.handleMCPStatus.bind(this));
    this.bot.onText(/\/mcpdebug/, this.handleMCPDebug.bind(this));
    
    // Help command
    this.bot.onText(/\/help/, this.handleHelp.bind(this));

    // Handle non-command text messages
    this.bot.on("message", this.handleTextMessage.bind(this));
  }

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
        const file = await this.bot.getFile(voice.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${file.file_path}`;

        const processingMsg = await this.bot.sendMessage(
          chatId,
          "🎤 Procesando tu comando de voz..."
        );

        const result = await voiceCommandService.processVoiceCommand(
          fileUrl,
          voice.mime_type || "audio/ogg"
        );

        await this.bot.deleteMessage(chatId, processingMsg.message_id);

        if (result.error) {
          await this.bot.sendMessage(
            chatId,
            voiceCommandService.getErrorMessage(result.error)
          );
          return;
        }

        await this.bot.sendMessage(
          chatId,
          `📝 Escuché: "${result.transcription.text}"\n\n` +
            voiceCommandService.formatCommand(result.command)
        );

        await this.executeVoiceCommand(
          result.command, 
          chatId, 
          userId, 
          msg.message_id,
          result.transcription.text
        );
      } catch (error) {
        console.error("Voice command error:", error);
        await this.bot.sendMessage(
          chatId,
          "❌ No pude procesar tu mensaje de voz. Intenta nuevamente o usa comandos de texto."
        );
      }
    });
  }

  private async executeVoiceCommand(
    command: ParsedCommand,
    chatId: number,
    userId: number,
    messageId: number,
    transcription?: string
  ): Promise<void> {
    if (command.requiresConfirmation) {
      await this.requestConfirmation(command, chatId, userId, messageId);
      return;
    }

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

      // Market data commands (NEW - Handle RWA and price queries)
      case "RWA_QUERY":
      case "CHECK_PRICE":
      case "TRENDING_COINS":
        if (transcription) {
          await this.handleVoiceAgentQuery(chatId, userId, transcription);
        }
        break;

      case "TOP_GAINERS_LOSERS":
        // Create a minimal message object for handleGainersLosers
        await this.handleGainersLosers({
          chat: { id: chatId, type: 'private' },
          message_id: messageId,
          date: Math.floor(Date.now() / 1000),
        } as TelegramBot.Message);
        break;

      case "CHART_REQUEST":
        if (command.params?.coinName) {
          const days = command.params.days || "7";
          // Create a minimal message object and match array for handleChart
          const fakeMatch = Object.assign(
            [`chart ${command.params.coinName} ${days}`, `${command.params.coinName} ${days}`],
            { index: 0, input: `chart ${command.params.coinName} ${days}`, groups: undefined }
          ) as RegExpExecArray;
          
          await this.handleChart({
            chat: { id: chatId, type: 'private' },
            message_id: messageId,
            date: Math.floor(Date.now() / 1000),
          } as TelegramBot.Message, fakeMatch);
        }
        break;

      case "UNKNOWN":
        if (transcription && this.isRWAQuery(transcription)) {
          await this.handleVoiceAgentQuery(chatId, userId, transcription);
        } else {
        await this.bot.sendMessage(
          chatId,
            "❓ No entendí ese comando.\n\n" +
              "Intenta decir:\n" +
              "• 'Crear una wallet'\n" +
              "• 'Revisar mi balance'\n" +
              "• 'Mostrar mi dirección'\n" +
              "• 'Enviar 10 USDC a 0x...'\n" +
              "• 'Cambiar por oro' 🪙\n\n" +
              "📊 O pregunta sobre mercado:\n" +
              "• '¿Cuáles son los tokens que más subieron?'\n" +
              "• '¿Cuál es el precio de ONDO?'\n" +
              "• 'Muéstrame el gráfico de Bitcoin'"
          );
        }
        break;
    }
  }

  private async requestConfirmation(
    command: ParsedCommand,
    chatId: number,
    userId: number,
    messageId: number
  ): Promise<void> {
    this.pendingConfirmations.set(userId, {
      command,
      expiresAt: Date.now() + this.confirmationTimeout,
      chatId,
      messageId,
    });

    await this.bot.sendMessage(
      chatId,
      voiceCommandService.getConfirmationMessage(command)
    );

    setTimeout(() => {
      if (this.pendingConfirmations.has(userId)) {
        this.pendingConfirmations.delete(userId);
        this.bot.sendMessage(
          chatId,
          "⏱️ Tiempo de confirmación expirado. Comando cancelado por seguridad."
        );
      }
    }, this.confirmationTimeout);
  }

  private async handleTextMessage(msg: TelegramBot.Message): Promise<void> {
    const userId = msg.from?.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!userId || !text) return;
    if (text.startsWith('/')) return;
    if (msg.voice) return;

    // Check for pending confirmation (highest priority)
    const pending = this.pendingConfirmations.get(userId);
    if (pending) {
    const upperText = text.toUpperCase();

    if (Date.now() > pending.expiresAt) {
      this.pendingConfirmations.delete(userId);
        await this.bot.sendMessage(chatId, "⏱️ Confirmación expirada. Intenta nuevamente.");
      return;
    }

      if (upperText === "CONFIRM" || upperText === "CONFIRMAR") {
      this.pendingConfirmations.delete(userId);
        await this.bot.sendMessage(chatId, "✅ Confirmado. Procesando...");
      await this.executeConfirmedCommand(pending.command, chatId, userId);
        return;
      } else if (upperText === "CANCEL" || upperText === "CANCELAR") {
      this.pendingConfirmations.delete(userId);
        await this.bot.sendMessage(chatId, "❌ Comando cancelado.");
        return;
      }
      return;
    }

    // Check if message is RWA-related
    if (this.isRWAQuery(text)) {
      await this.handleAgentQuery(msg);
    }
  }

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
                `❌ Red de destino no soportada: ${command.params?.destinationNetwork ?? "unknown"}`
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

        case "SWAP":
          if (command.params?.outputAmount && command.params?.outputToken) {
            const maxUSDC = this.estimateMaxUSDCForSwap(
              command.params.outputAmount,
              command.params.outputToken
            );

            await this.executeSwap(
              chatId,
              userId,
              command.params.outputToken,
              command.params.outputAmount,
              maxUSDC
            );
          }
          break;
      }
    } catch (error) {
      console.error("Confirmed command execution error:", error);
      await this.bot.sendMessage(
        chatId,
        `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    }
  }

  // ============================================
  // WALLET MANAGEMENT COMMANDS (Existing)
  // ============================================

  private async handleCreateWalletVoice(chatId: number, userId: number): Promise<void> {
    const currentNetwork = networkService.getCurrentNetwork() as CurrentNetworkInfo;
    const networkName = String(currentNetwork.name);

    try {
      await circleService.init();
      const userWallets = storageService.getWallet(userId) || {};

      if (userWallets[networkName]) {
        await this.bot.sendMessage(
          chatId,
          `✅ Ya tienes una wallet en ${networkName}!\n` +
            `Dirección: ${userWallets[networkName].address}`
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
        `✅ Wallet creada en ${networkName}!\n\n` +
          `📍 Dirección: ${firstWallet.address}\n\n` +
          `Ahora puedes recibir y enviar USDC!`
      );
    } catch (error) {
      console.error("Create wallet error:", error);
      await this.bot.sendMessage(chatId, "❌ Error al crear wallet. Intenta nuevamente.");
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
          "❌ No se encontró wallet. Di 'crear una wallet' primero."
        );
        return;
      }

      const balance = await circleService.getWalletBalance(
        wallets[currentNetworkName].walletId
      );
      await this.bot.sendMessage(
        chatId,
        `💰 Balance en ${balance.network}:\n\n` +
          `${balance.usdc} USDC`
      );
    } catch (error) {
      console.error("Balance error:", error);
      await this.bot.sendMessage(chatId, "❌ Error al obtener balance. Intenta más tarde.");
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
        `❌ No se encontró wallet para ${currentNetworkName}. Di 'crear una wallet' primero.`
      );
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `📍 Tu dirección de wallet en ${currentNetworkName}:\n\n` +
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
        `❌ No se encontró wallet para ${currentNetworkName}.`
      );
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `🆔 Tu Wallet ID en ${currentNetworkName}:\n\n` +
        `\`${wallets[currentNetworkName].walletId}\``,
      { parse_mode: "Markdown" }
    );
  }

  private async handleNetworkVoice(chatId: number, networkName: string): Promise<void> {
    const upper = networkName.toUpperCase();

    if (!isNetworkKey(upper)) {
      await this.bot.sendMessage(
        chatId,
        `❌ Red inválida: ${networkName}\n\nDi "listar redes" para ver las opciones disponibles.`
      );
      return;
    }

    try {
      const net = networkService.setNetwork(upper);
      await this.bot.sendMessage(
        chatId,
        `✅ Cambiado a ${net.name} ${net.isTestnet ? "(Testnet)" : ""}\n\n` +
          `Dirección USDC: ${net.usdcAddress ?? "N/A"}`
      );
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error al cambiar red: ${networkName}`);
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
      `🌐 Redes disponibles:\n\n${networksList}\n\n` +
        `Di "cambiar a [red]" para cambiar de red.`
    );
  }

  private async handleHelpVoice(chatId: number): Promise<void> {
    await this.bot.sendMessage(
      chatId,
      `🎙️ Comandos de Voz:\n\n` +
        `💬 ¡Solo di lo que quieres hacer!\n\n` +
        `Ejemplos:\n` +
        `• "Crear una wallet"\n` +
        `• "Revisar mi balance"\n` +
        `• "Mostrar mi dirección"\n` +
        `• "Enviar 10 USDC a 0x..."\n` +
        `• "Cambiar por oro" 🪙\n` +
        `• "Cambiar a Base Sepolia"\n` +
        `• "Listar redes"\n\n` +
        `📊 Datos de mercado:\n` +
        `• "¿Cuáles son los mejores tokens RWA?"\n` +
        `• "¿Qué monedas subieron más hoy?"\n` +
        `• "Muéstrame el gráfico de Ethereum"\n\n` +
        `🔐 Las operaciones financieras requieren confirmación por seguridad.`
    );
  }

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
      throw new Error(`No se encontró wallet para ${currentNetworkName}`);
    }

    await this.bot.sendMessage(chatId, `Procesando transacción en ${currentNetworkName}...`);

    const txResponse = await circleService.sendTransaction(
      wallets[currentNetworkName].walletId,
      destinationAddress,
      amount
    );

    await this.bot.sendMessage(
      chatId,
      `✅ Transacción enviada!\n\n` +
        `Monto: ${amount} USDC\n` +
        `Destinatario: ${destinationAddress}\n` +
        `ID de Transacción: ${txResponse.id}`
    );
  }

  private isHexAddress(address: string): address is `0x${string}` {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  private async executeCCTP(
    chatId: number,
    userId: number,
    destinationNetwork: DomainKey,
    destinationAddress: `0x${string}`,
    amount: string
  ): Promise<void> {
    const wallet = storageService.getWallet(userId);
    if (!wallet) {
      throw new Error("No se encontró wallet");
    }

    const currentNetwork = networkService.getCurrentNetwork() as CurrentNetworkInfo;
    const currentKey = String(currentNetwork.name);
    const userWallet = wallet[currentKey];

    if (!userWallet) {
      throw new Error(`No se encontró wallet para ${currentKey}`);
    }

    const destinationWallet = wallet[destinationNetwork];
    if (!destinationWallet) {
      throw new Error(
        `No se encontró wallet para ${destinationNetwork}. Crea una primero con "crear wallet".`
      );
    }

    await this.bot.sendMessage(chatId, "🌉 Iniciando transferencia entre cadenas...");

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
      `✅ Transferencia entre cadenas completa!\n\n` +
        `Desde: ${currentKey}\n` +
        `Hacia: ${destinationNetwork}\n` +
        `Monto: ${amount} USDC\n\n` +
        `Transacciones:\n` +
        `Aprobación: ${result.approveTx}\n` +
        `Quemado: ${result.burnTx}\n` +
        `Recepción: ${result.receiveTx}`
    );
  }

  private async executeSwap(
    chatId: number,
    userId: number,
    outputToken: string,
    amountOut: string,
    maxUSDCIn: string
  ): Promise<void> {
    const currentNetwork = networkService.getCurrentNetwork();
    const currentNetworkName = String(currentNetwork.name);
    const wallets = storageService.getWallet(userId);

    if (!wallets || !wallets[currentNetworkName]) {
      throw new Error(`No se encontró wallet para ${currentNetworkName}`);
    }

    if (!swapService.isSupported()) {
      await this.bot.sendMessage(
        chatId,
        `❌ Swaps no disponibles en ${currentNetworkName}\n\n` +
          `Redes soportadas:\n` +
          `• ETH-SEPOLIA\n` +
          `• BASE-SEPOLIA\n` +
          `• ARB-SEPOLIA\n\n` +
          `Usa /network para cambiar`
      );
      return;
    }

    const wallet = wallets[currentNetworkName];

    try {
      const balance = await circleService.getWalletBalance(wallet.walletId);
      const balanceNum = parseFloat(balance.usdc);
      const maxUSDCNum = parseFloat(maxUSDCIn);
      
      if (balanceNum < maxUSDCNum) {
    await this.bot.sendMessage(
      chatId,
          `❌ Balance insuficiente\n\n` +
            `Disponible: ${balanceNum} USDC\n` +
            `Requerido: ${maxUSDCNum} USDC (incluye slippage)\n\n` +
            `💡 Intenta:\n` +
            `• Menor cantidad: "swap for 0.05 gold"\n` +
            `• Depositar más USDC a tu wallet`
        );
        return;
      }
    } catch (balanceError) {
      console.error("Error checking balance:", balanceError);
    }

    await this.bot.sendMessage(
      chatId,
      `🔄 Iniciando swap en ${currentNetworkName}...\n\n` +
        `Intercambiando por: ${amountOut} ${outputToken}\n` +
        `USDC máximo: ${maxUSDCIn}\n\n` +
        `⏳ Esto puede tomar 30-60 segundos...`
    );

    try {
      const result = await swapService.swap({
        walletId: wallet.walletId,
        walletAddress: wallet.address,
        outputToken,
        amountOut,
        maxUSDCIn,
        slippageBps: 100,
        deadlineMinutes: 30,
        feeLevel: "MEDIUM",
      });

      await this.bot.sendMessage(
        chatId,
        `✅ Swap completado exitosamente!\n\n` +
          `Recibido: ${result.outputAmount} ${outputToken}\n` +
          `USDC gastado: ${result.maxUSDCSpent}\n` +
          `Red: ${result.network}\n\n` +
          `Transacciones:\n` +
          `Aprobación: ${result.approveTxId}\n` +
          `Swap: ${result.swapTxId}`
      );
    } catch (error: unknown) {
      console.error("Swap execution error:", error);
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      
      await this.bot.sendMessage(
        chatId,
        `❌ Swap falló\n\n` +
          `Error: ${errorMsg}\n\n` +
          `💡 Problemas comunes:\n` +
          `• Balance insuficiente (necesitas ${maxUSDCIn} USDC)\n` +
          `• Precio se movió mucho (intenta aumentar cantidad)\n` +
          `• Baja liquidez para ${outputToken} en testnet\n\n` +
          `Intenta:\n` +
          `• "Revisar mi balance" primero\n` +
          `• Usar menor cantidad\n` +
          `• Probar WETH en lugar de UNI`
      );
    }
  }

  private estimateMaxUSDCForSwap(amount: string, token: string): string {
    const amt = parseFloat(amount);
    if (token === "WETH") {
      return (amt * 2500 * 1.2).toFixed(2);
    }
    if (token === "DAI") {
      return (amt * 1.15).toFixed(2);
    }
    if (token === "UNI") {
      return (amt * 15).toFixed(2);
    }
    return (amt * 100).toFixed(2);
  }

  private cleanupExpiredConfirmations(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [userId, pending] of this.pendingConfirmations.entries()) {
        if (now > pending.expiresAt) {
          this.pendingConfirmations.delete(userId);
        }
      }
    }, 60000);
  }

  // ============================================
  // RWA / MARKET DATA COMMANDS (MCP-Enhanced)
  // ============================================

  private isRWAQuery(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    const rwaKeywords = [
      // English
      'rwa', 'real world asset', 'real-world asset',
      'price', 'market cap', 'market', 'trading',
      'trending', 'top coins', 'top tokens',
      'ondo', 'usdc', 'link', 'chainlink',
      'token price', 'coin price',
      'how much is', 'what is the price',
      'stablecoin', 'tokenized',
      'treasury', 'treasuries',
      'defi token', 'crypto price',
      'gold', 'silver', 'ethereum', 'bitcoin',
      'chart', 'graph', 'gainers', 'losers',
      'movers', 'winners', 'performance',
      // Spanish
      'precio', 'mercado', 'moneda', 'token',
      'oro', 'plata', 'ethereum', 'redes',
      'cuánto cuesta', 'cuál es el precio',
      'dime de', 'háblame de', 'información sobre',
      'activos', 'cripto', 'criptomoneda',
      'gráfico', 'ganadores', 'perdedores',
      'que subieron', 'que bajaron', 'rendimiento'
    ];
    
    return rwaKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * NEW: Handle /gainers command - Top gainers and losers (MCP-specific)
   */
  private async handleGainersLosers(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const processingMsg = await this.bot.sendMessage(
        chatId,
        "📊 Obteniendo top ganadores y perdedores vía MCP..."
      );

      const data = await coinGeckoService.getTopGainersLosers();

      await this.bot.deleteMessage(chatId, processingMsg.message_id);

      let response = "📈 Top Ganadores (24h):\n\n";
      data.top_gainers.slice(0, 5).forEach((coin, index) => {
        response += `${index + 1}. ${coinGeckoService.formatCoinResponse(coin, 'es')}\n\n`;
      });

      response += "\n📉 Top Perdedores (24h):\n\n";
      data.top_losers.slice(0, 5).forEach((coin, index) => {
        response += `${index + 1}. ${coinGeckoService.formatCoinResponse(coin, 'es')}\n\n`;
      });

      response += "Powered by CoinGecko MCP Server";

      // Send without Markdown to avoid parsing errors with special characters
      await this.bot.sendMessage(chatId, response);

    } catch (error: unknown) {
      console.error('Gainers/Losers error:', error);
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      
      await this.bot.sendMessage(
        chatId,
        `❌ No pude obtener datos de ganadores/perdedores.\n\n` +
        `Error: ${errorMsg}\n\n` +
        `💡 Esta función requiere:\n` +
        `• Conexión MCP activa\n` +
        `• API Key Pro de CoinGecko (opcional)\n\n` +
        `Verifica el estado con /mcpstatus`
      );
    }
  }

  /**
   * NEW: Handle /chart command - Market charts (MCP-enhanced)
   */
  private async handleChart(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const chatId = msg.chat.id;
    const params = match?.[1]?.trim();

    if (!params) {
      await this.bot.sendMessage(
        chatId,
        "❌ Uso: /chart <coin> [days]\n\n" +
        "Ejemplos:\n" +
        "• /chart bitcoin 7\n" +
        "• /chart ondo 30\n" +
        "• /chart eth"
      );
      return;
    }

    const parts = params.split(' ');
    const coinName = parts[0].toLowerCase();
    const days = parseInt(parts[1]) || 7;

    try {
      const processingMsg = await this.bot.sendMessage(
        chatId,
        `📊 Obteniendo datos de gráfico para ${coinName}...`
      );

      // Map common names to CoinGecko IDs
      const coinIdMap: Record<string, string> = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'ondo': 'ondo-finance',
        'usdc': 'usd-coin',
        'link': 'chainlink',
        'oro': 'paxos-gold',
      };

      const coinId = coinIdMap[coinName] || coinName;

      // Get market chart data via MCP
      const chartData = await coinGeckoService.getCoinMarketChart(coinId, 'usd', days);

      await this.bot.deleteMessage(chatId, processingMsg.message_id);

      // Calculate statistics
      const prices = chartData.prices;
      const firstPrice = prices[0][1];
      const lastPrice = prices[prices.length - 1][1];
      const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      const high = Math.max(...prices.map(p => p[1]));
      const low = Math.min(...prices.map(p => p[1]));

      let response = `📊 Gráfico de ${coinId.toUpperCase()} (${days} días)\n\n`;
      response += `💰 Precio actual: $${lastPrice.toFixed(2)} USD\n`;
      response += `${priceChange >= 0 ? '📈' : '📉'} Cambio ${days}d: ${priceChange.toFixed(2)}%\n`;
      response += `🔺 Máximo: $${high.toFixed(2)}\n`;
      response += `🔻 Mínimo: $${low.toFixed(2)}\n\n`;
      response += `📈 Datos históricos: ${prices.length} puntos\n`;
      response += `📊 Volumen promedio: $${this.formatLargeNumber(
        chartData.total_volumes.reduce((sum, v) => sum + v[1], 0) / chartData.total_volumes.length
      )}\n\n`;
      response += `Para gráficos visuales, visita:\n`;
      response += `https://www.coingecko.com/en/coins/${coinId}`;

      // Send without Markdown to avoid parsing errors with special characters
      await this.bot.sendMessage(chatId, response);

    } catch (error: unknown) {
      console.error('Chart error:', error);
      const errorMsg = error instanceof Error ? error.message : "Error desconocido";
      
      await this.bot.sendMessage(
        chatId,
        `❌ No pude obtener datos del gráfico.\n\n` +
        `Error: ${errorMsg}\n\n` +
        `💡 Intenta:\n` +
        `• Verifica el nombre del token\n` +
        `• Usa IDs de CoinGecko (bitcoin, ethereum, ondo-finance)\n` +
        `• Reduce el período de días`
      );
    }
  }

  /**
   * NEW: Handle /mcpstatus command - Check MCP connection status
   */
  private async handleMCPStatus(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const status = coinGeckoService.getMCPStatus();

      let response = "*🔌 Estado de Conexión MCP*\n\n";
      response += `Estado: ${status.connected ? '✅ Conectado' : '❌ Desconectado'}\n`;
      response += `Modo: ${status.mode === 'MCP' ? '🚀 MCP Server' : '🌐 REST API (Fallback)'}\n`;
      response += `Endpoint: ${status.endpoint}\n`;
      response += `Autenticación: ${status.authenticated ? '🔑 Pro API Key' : '🆓 Keyless (Public)'}\n\n`;
      
      if (status.connected) {
        response += `✨ *Herramientas disponibles: ${status.toolCount}*\n\n`;
        
        response += `📋 *Ejemplos de herramientas:*\n`;
        status.sampleTools.slice(0, 8).forEach(tool => {
          response += `• \`${tool}\`\n`;
        });
        if (status.toolCount > 8) {
          response += `• _...y ${status.toolCount - 8} más_\n`;
        }
        response += `\n`;
        
        response += `✨ *Funciones disponibles:*\n`;
        response += `• ✅ Datos de mercado en tiempo real\n`;
        response += `• ✅ Búsqueda de tokens\n`;
        response += `• ✅ Tokens RWA\n`;
        response += `• ✅ Monedas en tendencia\n`;
        if (status.authenticated) {
          response += `• ✅ Top ganadores/perdedores (Pro)\n`;
          response += `• ✅ Datos históricos completos (Pro)\n`;
        } else {
          response += `• ⚠️  Top ganadores/perdedores (requiere Pro)\n`;
        }
        response += `\n`;
        response += `_Powered by CoinGecko MCP Server_\n`;
        response += `_Rate limits: ${status.authenticated ? 'Pro (500+/min)' : 'Public (30/min)'}_\n`;
        response += `_Docs: docs.coingecko.com/mcp-server_`;
      } else {
        response += `⚠️ *Modo Fallback activo*\n\n`;
        response += `Funciones limitadas:\n`;
        response += `• ✅ Precios básicos\n`;
        response += `• ✅ Búsqueda de tokens\n`;
        response += `• ❌ Ganadores/perdedores\n`;
        response += `• ⚠️ Gráficos (limitados)\n\n`;
        response += `💡 *Para activar MCP:*\n`;
        response += `1\\. Verifica conexión a internet\n`;
        response += `2\\. Agrega COINGECKO\\_API\\_KEY (opcional)\n`;
        response += `3\\. Reinicia el bot`;
      }

      await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('MCP status error:', error);
      await this.bot.sendMessage(
        chatId,
        "❌ Error al obtener estado de MCP"
      );
    }
  }

  /**
   * Handle /mcpdebug command - Show all available MCP tools
   */
  private async handleMCPDebug(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    
    try {
      const status = coinGeckoService.getMCPStatus();
      const tools = coinGeckoService.getAvailableMCPTools();
      
      let message = `🔍 *MCP Debug Information*\n\n`;
      message += `*Conexión:* ${status.connected ? '✅ Conectado' : '❌ Desconectado'}\n`;
      message += `*Modo:* ${status.mode}\n`;
      message += `*Herramientas disponibles:* ${status.toolCount}\n`;
      message += `*Endpoint:* ${status.endpoint}\n`;
      message += `*Autenticado:* ${status.authenticated ? '✅ Sí (Pro)' : '❌ No (Public)'}\n\n`;
      
      if (tools.length > 0) {
        message += `*📋 Herramientas MCP disponibles:*\n\`\`\`\n`;
        tools.slice(0, 20).forEach((tool, idx) => {
          message += `${idx + 1}. ${tool}\n`;
        });
        if (tools.length > 20) {
          message += `... y ${tools.length - 20} más\n`;
        }
        message += `\`\`\`\n\n`;
        
        message += `*💡 Nota:* Esta lista muestra las herramientas reales disponibles en el servidor MCP.\n`;
        message += `Si no ves herramientas como 'coins_markets', el bot usará la API REST como respaldo.`;
      } else {
        message += `⚠️ No hay herramientas MCP disponibles. Usando REST API.`;
      }
      
      // Also print to console for development
      coinGeckoService.printMCPDebugInfo();
      
      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error getting MCP debug info:', error);
      await this.bot.sendMessage(
        chatId,
        "❌ Error al obtener información de debug MCP"
      );
    }
  }

  /**
   * Handle /help command - Show all available commands
   */
  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    
    const helpMessage = 
      `📚 *Ayuda - Circle Wallet Bot*\n\n` +
      `*💼 Comandos de Wallet:*\n` +
      `/createWallet - Crear nueva wallet\n` +
      `/balance - Ver balance USDC\n` +
      `/address - Ver dirección de wallet\n` +
      `/walletId - Ver ID de wallet\n` +
      `/send <dirección> <cantidad> - Enviar USDC\n\n` +
      
      `*🌐 Comandos de Red:*\n` +
      `/network <red> - Cambiar de red\n` +
      `/networks - Listar redes disponibles\n` +
      `/cctp <red> <dirección> <cantidad> - Transferencia entre cadenas\n\n` +
      
      `*💱 Comandos de Trading:*\n` +
      `/swap <token> <cantidad> <maxUSDC> - Intercambiar tokens\n` +
      `Tokens soportados: WETH, DAI, UNI (oro 🪙)\n\n` +
      
      `*📊 Comandos de Mercado (MCP):*\n` +
      `/rwa [consulta] - Consultas sobre tokens RWA\n` +
      `/gainers - Top ganadores/perdedores\n` +
      `/chart <coin> [días] - Ver gráfico de mercado\n` +
      `/mcpstatus - Estado de conexión MCP\n\n` +
      
      `*🎤 Comandos de Voz:*\n` +
      `Envía un mensaje de voz diciendo:\n` +
      `• "Crear una wallet"\n` +
      `• "Revisar mi balance"\n` +
      `• "Mostrar mi dirección"\n` +
      `• "Enviar 10 USDC a 0x..."\n` +
      `• "Cambiar por oro"\n` +
      `• "¿Cuál es el precio de Bitcoin?"\n` +
      `• "Muéstrame los mejores tokens RWA"\n\n` +
      
      `*💬 Lenguaje Natural:*\n` +
      `También puedes escribir directamente:\n` +
      `• "¿Cuál es el precio de ONDO?"\n` +
      `• "Muéstrame tokens de oro"\n` +
      `• "¿Qué monedas subieron más?"\n\n` +
      
      `*🔐 Seguridad:*\n` +
      `Las operaciones financieras siempre requieren confirmación.\n` +
      `Responde "CONFIRM" o "CONFIRMAR" para proceder.\n` +
      `Responde "CANCEL" o "CANCELAR" para cancelar.\n\n` +
      
      `*💡 Consejos:*\n` +
      `• Usa voz para comandos rápidos\n` +
      `• Funciona en español e inglés\n` +
      `• Verifica /mcpstatus para funciones MCP\n` +
      `• Los swaps solo en ETH-SEPOLIA, BASE-SEPOLIA, ARB-SEPOLIA\n\n` +
      
      `📖 Docs: docs.coingecko.com/mcp-server\n` +
      `🌐 Redes: Testnet (ETH-SEPOLIA, BASE-SEPOLIA, ARB-SEPOLIA)`;
    
    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Handle /rwa command for RWA queries
   */
  private async handleRWA(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const query = match?.[1]?.trim() || "¿Cuáles son los mejores tokens RWA?";
    
    const modifiedMsg = {
      ...msg,
      text: query
    };
    
    await this.handleAgentQuery(modifiedMsg);
  }

  /**
   * Handle RWA Query (Text) - Using CoinGecko MCP
   */
  private async handleAgentQuery(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const userText = msg.text || "";

    try {
      const processingMsg = await this.bot.sendMessage(
        chatId,
        "🔍 Buscando datos de mercado vía MCP..."
      );

      const response = await this.processRWAQuery(userText);

      await this.bot.deleteMessage(chatId, processingMsg.message_id);

      // Send without Markdown to avoid parsing errors with special characters
      await this.bot.sendMessage(
        chatId,
        `📊 ${response}`
      );

    } catch (error: unknown) {
      console.error('RWA query error:', error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";

      await this.bot.sendMessage(
        chatId,
        `❌ No pude obtener los datos de mercado.\n\n` +
        `Error: ${errorMessage}\n\n` +
        `💡 Intenta preguntar sobre:\n` +
        `• "¿Cuáles son los mejores tokens RWA?"\n` +
        `• "¿Cuál es el precio de ONDO?"\n` +
        `• "Muéstrame las monedas en tendencia"\n` +
        `• "/gainers" para ver ganadores/perdedores\n` +
        `• "/chart bitcoin 7" para ver gráficos`
      );
    }
  }

  /**
   * Handle RWA Query (Voice) - Using CoinGecko MCP
   */
  private async handleVoiceAgentQuery(
    chatId: number, 
    userId: number | undefined, 
    transcription: string
  ): Promise<void> {
    try {
      const processingMsg = await this.bot.sendMessage(
        chatId,
        "🎤 Procesando tu pregunta vía MCP..."
      );

      console.log('Processing RWA voice query via MCP:', transcription);
      
      const response = await this.processRWAQuery(transcription);
      console.log('✅ Response from processRWAQuery:', response.substring(0, 100) + '...');

      await this.bot.deleteMessage(chatId, processingMsg.message_id);

      // Send without Markdown to avoid parsing errors with special characters
      console.log('📤 Sending response to Telegram...');
      await this.bot.sendMessage(chatId, `📊 ${response}`);
      console.log('✅ Message sent successfully');

    } catch (error: unknown) {
      console.error('Voice RWA query error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";

      await this.bot.sendMessage(
        chatId,
        `❌ No pude procesar tu consulta.\n\n` +
        `Error: ${errorMessage}\n\n` +
        `💡 Intenta preguntar sobre:\n` +
        `• "¿Cuál es el precio de ONDO?"\n` +
        `• "Dime sobre los tokens RWA"\n` +
        `• "¿Qué monedas subieron más?"\n` +
        `• "Muéstrame el gráfico de Ethereum"\n\n` +
        `O escribe directamente tu pregunta como texto.`
      );
    }
  }

  /**
   * Process RWA query and generate response using CoinGecko MCP
   */
  private async processRWAQuery(query: string): Promise<string> {
    console.log('🔍 processRWAQuery called with:', query);
    const lowerQuery = query.toLowerCase();
    console.log('🔍 Lowercase query:', lowerQuery);
    
    const requestedBlockchain = this.detectBlockchain(lowerQuery);

    // Intent: Top gainers/losers (NEW - MCP-specific)
    if (
      lowerQuery.includes('gainer') ||
      lowerQuery.includes('loser') ||
      lowerQuery.includes('ganador') ||
      lowerQuery.includes('perdedor') ||
      lowerQuery.includes('subieron') ||
      lowerQuery.includes('bajaron') ||
      lowerQuery.includes('movers') ||
      lowerQuery.includes('winners')
    ) {
      try {
        const data = await coinGeckoService.getTopGainersLosers();
        
        let response = "📈 Top Ganadores (24h):\n\n";
        data.top_gainers.slice(0, 3).forEach((coin, index) => {
          response += `${index + 1}. ${coinGeckoService.formatCoinResponse(coin, 'es')}\n\n`;
        });

        response += "\n📉 Top Perdedores (24h):\n\n";
        data.top_losers.slice(0, 3).forEach((coin, index) => {
          response += `${index + 1}. ${coinGeckoService.formatCoinResponse(coin, 'es')}\n\n`;
        });

        response += "Usa /gainers para ver la lista completa";
        
        return response;
      } catch (error) {
        return "Esta función requiere MCP Pro. Usa /rwa para ver tokens RWA principales.";
      }
    }

    // Intent: Gold tokens
    if (
      (lowerQuery.includes('oro') || lowerQuery.includes('gold')) &&
      !lowerQuery.includes('pax') &&
      !lowerQuery.includes('tether') &&
      !lowerQuery.includes('matrix') &&
      !lowerQuery.includes('xaut') &&
      !lowerQuery.includes('paxg') &&
      !lowerQuery.includes('xaum')
    ) {
      return await this.handleGoldTokensQuery(requestedBlockchain);
    }

    // Intent: Top RWA tokens
    if (
      lowerQuery.includes('top') ||
      lowerQuery.includes('best') ||
      lowerQuery.includes('mejores') ||
      lowerQuery.includes('principales') ||
      lowerQuery.includes('list') ||
      lowerQuery.includes('lista') ||
      lowerQuery.includes('show me') ||
      lowerQuery.includes('muéstrame') ||
      (lowerQuery.includes('tokens') && lowerQuery.includes('rwa')) ||
      (lowerQuery.includes('real') && lowerQuery.includes('world') && lowerQuery.includes('asset'))
    ) {
      console.log('✅ Matched "Top RWA tokens" pattern');
      const coins = await coinGeckoService.getRWATokens();
      console.log('📊 RWA tokens retrieved:', coins.length);
      
      if (coins.length === 0) {
        console.log('⚠️ No RWA tokens found');
        return "No pude encontrar tokens RWA en este momento. Intenta más tarde.";
      }

      let response = "📊 Top 5 Tokens RWA:\n\n";
      coins.slice(0, 5).forEach((coin, index) => {
        response += `${index + 1}. ${coinGeckoService.formatCoinResponse(coin, 'es')}\n\n`;
      });
      response += "¿Te gustaría más detalles sobre algún token específico?";
      
      console.log('✅ Response generated, length:', response.length);
      return response;
    }

    // Intent: Trending coins
    if (
      lowerQuery.includes('trending') ||
      lowerQuery.includes('tendencia') ||
      lowerQuery.includes('populares') ||
      lowerQuery.includes('moda')
    ) {
      const trendingCoins = await coinGeckoService.getTrendingCoins();
      
      if (trendingCoins.length === 0) {
        return "No pude obtener las monedas en tendencia. Intenta más tarde.";
      }

      let response = "🔥 Monedas en tendencia:\n\n";
      trendingCoins.slice(0, 5).forEach((item, index) => {
        const coin = item.item;
        response += `${index + 1}. ${coin.name} (${coin.symbol.toUpperCase()})\n`;
        response += `   Ranking: #${coin.market_cap_rank || 'N/A'}\n\n`;
      });
      
      return response;
    }

    // Intent: Specific coin price (uses comprehensive coin mapping)
    const coinNames = [
      'ondo', 'ondo finance', 'usdy', 'mantra', 'om',
      'polymesh', 'polyx', 'chainlink', 'link',
      'pyth', 'pyth network', 'quant', 'qnt',
      'reserve', 'reserve rights', 'rsr',
      'algorand', 'algo', 'origintrait', 'trac',
      'cfi', 'crossfi', 'stellar', 'xlm',
      'usdc', 'usd coin', 'circle',
      'usdt', 'tether', 'usyc', 'circle usyc',
      'pyusd', 'paypal usd',
      'paxg', 'pax gold', 'xaut', 'tether gold',
      'xaum', 'matrixdock', 'matrixdock gold',
      'buidl', 'blackrock', 'figr', 'figure',
      'goldfinch', 'gfi', 'creditcoin', 'ctc',
      'provenance', 'hash',
      'ethereum', 'eth', 'bitcoin', 'btc',
      'uniswap', 'uni', 'solana', 'sol',
      'oro', 'plata'
    ];

    let foundCoin: string | null = null;
    for (const name of coinNames) {
      if (lowerQuery.includes(name)) {
        foundCoin = name;
        break;
      }
    }

    if (foundCoin) {
      const coinIdMap: Record<string, string> = {
        'ondo': 'ondo-finance',
        'ondo finance': 'ondo-finance',
        'usdy': 'ondo-us-dollar-yield',
        'mantra': 'mantra-dao',
        'om': 'mantra-dao',
        'polymesh': 'polymesh',
        'polyx': 'polymesh',
        'pyth': 'pyth-network',
        'pyth network': 'pyth-network',
        'quant': 'quant-network',
        'qnt': 'quant-network',
        'reserve': 'reserve-rights-token',
        'reserve rights': 'reserve-rights-token',
        'rsr': 'reserve-rights-token',
        'algorand': 'algorand',
        'algo': 'algorand',
        'origintrait': 'origintrail',
        'trac': 'origintrail',
        'cfi': 'crossfi',
        'crossfi': 'crossfi',
        'stellar': 'stellar',
        'xlm': 'stellar',
        'usdc': 'usd-coin',
        'usd coin': 'usd-coin',
        'circle': 'usd-coin',
        'usyc': 'usd-yield-coin',
        'circle usyc': 'usd-yield-coin',
        'usdt': 'tether',
        'tether': 'tether',
        'pyusd': 'paypal-usd',
        'paypal usd': 'paypal-usd',
        'paxg': 'pax-gold',
        'pax gold': 'pax-gold',
        'xaut': 'tether-gold',
        'tether gold': 'tether-gold',
        'xaum': 'matrixdock-gold',
        'matrixdock': 'matrixdock-gold',
        'matrixdock gold': 'matrixdock-gold',
        'buidl': 'blackrock-usd-institutional-digital-liquidity-fund',
        'blackrock': 'blackrock-usd-institutional-digital-liquidity-fund',
        'figr': 'figure-heloc',
        'figure': 'figure-heloc',
        'goldfinch': 'goldfinch',
        'gfi': 'goldfinch',
        'creditcoin': 'creditcoin',
        'ctc': 'creditcoin',
        'provenance': 'provenance-blockchain',
        'hash': 'provenance-blockchain',
        'link': 'chainlink',
        'chainlink': 'chainlink',
        'eth': 'ethereum',
        'ethereum': 'ethereum',
        'btc': 'bitcoin',
        'bitcoin': 'bitcoin',
        'uni': 'uniswap',
        'uniswap': 'uniswap',
        'sol': 'solana',
        'solana': 'solana',
        'oro': 'pax-gold',
        'plata': 'kinesis-silver',
      };

      const coinId = coinIdMap[foundCoin] || foundCoin;

      try {
        const coinDetails = await coinGeckoService.getCoinDetails(coinId);
        return await this.formatDetailedCoinResponse(coinDetails, requestedBlockchain);
      } catch (error) {
        return `No pude encontrar información sobre "${foundCoin}". ¿Podrías ser más específico?`;
      }
    }

    // Default: Show top 3 RWA tokens
    console.log('⚠️ No specific pattern matched, using default RWA tokens');
    const coins = await coinGeckoService.getRWATokens();
    console.log('📊 Default RWA tokens retrieved:', coins.length);
    
    if (coins.length === 0) {
      console.log('⚠️ No RWA tokens found in default handler');
      return "No pude encontrar datos de mercado. Intenta más tarde.";
    }

    let response = "📊 Tokens RWA destacados:\n\n";
    coins.slice(0, 3).forEach((coin, index) => {
      response += `${index + 1}. ${coinGeckoService.formatCoinResponse(coin, 'es')}\n\n`;
    });
    response += "Pregúntame sobre un token específico para más detalles.";
    
    console.log('✅ Default response generated, length:', response.length);
    return response;
  }

  private async handleGoldTokensQuery(requestedBlockchain?: string | null): Promise<string> {
    const goldTokens = ['pax-gold', 'tether-gold', 'matrixdock-gold'];
    
    try {
      let response = '🪙 Tokens respaldados por oro:\n\n';
      
      for (let i = 0; i < goldTokens.length; i++) {
        const coinId = goldTokens[i];
        try {
          const coinDetails = await coinGeckoService.getCoinDetails(coinId);
          const price = coinDetails.market_data.current_price.usd.toFixed(2);
          const change24h = coinDetails.market_data.price_change_percentage_24h.toFixed(2);
          const changeEmoji = parseFloat(change24h) >= 0 ? '📈' : '📉';
          
          response += `${i + 1}. ${coinDetails.name} (${coinDetails.symbol.toUpperCase()})\n`;
          response += `💰 Precio: $${price} USD\n`;
          response += `${changeEmoji} Cambio 24h: ${change24h}%\n`;
          
          const platforms = coinDetails.platforms || {};
          if (requestedBlockchain && platforms[requestedBlockchain]) {
            const platformName = this.formatPlatformName(requestedBlockchain);
            response += `🔗 ${platformName}: ${platforms[requestedBlockchain]}\n`;
          } else if (platforms['ethereum']) {
            response += `🔗 ⟠ Ethereum: ${platforms['ethereum']}\n`;
          }
          
          response += '\n';
        } catch (error) {
          console.error(`Error fetching ${coinId}:`, error);
        }
      }
      
      response += '💡 Todos los tokens están respaldados 1:1 por oro físico\n\n';
      response += '¿Quieres más detalles sobre alguno específico?';
      
      return response;
    } catch (error) {
      console.error('Error fetching gold tokens:', error);
      return 'No pude obtener información de tokens de oro. Intenta más tarde.';
    }
  }

  private detectBlockchain(query: string): string | null {
    const blockchainKeywords: Record<string, string[]> = {
      'ethereum': ['ethereum', 'eth', 'ether'],
      'binance-smart-chain': ['binance', 'bsc', 'bnb chain'],
      'polygon-pos': ['polygon', 'matic'],
      'arbitrum-one': ['arbitrum', 'arb'],
      'optimistic-ethereum': ['optimism', 'op'],
      'avalanche': ['avalanche', 'avax'],
      'base': ['base'],
      'solana': ['solana', 'sol'],
    };

    for (const [platform, keywords] of Object.entries(blockchainKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return platform;
      }
    }
    
    return null;
  }

  private async formatDetailedCoinResponse(
    coinDetails: any, 
    requestedBlockchain?: string | null
  ): Promise<string> {
    const price = coinDetails.market_data.current_price.usd.toFixed(2);
    const change24h = coinDetails.market_data.price_change_percentage_24h.toFixed(2);
    const changeEmoji = parseFloat(change24h) >= 0 ? '📈' : '📉';
    const marketCap = (coinDetails.market_data.market_cap.usd / 1e9).toFixed(2);
    
    const platforms = coinDetails.platforms || {};
    const platformKeys = Object.keys(platforms);
    
    let blockchainInfo = '';
    if (platformKeys.length > 0) {
      if (requestedBlockchain && platforms[requestedBlockchain]) {
        const address = platforms[requestedBlockchain];
        const platformName = this.formatPlatformName(requestedBlockchain);
        
        blockchainInfo = `\n\n🔗 ${platformName}:\n${address}\n`;
        
        const otherPlatforms = platformKeys.filter(p => p !== requestedBlockchain).slice(0, 2);
        if (otherPlatforms.length > 0) {
          blockchainInfo += '\nOtras redes:\n';
          otherPlatforms.forEach(platform => {
            const addr = platforms[platform];
            if (addr) {
              const name = this.formatPlatformName(platform);
              blockchainInfo += `• ${name}: ${addr.substring(0, 10)}...${addr.substring(addr.length - 4)}\n`;
            }
          });
        }
      } else {
        blockchainInfo = '\n\n🔗 Blockchains y Contratos:\n';
        
        platformKeys.slice(0, 3).forEach(platform => {
          const address = platforms[platform];
          if (address) {
            const platformName = this.formatPlatformName(platform);
            blockchainInfo += `\n• ${platformName}\n  ${address}\n`;
          }
        });
        
        if (platformKeys.length > 3) {
          blockchainInfo += `\n+${platformKeys.length - 3} blockchains más`;
        }
      }
    } else if (requestedBlockchain) {
      blockchainInfo = `\n\n⚠️ Este token no está disponible en ${this.formatPlatformName(requestedBlockchain)}`;
    }
    
    let description = '';
    if (coinDetails.description?.en) {
      description = coinDetails.description.en
        .replace(/<[^>]*>/g, '')
        .substring(0, 150);
      description = `\n\n📝 ${description}...`;
    }

    return (
      `${coinDetails.name} (${coinDetails.symbol.toUpperCase()})\n\n` +
      `💰 Precio: $${price} USD\n` +
      `${changeEmoji} Cambio 24h: ${change24h}%\n` +
      `📊 Cap. de mercado: $${marketCap}B\n` +
      `🏆 Ranking: #${coinDetails.market_cap_rank || 'N/A'}` +
      blockchainInfo +
      description +
      `\n\n¿Necesitas más información?`
    );
  }

  private formatPlatformName(platform: string): string {
    const platformMap: Record<string, string> = {
      'ethereum': '⟠ Ethereum',
      'binance-smart-chain': '🔶 BSC',
      'polygon-pos': '🟣 Polygon',
      'arbitrum-one': '🔵 Arbitrum',
      'optimistic-ethereum': '🔴 Optimism',
      'avalanche': '🔺 Avalanche',
      'base': '🔷 Base',
      'solana': '◎ Solana',
    };
    
    return platformMap[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  }

  private formatLargeNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  // Original command handlers
  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const message =
      `¡Bienvenido al Circle Wallet Bot! 🎙️\n\n` +
      `Elige tu método preferido:\n\n` +
      `💬 **Comandos de Texto:**\n` +
      `/createWallet - Crear wallet\n` +
      `/address - Ver dirección\n` +
      `/balance - Revisar balance USDC\n` +
      `/send <address> <amount> - Enviar USDC\n` +
      `/swap <token> <amount> <maxUSDC> - Intercambiar tokens\n` +
      `/network <network> - Cambiar red\n` +
      `/networks - Listar redes\n` +
      `/cctp <network> <address> <amount> - Transferencia entre cadenas\n\n` +
      `📊 **Datos de Mercado (MCP-Powered):**\n` +
      `/rwa [query] - Consultas sobre tokens RWA\n` +
      `/gainers - Top ganadores/perdedores\n` +
      `/chart <coin> [days] - Ver gráficos\n` +
      `/mcpstatus - Estado de conexión MCP\n\n` +
      `🎤 **O usa mensajes de voz:**\n` +
      `"Crear una wallet"\n` +
      `"Revisar mi balance"\n` +
      `"Enviar 10 USDC a 0x..."\n` +
      `"Cambiar por oro" 🪙\n` +
      `"¿Cuáles son los tokens que más subieron?"\n` +
      `"Muéstrame el precio de ONDO"\n\n` +
      `👆 ¡Usa voz, texto o lenguaje natural como prefieras!`;

    await this.bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  }

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
      await this.bot.sendMessage(chatId, `Uso: /network <nombre>`);
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
        throw new Error("Formato inválido. Usa: /send <address> <amount>");
      }

      const [destinationAddress, amount] = parts as [`0x${string}`, string];
      await this.executeSend(chatId, Number(userId), destinationAddress, amount);
    } catch (error: unknown) {
      console.error("Error sending transaction:", error);
      await this.bot.sendMessage(
        chatId,
        `❌ Error: ${(error as any)?.message ?? "Falló al enviar transacción"}`
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
        await this.bot.sendMessage(chatId, "Formato inválido. Usa: /cctp <network> <address> <amount>");
        return;
      }

      const [destinationNetwork, destinationAddress, amount] = parts;
      const upperNetwork = destinationNetwork.toUpperCase();

      if (!isDomainKey(upperNetwork)) {
        await this.bot.sendMessage(
          chatId,
          `❌ Red de destino no soportada: ${destinationNetwork}.`
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
        `❌ Error: ${(error as any)?.message ?? "Falló transferencia entre cadenas"}`
      );
    }
  }

  private async handleSwap(msg: TelegramBot.Message, match?: RegExpExecArray | null): Promise<void> {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id ?? "");

    try {
      const raw = match?.[1] ?? "";
      const parts = raw.split(" ").filter(Boolean);

      if (parts.length !== 3) {
        await this.bot.sendMessage(
          chatId,
          "❌ Formato inválido.\n\nUso: /swap <token> <amount> <maxUSDC>\n" +
            "Ejemplo: /swap WETH 0.5 1200\n\n" +
            "Esto intercambiará hasta 1200 USDC por exactamente 0.5 WETH"
        );
        return;
      }

      const [outputToken, amountOut, maxUSDCIn] = parts;

      const upperToken = outputToken.toUpperCase();
      if (!["WETH", "DAI", "ETH", "UNI", "GOLD"].includes(upperToken)) {
        await this.bot.sendMessage(
          chatId,
          `❌ Token no soportado: ${outputToken}\n\nSoportados: WETH, DAI, UNI (o "gold" 🪙)`
        );
        return;
      }

      let normalizedToken = upperToken;
      if (upperToken === "ETH") normalizedToken = "WETH";
      if (upperToken === "GOLD") normalizedToken = "UNI";

      await this.executeSwap(
        chatId,
        Number(userId),
        normalizedToken,
        amountOut,
        maxUSDCIn
      );
    } catch (error: unknown) {
      console.error("Error in swap:", error);
      await this.bot.sendMessage(
        chatId,
        `❌ Error: ${(error as any)?.message ?? "Falló el swap"}`
      );
    }
  }
}

const telegramService = new TelegramService();
export default telegramService;