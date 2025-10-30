import { NextRequest, NextResponse } from "next/server";

import circleService from "@/services/circleService";
import storageService from "@/services/storageService";
import networkService, { type NetworkKey } from "@/services/networkService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isNetworkKey = (value: string): value is NetworkKey => {
  const networks = networkService.getAllNetworks();
  return Object.prototype.hasOwnProperty.call(networks, value);
};

export async function POST(req: NextRequest) {
  let previousNetworkName: string | undefined;
  let selectedNetworkKey: NetworkKey | undefined;

  try {
    const { telegramUserId, network } = await req.json();

    if (!telegramUserId) {
      return NextResponse.json({ error: "telegramUserId is required" }, { status: 400 });
    }

    const userId = String(telegramUserId);

    const currentNetworkInfo = networkService.getCurrentNetwork();
    previousNetworkName = currentNetworkInfo.name;
    let targetNetworkName = previousNetworkName;

    if (typeof network === "string" && network.trim().length) {
      const upper = network.trim().toUpperCase();
      if (!isNetworkKey(upper)) {
        return NextResponse.json({ error: `Unsupported network: ${network}` }, { status: 400 });
      }
      selectedNetworkKey = upper;
      targetNetworkName = upper;
      if (selectedNetworkKey !== previousNetworkName) {
        networkService.setNetwork(selectedNetworkKey);
      }
    }

    const existingWallets = storageService.getWallet(userId) || {};
    const existingWallet = existingWallets[targetNetworkName];

    if (existingWallet) {
      return NextResponse.json(
        {
          success: true,
          walletId: existingWallet.walletId,
          address: existingWallet.address,
          network: targetNetworkName,
          existingWallet: true,
        },
        { status: 200 }
      );
    }

    await circleService.init();
    const walletResponse = await circleService.createWallet();
    const firstWallet = walletResponse?.walletData?.data?.wallets?.[0];

    if (!firstWallet) {
      throw new Error("Failed to create wallet: missing wallet data from Circle API");
    }

    storageService.saveWallet(userId, {
      ...existingWallets,
      [targetNetworkName]: {
        walletId: walletResponse.walletId,
        address: firstWallet.address,
      },
    });

    return NextResponse.json(
      {
        success: true,
        walletId: walletResponse.walletId,
        address: firstWallet.address,
        network: targetNetworkName,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating Telegram wallet:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (selectedNetworkKey && previousNetworkName && selectedNetworkKey !== previousNetworkName) {
      networkService.setNetwork(previousNetworkName as NetworkKey);
    }
  }
}
