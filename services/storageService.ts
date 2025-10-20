// services/storageService.ts
import * as fs from "fs";
import * as path from "path";

/** One wallet per network (e.g., "ARB-SEPOLIA") */
export type WalletEntry = {
  walletId: string;
  address: `0x${string}`;
};

/** All wallets for a single user, keyed by network name */
export type UserWallets = Record<string, WalletEntry>;

/** Entire storage file: userId -> UserWallets */
export type WalletStore = Record<string, UserWallets>;

class StorageService {
  private storageFile: string;

  constructor(customPath?: string) {
    // Allow override for tests; otherwise use ../../data/wallets.json relative to this file
    this.storageFile =
      customPath ?? path.join(__dirname, "../../data/wallets.json");
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    const dir = path.dirname(this.storageFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.storageFile)) {
      fs.writeFileSync(this.storageFile, JSON.stringify({}), "utf8");
    }
  }

  /** Persist (replace) a user's wallet map */
  saveWallet(userId: string | number, walletData: UserWallets): void {
    const data = this.getAllWallets();
    data[String(userId)] = walletData;
    fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), "utf8");
  }

  /** Read a user's wallets (or undefined if none) */
  getWallet(userId: string | number): UserWallets | undefined {
    const data = this.getAllWallets();
    return data[String(userId)];
  }

  /** Read entire store (safe on corrupt/empty files) */
  getAllWallets(): WalletStore {
    try {
      const raw = fs.readFileSync(this.storageFile, "utf8");
      const parsed = JSON.parse(raw);
      // Runtime guard: ensure object shape
      if (parsed && typeof parsed === "object") {
        return parsed as WalletStore;
      }
      return {};
    } catch {
      return {};
    }
  }
}

const storageService = new StorageService();
export default storageService;
export { StorageService };
