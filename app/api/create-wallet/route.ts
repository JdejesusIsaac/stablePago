import { NextRequest, NextResponse } from "next/server";

const CROSSMINT_SERVER_SIDE_API_KEY = process.env.CROSSMINT_SERVER_SIDE_API_KEY as string;
const CROSSMINT_ENV = process.env.CROSSMINT_ENV || "staging";

/**
 * POST /api/create-wallet
 * Create a Crossmint wallet for an email address (for recipients)
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!CROSSMINT_SERVER_SIDE_API_KEY) {
      console.error("CROSSMINT_SERVER_SIDE_API_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create wallet using Crossmint API (use staging/production based on env)
    // Using the stable 2022-06-09 API endpoint as per docs
    const apiUrl = `https://${CROSSMINT_ENV}.crossmint.com/api/2022-06-09/wallets`;
    
    console.log(`Creating wallet for ${email} at ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "X-API-KEY": CROSSMINT_SERVER_SIDE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "evm-smart-wallet",
        // Link wallet to user's email
        linkedUser: `email:${email}`,
        config: {
          adminSigner: {
            // Use 'email' type for email-linked wallets (allows login with email)
            type: "email",
            email: email, // The email address that can sign transactions
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Crossmint API error:", data);
      
      // Check if wallet already exists
      if (response.status === 409 || data.message?.includes("already exists")) {
        return NextResponse.json(
          { 
            error: "A wallet already exists for this email address",
            existingWallet: true 
          },
          { status: 409 }
        );
      }
      
      throw new Error(data.message || "Failed to create wallet");
    }

    return NextResponse.json({
      success: true,
      walletAddress: data.address,
      userId: data.linkedUser,
      message: "Wallet created successfully",
    });
  } catch (error: any) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create wallet" },
      { status: 500 }
    );
  }
}

