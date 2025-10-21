import networks from "@/data/networks.json";
import { CCTP } from "@/config/cctp";

type Networks = typeof networks;
export type NetworkKey = keyof Networks;
type NetworkInfo = Networks[NetworkKey];

class NetworkService {
  private currentNetwork: NetworkKey;

  constructor() {
    this.currentNetwork = "BASE-SEPOLIA";
  }

  setNetwork(networkName: NetworkKey): NetworkInfo {
    if (networks[networkName]) {
      this.currentNetwork = networkName;
      return networks[networkName];
    }
    throw new Error("Invalid network");
  }

  getCurrentNetwork(): NetworkInfo {
    return networks[this.currentNetwork];
  }

  getAllNetworks(): Networks {
    return networks;
  }

  isValidNetwork(networkName: string): boolean {
    return Boolean(
      CCTP.domains[networkName as keyof typeof CCTP.domains]
    );
  }
}

const networkService = new NetworkService();

export default networkService;