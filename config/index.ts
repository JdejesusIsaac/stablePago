import dotenv from "dotenv";

dotenv.config();

const circleApiKey = process.env.CIRCLE_API_KEY;
const circleEntitySecret = process.env.CIRCLE_ENTITY_SECRET;

if (!circleApiKey || !circleEntitySecret) {
  throw new Error("Circle API key and entity secret must be set in environment variables");
}

const config = {
  circle: {
    apiKey: circleApiKey,
    entitySecret: circleEntitySecret,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
  },
  network: {
    name: process.env.NETWORK || "ARB-SEPOLIA",
    usdcAddress: process.env.USDC_TOKEN_ADDRESS || "0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d",
    usdcTokenId: process.env.USDC_TOKEN_ID || "4b8daacc-5f47-5909-a3ba-30d171ebad98",
  },
};

export type AppConfig = typeof config;

export default config;