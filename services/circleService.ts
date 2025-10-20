// services/CircleService.ts
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { pad } from "viem";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

import config from "@/config";
import networkService from "@/services/networkService";
import { CCTP, type DomainKey } from "@/config/cctp";

export type CircleBlockchain =
  | "ETH"
  | "ETH-SEPOLIA"
  | "AVAX"
  | "AVAX-FUJI"
  | "ARB"
  | "ARB-SEPOLIA"
  | "MATIC"
  | "MATIC-AMOY"
  | "SOL"
  | "SOL-DEVNET"
  | "BASE"
  | "BASE-SEPOLIA";

const DomainToCircle: Record<DomainKey, CircleBlockchain> = {
  "ETH-SEPOLIA": "ETH-SEPOLIA",
  "AVAX-FUJI": "AVAX-FUJI",
  "ARB-SEPOLIA": "ARB-SEPOLIA",
  "BASE-SEPOLIA": "BASE-SEPOLIA",
  "MATIC-AMOY": "MATIC-AMOY",
};

/** Minimal Telegram bot surface we rely on */
type Bot = {
  sendMessage(chatId: string | number, text: string): Promise<unknown> | unknown;
};

/** Circle Wallets SDK – minimal surfaces we call.
 * If you have official types, import them instead and remove this.
 */
type FeeLevel = "LOW" | "MEDIUM" | "HIGH";

interface CreateWalletSetResponse {
  data: { walletSet?: { id?: string } };
}
interface CreateWalletsResponse {
  data: { wallets: { id: string; address: `0x${string}` }[] };
}
interface CreateTxResponse {
  data: { id: string };
}
interface GetTxResponse {
  data: { transaction: { state: "INITIATED" | "QUEUED" | "CONFIRMED" | "FAILED"; txHash?: string } };
}

interface WalletsClient {
  createWalletSet(args: { name: string }): Promise<CreateWalletSetResponse>;
  createWallets(args: {
    idempotencyKey: string;
    blockchains: CircleBlockchain[];
    accountType: "EOA" | "SCA";
    walletSetId: string;
  }): Promise<CreateWalletsResponse>;
  createTransaction(args: {
    walletId: string;
    tokenId: string;
    destinationAddress: string;
    amounts: [string] | string[];
    fee: { type: "level"; config: { feeLevel: FeeLevel } };
  }): Promise<CreateTxResponse>;
  createContractExecutionTransaction(args: {
    walletId: string;
    entitySecretCiphertext: string;
    contractAddress: `0x${string}`;
    abiFunctionSignature: string;
    abiParameters: unknown[];
    fee: { type: "level"; config: { feeLevel: FeeLevel } };
  }): Promise<CreateTxResponse>;
  getTransaction(args: { id: string }): Promise<GetTxResponse>;
  generateEntitySecretCiphertext(): Promise<string>;
}

/** Network data we expect from networkService */
interface CurrentNetwork {
  name: DomainKey;
  usdcTokenId: string; // Circle tokenId (W3S), not ERC-20 address
  label?: string;
}

/** Attestation payload from Iris */
interface AttestationResult {
  message: `0x${string}`;
  attestation: `0x${string}`;
}

/** CircleService: wallet & CCTP orchestration */
export class CircleService {
  private walletSDK: WalletsClient | null = null;
  private bot: Bot;

  constructor(bot: Bot) {
    if (!config?.circle?.apiKey || !config?.circle?.entitySecret) {
      throw new Error("Circle API key or entity secret is missing");
    }
    this.bot = bot;
  }

  /** Initialize SDK once */
  async init(): Promise<WalletsClient> {
    if (this.walletSDK) return this.walletSDK;
    try {
      this.walletSDK = initiateDeveloperControlledWalletsClient({
        apiKey: config.circle.apiKey,
        entitySecret: config.circle.entitySecret,
      }) as unknown as WalletsClient;
      return this.walletSDK;
    } catch (err: any) {
      throw new Error(`Failed to initialize Circle SDK: ${err?.message ?? String(err)}`);
    }
  }

  /** Utility: parse decimal "1.23" -> bigint base units (6 decimals for USDC) */
  private toBaseUnits(amount: string, decimals = 6): bigint {
    // Strip spaces
    const n = amount.trim();
    if (!/^\d+(\.\d+)?$/.test(n)) throw new Error(`Invalid amount: ${amount}`);
    const [whole, frac = ""] = n.split(".");
    const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(fracPadded || "0");
  }

  /** Convert address to bytes32 (left-padded) */
  private addressToBytes32(address: `0x${string}`): `0x${string}` {
    return pad(address, { size: 32 });
  }

