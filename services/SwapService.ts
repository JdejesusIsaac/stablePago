// services/SwapService.ts
import circleService, { type CircleBlockchain } from "./circleService";
import networkService from "./networkService";

/** Uniswap V2 Router addresses */
const UNISWAP_ROUTERS: Partial<Record<CircleBlockchain, `0x${string}`>> = {
  "ETH": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "ETH-SEPOLIA": "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
  "BASE": "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
  "BASE-SEPOLIA": "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
  "ARB": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "ARB-SEPOLIA": "0x101F443B4d1b059569D643917553c771E1b9663E",
};

/** Token addresses per network */
const TOKENS: Partial<Record<CircleBlockchain, {
  USDC: `0x${string}`;
  WETH: `0x${string}`;
  DAI?: `0x${string}`;
  UNI?: `0x${string}`;
}>> = {
  "ETH": {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  "ETH-SEPOLIA": {
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    WETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
  },
  "BASE-SEPOLIA": {
    USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    WETH: "0x4200000000000000000000000000000000000006",
    UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  },
  "ARB-SEPOLIA": {
    USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    WETH: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",
  },
};

type FeeLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SwapParams {
  walletId: string;
  walletAddress: `0x${string}`;
  outputToken: "WETH" | "DAI" | "UNI" | string;
  amountOut: string; // Human units (e.g., "1.5")
  maxUSDCIn: string; // Human units (e.g., "2000")
  slippageBps?: number;
  deadlineMinutes?: number;
  feeLevel?: FeeLevel;
}

export interface SwapResult {
  approveTxId: string;
  swapTxId: string;
  outputAmount: string;
  maxUSDCSpent: string;
  path: string[];
  network: string;
}

class SwapService {
  /** Get router for current network */
  private getRouter(): `0x${string}` {
    const network = networkService.getCurrentNetwork();
    const router = UNISWAP_ROUTERS[network.name as CircleBlockchain];
    if (!router) {
      throw new Error(`Uniswap not supported on ${network.name}`);
    }
    return router;
  }

  /** Get tokens for current network */
  private getTokens() {
    const network = networkService.getCurrentNetwork();
    const tokens = TOKENS[network.name as CircleBlockchain];
    if (!tokens) {
      throw new Error(`Tokens not configured for ${network.name}`);
    }
    return tokens;
  }

  /** Convert to base units */
  private toBaseUnits(amount: string, decimals: number): string {
    const [whole, frac = ""] = amount.split(".");
    const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
    return (BigInt(whole) * BigInt(10 ** decimals) + BigInt(fracPadded || "0")).toString();
  }

  /** Approve USDC for router */
  async approveUSDC(
    walletId: string,
    amount: string,
    feeLevel: FeeLevel = "LOW"
  ): Promise<string> {
    const sdk = await circleService.init();
    const tokens = this.getTokens();
    const router = this.getRouter();
    const amountBase = this.toBaseUnits(amount, 6); // USDC = 6 decimals

    const cipher = await (sdk as any).generateEntitySecretCiphertext();
    const response = await (sdk as any).createContractExecutionTransaction({
      walletId,
      entitySecretCiphertext: cipher,
      contractAddress: tokens.USDC,
      abiFunctionSignature: "approve(address,uint256)",
      abiParameters: [router, amountBase],
      fee: { type: "level", config: { feeLevel } },
    });

    return response.data.id;
  }

  /** Execute swap */
  async swap(params: SwapParams): Promise<SwapResult> {
    const {
      walletId,
      walletAddress,
      outputToken,
      amountOut,
      maxUSDCIn,
      slippageBps = 100,
      deadlineMinutes = 30,
      feeLevel = "MEDIUM",
    } = params;

    const sdk = await circleService.init();
    const tokens = this.getTokens();
    const router = this.getRouter();
    const network = networkService.getCurrentNetwork();

    // Determine output token
    let outputAddr: `0x${string}`;
    let outputDecimals: number;

    if (outputToken === "WETH") {
      outputAddr = tokens.WETH;
      outputDecimals = 18;
    } else if (outputToken === "DAI" && tokens.DAI) {
      outputAddr = tokens.DAI;
      outputDecimals = 18;
    } else if (outputToken === "UNI" && tokens.UNI) {
      outputAddr = tokens.UNI;
      outputDecimals = 18;
    } else {
      const supportedTokens = ["WETH"];
      if (tokens.DAI) supportedTokens.push("DAI");
      if (tokens.UNI) supportedTokens.push("UNI");
      throw new Error(
        `Unsupported token: ${outputToken}\n` +
        `Supported tokens on ${network.name}: ${supportedTokens.join(", ")}`
      );
    }

    // Build path - UNI uses same route as other tokens (USDC -> WETH -> Token)
    const path: `0x${string}`[] =
      outputToken === "WETH"
        ? [tokens.USDC, tokens.WETH]
        : [tokens.USDC, tokens.WETH, outputAddr];

    // Convert amounts
    const amountOutBase = this.toBaseUnits(amountOut, outputDecimals);
    const maxUSDCBase = this.toBaseUnits(maxUSDCIn, 6);

    // Add slippage
    const maxWithSlippage = (
      (BigInt(maxUSDCBase) * BigInt(10000 + slippageBps)) /
      BigInt(10000)
    ).toString();

    // Deadline
    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;

    // Step 1: Approve
    console.log("📝 Approving USDC for Uniswap...");
    let approveTxId: string;
    try {
      approveTxId = await this.approveUSDC(walletId, maxUSDCIn, "LOW");
      await (circleService as any).waitForTxConfirmed(approveTxId);
      console.log("✅ USDC approved");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Approval failed: ${errMsg}\n\n` +
        `This could mean:\n` +
        `• Insufficient balance in wallet\n` +
        `• Network congestion\n` +
        `• Invalid wallet ID`
      );
    }

    // Step 2: Swap
    console.log("🔄 Executing swap...");
    try {
      const swapCipher = await (sdk as any).generateEntitySecretCiphertext();
      const swapResponse = await (sdk as any).createContractExecutionTransaction({
        walletId,
        entitySecretCiphertext: swapCipher,
        contractAddress: router,
        abiFunctionSignature:
          "swapTokensForExactTokens(uint256,uint256,address[],address,uint256)",
        abiParameters: [
          amountOutBase,
          maxWithSlippage,
          path,
          walletAddress,
          deadline.toString(),
        ],
        fee: { type: "level", config: { feeLevel } },
      });

      await (circleService as any).waitForTxConfirmed(swapResponse.data.id);
      console.log("✅ Swap completed");

      return {
        approveTxId,
        swapTxId: swapResponse.data.id,
        outputAmount: amountOut,
        maxUSDCSpent: maxUSDCIn,
        path: path.map((p) => p),
        network: network.name as string,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      
      // Parse common swap failure reasons
      if (errMsg.includes("INSUFFICIENT") || errMsg.includes("insufficient")) {
        throw new Error(
          `❌ Insufficient USDC balance\n\n` +
          `Required: ${maxUSDCIn} USDC (max with slippage)\n` +
          `Please check your wallet balance and try again.`
        );
      }
      
      if (errMsg.includes("EXPIRED") || errMsg.includes("expired")) {
        throw new Error(
          `❌ Transaction expired\n\n` +
          `The swap took too long and the deadline passed.\n` +
          `Try again with a longer deadline.`
        );
      }
      
      if (errMsg.includes("slippage") || errMsg.includes("SLIPPAGE")) {
        throw new Error(
          `❌ Price moved too much (slippage)\n\n` +
          `The token price changed and now requires more than ${maxUSDCIn} USDC.\n` +
          `Try:\n` +
          `• Increasing maxUSDCIn amount\n` +
          `• Reducing the amount of ${outputToken} you want to buy\n` +
          `• Waiting for less volatile market conditions`
        );
      }
      
      throw new Error(
        `Swap execution failed: ${errMsg}\n\n` +
        `Common issues:\n` +
        `• Price moved (slippage too high)\n` +
        `• Insufficient liquidity in the pool\n` +
        `• Allowance issue despite approval\n` +
        `• Invalid swap parameters`
      );
    }
  }

  /** Check if swaps supported on current network */
  isSupported(): boolean {
    try {
      this.getRouter();
      return true;
    } catch {
      return false;
    }
  }
}

const swapService = new SwapService();
export default swapService;