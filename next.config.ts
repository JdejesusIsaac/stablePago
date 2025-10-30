import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Ensure third-party CommonJS packages are transpiled for ESM compatibility
  transpilePackages: [
    "@crossmint/client-sdk-react-ui",
    "@dynamic-labs/ethereum",
    "@walletconnect/ethereum-provider",
    "@walletconnect/universal-provider",
    "@walletconnect/logger",
    "@metamask/sdk",
    "elevenlabs",
    "libsodium-wrappers",
    "node-forge",
    "pino",
  ],

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["@heroicons/react"],
  },

   webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...config.externals,
        "@circle-fin/developer-controlled-wallets",
        "@circle-fin/smart-contract-platform",
      ];
    }
    return config;
  },
};

export default nextConfig;