  /** Create a new wallet and return its id + raw response */
  async createWallet(): Promise<{ walletId: string; walletData: CreateWalletsResponse }> {
    const sdk = await this.init();

    // Create Wallet Set
    let walletSetResponse: CreateWalletSetResponse;
    try {
      walletSetResponse = await sdk.createWalletSet({ name: "WalletSet 1" });
    } catch (err: any) {
      const errorDetails = err?.response?.data ? JSON.stringify(err.response.data) : String(err);
      throw new Error(`Circle createWalletSet failed: ${errorDetails}`);
    }
    const walletSetId = walletSetResponse.data?.walletSet?.id;
    if (!walletSetId) throw new Error("Circle did not return a walletSet id");

    const currentNetwork = networkService.getCurrentNetwork() as CurrentNetwork;
    const accountType: "EOA" | "SCA" = currentNetwork.name.startsWith("AVAX") ? "EOA" : "SCA";

    const blockchain = DomainToCircle[currentNetwork.name];
    if (!blockchain) {
      throw new Error(`Unsupported network: ${currentNetwork.name}`);
    }

    // Create wallet
    const walletData = await sdk.createWallets({
      idempotencyKey: uuidv4(),
      blockchains: [blockchain],
      accountType,
      walletSetId,
    });

    const walletId = walletData.data.wallets?.[0]?.id;
    if (!walletId) throw new Error("Circle did not return a wallet id");
    return { walletId, walletData };
  }

  /** Read wallet balance for current network’s USDC */
  async getWalletBalance(walletId: string): Promise<{ usdc: string; network: DomainKey }> {
    const network = networkService.getCurrentNetwork() as CurrentNetwork;

    const resp = await axios.get(
      `https://api.circle.com/v1/w3s/wallets/${walletId}/balances`,
      { headers: { Authorization: `Bearer ${config.circle.apiKey}` } }
    );

    const balances: Array<{ token: { id: string }; amount: string }> =
      resp.data?.data?.tokenBalances ?? [];

    const usdcBalance =
      balances.find((b) => b.token.id === network.usdcTokenId)?.amount ?? "0";

    return { usdc: usdcBalance, network: network.name };
  }

  /** Simple USDC transfer on the same chain */
  async sendTransaction(
    walletId: string,
    destinationAddress: `0x${string}`,
    amount: string
  ): Promise<{ id: string }> {
    const sdk = await this.init();
    const network = networkService.getCurrentNetwork() as CurrentNetwork;

    // Circle expects string amounts in token’s human units (it handles decimals),
    // but if your account requires base units, switch to toBaseUnits() and String().
    // Here we pass the human amount as provided:
    const res = await sdk.createTransaction({
      walletId,
      tokenId: network.usdcTokenId,
      destinationAddress,
      amounts: [amount],
      fee: { type: "level", config: { feeLevel: "LOW" } },
    });
    return { id: res.data.id };
  }

  /** Resolve Circle wallet id from an address */
  async getWalletId(address: `0x${string}`): Promise<string | undefined> {
    const resp = await axios.get(
      `https://api.circle.com/v1/w3s/wallets?address=${address}`,
      { headers: { Authorization: `Bearer ${config.circle.apiKey}` } }
    );
    return resp.data?.data?.wallets?.[0]?.id;
  }

