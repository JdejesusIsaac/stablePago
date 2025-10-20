import "dotenv/config";
import { generateEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";



async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    throw new Error("Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET in environment variables");
  }

  const response = await generateEntitySecretCiphertext({
    apiKey,
    entitySecret,
  });

  const ciphertext =
    typeof response === "string"
      ? response
      : (response as { entitySecretCiphertext?: string }).entitySecretCiphertext;

  if (!ciphertext) {
    console.warn("Entity secret ciphertext not returned. Response:", response);
    return;
  }

  console.log("Entity Secret Ciphertext:", ciphertext);
}

main().catch((err) => {
  console.error("Failed to generate entity secret ciphertext:", err);
  process.exitCode = 1;
});