  /** Approve → Burn → Attestation → Receive (cross-chain USDC via CCTP) */
  async crossChainTransfer(params: {
    walletId: string;                       // source wallet id
    destinationNetwork: DomainKey;          // dest chain key (DomainKey)
    destinationAddress: `0x${string}`;      // dest EOA/SCA address
    amount: string;                         // human units, e.g. "12.34"
    chatId: string | number;                // Telegram chat id
    destinationWalletId: string;            // dest Circle wallet id (for receive)
    minFinalityThreshold?: number;          // optional, defaults to 1000
    feeLevel?: FeeLevel;                    // optional fee level for txs
  }): Promise<{ approveTx: string; burnTx: string; receiveTx: string }> {
    const {
      walletId,
      destinationNetwork,
      destinationAddress,
      amount,
      chatId,
      destinationWalletId,
      minFinalityThreshold = 1000,
      feeLevel = "MEDIUM",
    } = params;

    const sdk = await this.init();
    const currentNetwork = networkService.getCurrentNetwork() as CurrentNetwork;

    // Base units (USDC has 6 decimals)
    const usdcAmount = this.toBaseUnits(amount, 6);

    const sourceCfg = CCTP.contracts[currentNetwork.name];
    const destCfg = CCTP.contracts[destinationNetwork];

    // Step 1: Approve
    await this.bot.sendMessage(chatId, "Step 1/4: Approving USDC transfer…");
    const approveCipher = await sdk.generateEntitySecretCiphertext();

    const approveRes = await sdk.createContractExecutionTransaction({
      walletId,
      entitySecretCiphertext: approveCipher,
      contractAddress: sourceCfg.usdc,
      abiFunctionSignature: "approve(address,uint256)",
      abiParameters: [sourceCfg.tokenMessenger, usdcAmount.toString()],
      fee: { type: "level", config: { feeLevel: "LOW" } },
    });

    await this.waitForTxConfirmed(approveRes.data.id);
    await this.bot.sendMessage(chatId, `✅ Approval confirmed: ${approveRes.data.id}`);

    // Step 2: Burn (depositForBurn)
    await this.bot.sendMessage(chatId, "Step 2/4: Initiating USDC burn…");

    const mintRecipientBytes32 = this.addressToBytes32(destinationAddress);
    const zeroBytes32 =
      "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

    // Simple 0.02% cap for relay fee – tune as needed or fetch fee quotes
    const maxFee = usdcAmount / BigInt(5000);

    const burnCipher = await sdk.generateEntitySecretCiphertext();
    const burnRes = await sdk.createContractExecutionTransaction({
      walletId,
      entitySecretCiphertext: burnCipher,
      contractAddress: sourceCfg.tokenMessenger,
      abiFunctionSignature:
        "depositForBurn(uint256,uint32,bytes32,address,bytes32,uint256,uint32)",
      abiParameters: [
        usdcAmount.toString(),
        CCTP.domains[destinationNetwork].toString(),
        mintRecipientBytes32,
        sourceCfg.usdc,
        zeroBytes32,                  // destinationCaller - none
        maxFee.toString(),
        minFinalityThreshold.toString(),
      ],
      fee: { type: "level", config: { feeLevel } },
    });

    const burnStatus = await this.waitForTxConfirmed(burnRes.data.id, true);
    await this.bot.sendMessage(chatId, `✅ Burn confirmed: ${burnRes.data.id}`);

    // Step 3: Attestation
    await this.bot.sendMessage(chatId, "Step 3/4: Waiting for attestation…");
    const txHash = burnStatus.txHash!;
    const srcDomainId = CCTP.domains[currentNetwork.name];

    const attestation = await this.waitForAttestation(String(srcDomainId), txHash);
    await this.bot.sendMessage(chatId, "✅ Attestation received!");

    // Step 4: Receive on destination chain
    await this.bot.sendMessage(chatId, "Step 4/4: Finalizing on destination chain…");

    const receiveCipher = await sdk.generateEntitySecretCiphertext();
    const receiveRes = await sdk.createContractExecutionTransaction({
      walletId: destinationWalletId,
      entitySecretCiphertext: receiveCipher,
      contractAddress: destCfg.messageTransmitter,
      abiFunctionSignature: "receiveMessage(bytes,bytes)",
      abiParameters: [attestation.message, attestation.attestation],
      fee: { type: "level", config: { feeLevel } },
    });

    await this.waitForTxConfirmed(receiveRes.data.id);
    await this.bot.sendMessage(chatId, `✅ Receive confirmed: ${receiveRes.data.id}`);

    return {
      approveTx: approveRes.data.id,
      burnTx: burnRes.data.id,
      receiveTx: receiveRes.data.id,
    };
  }

  /** Poll a Circle tx until CONFIRMED (with bounded backoff). Returns final state (and txHash if present). */
  private async waitForTxConfirmed(
    txId: string,
    captureHash = false
  ): Promise<{ state: "CONFIRMED"; txHash?: string }> {
    const sdk = await this.init();
    const maxAttempts = 40;
    let delay = 1500;

    for (let i = 0; i < maxAttempts; i++) {
      const status: GetTxResponse = await sdk.getTransaction({ id: txId });
      const st = status.data.transaction.state;
      if (st === "FAILED") throw new Error(`Transaction ${txId} failed`);
      if (st === "CONFIRMED") {
        return {
          state: "CONFIRMED",
          txHash: captureHash ? status.data.transaction.txHash : undefined,
        };
      }
      await new Promise((r) => setTimeout(r, delay));
      // Exponential-ish backoff with cap
      delay = Math.min(delay + 500, 5000);
    }
    throw new Error(`Timeout waiting for tx ${txId} to confirm`);
  }

  /** Poll Iris for attestation until complete, else timeout. */
  async waitForAttestation(srcDomainId: string, transactionHash: string): Promise<AttestationResult> {
    const maxAttempts = 30; // ~5 minutes at 10s
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${srcDomainId}?transactionHash=${transactionHash}`;

    for (let i = 1; i <= maxAttempts; i++) {
      try {
        const resp = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${config.circle.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        const msg = resp.data?.messages?.[0];
        if (msg?.status === "complete" && msg?.message && msg?.attestation) {
          return {
            message: msg.message as `0x${string}`,
            attestation: msg.attestation as `0x${string}`,
          };
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          // Non-404 should break fast; 404 = not ready
          throw new Error(`Iris attestation error: ${err?.message ?? String(err)}`);
        }
      }
      await new Promise((r) => setTimeout(r, 10_000));
    }
    throw new Error("Timeout waiting for attestation");
  }
}

const circleService = new CircleService({ sendMessage: () => Promise.resolve() });
export default circleService;
