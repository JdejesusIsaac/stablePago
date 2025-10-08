<div align="center">
<img width="200" alt="Image" src="https://github.com/user-attachments/assets/8b617791-cd37-4a5a-8695-a7c9018b7c70" />
<br>
<br>
<h1>StablePago</h1>

<div align="center">
<a href="https://docs.crossmint.com/">Crossmint Docs</a> | <a href="https://developers.circle.com/">Circle Docs</a> | <a href="https://t.me/crossmintdevs">Join Crossmint Telegram</a> 
</div>


</div>



## Table of contents

- [Introduction](#introduction)
- [Setup](#setup)
- [Features](#features)
  - [Wallet Creation for Email Addresses](#wallet-creation-for-email-addresses)
  - [Telegram Shopping Delegation](#telegram-shopping-delegation)
  - [Withdraw to Bank (Circle)](#withdraw-to-bank-circle)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Using another chain](#using-another-chain)
- [Using in production](#using-in-production)

## Introduction

**StablePago** is a hybrid settlement layer that connects stablecoins (on-chain liquidity) with local fiat rails, starting in Puerto Rico and the Dominican Republic. Built on **[Crossmint](https://crossmint.com)** wallets and **[Circle](https://www.circle.com/)** payouts.

**Mission**: Bridge stablecoin speed with local fiat rails, starting in Puerto Rico.

**MVP Flow**: 
```
USDC in → send to recipient's email → recipient can withdraw to PR bank via Circle
```

**Key features**

- 🔐 **Login with email or social media** - Crossmint authentication
- 💼 **Non-custodial wallets** - Automatically created for users
- 💳 **Top up with USDC** - Using credit or debit card via Crossmint
- 📧 **Transfer USDC by email** - Send to any email address
- 🏦 **Withdraw to bank** - Circle payouts to local bank accounts (USD)
- 👤 **Create wallets for recipients** - Generate wallets for email addresses (e.g., onboard "Grandma")
- 🤖 **Telegram Shopping Bot Integration** - Delegate wallet permissions with spending limits
- 📊 **Activity Feed** - View all wallet transactions
- 🌐 **Multi-chain support** - Solana, EVM, and +40 other chains

**Tech Stack**

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Wallets**: Crossmint (non-custodial smart wallets)
- **Payments**: Circle Mint/Core API (bank payouts)
- **Database**: Supabase (PostgreSQL)
- **Delegation**: Crossmint Wallet Delegation SDK

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/JdejesusIsaac/stablePago.git
cd stablePago/fintech-starter-app
```

### 2. Install dependencies

```bash
pnpm install
# or npm install / yarn install / bun install
```

### 3. Set up Crossmint

1. Login to the <a href="https://staging.crossmint.com/console" target="_blank">Crossmint staging console</a>
2. Get your API keys from the <a href="https://staging.crossmint.com/console/overview" target="_blank">overview page</a>
3. Create a `.env.local` file with:

```env
# Crossmint (required)
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=your_client_api_key
CROSSMINT_SERVER_SIDE_API_KEY=your_server_api_key
CROSSMINT_ENV=staging  # or 'production'

# Chain configuration
NEXT_PUBLIC_CHAIN_ID=base-sepolia
NEXT_PUBLIC_USDC_MINT=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### 4. Set up Supabase

1. Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a>
2. Add Supabase credentials to `.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. Run migrations:

```bash
# Copy SQL files from supabase/migrations/ to your Supabase SQL Editor
# Or use the Supabase CLI:
supabase db push
```

### 5. Set up Circle (Optional - for bank withdrawals)

1. Create a Circle account at <a href="https://console.circle.com" target="_blank">Circle Console</a>
2. Get your API key
3. Add to `.env.local`:

```env
# Circle (optional - for withdrawals)
CIRCLE_BASE_URL=https://api-sandbox.circle.com
CIRCLE_API_KEY=your_circle_api_key
PAYMENTS_CIRCLE_ENABLED=true
```

### 6. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Features

### Wallet Creation for Email Addresses

Create Crossmint wallets for any email address directly from the dashboard. Perfect for onboarding recipients like "Grandma" who need a wallet to receive USDC.

**How to use:**
1. Click the menu (⋮) on the dashboard
2. Select "Create Wallet for Email"
3. Enter the recipient's email address
4. The wallet is created instantly and linked to that email

**API Endpoint:** `POST /api/create-wallet`

```typescript
// Request
{ "email": "grandma@example.com" }

// Response
{ "walletAddress": "0x...", "message": "Wallet created successfully" }
```

**Database Tracking:**
- Tracks who created the wallet (`creator_user_id`)
- Tracks when the wallet was created
- Ready for future rate limiting (currently disabled)

---

### Telegram Shopping Delegation

Delegate wallet permissions to a Telegram bot with spending limits. Users can shop via Telegram, and the bot can execute transactions on their behalf within the specified limits.

**How it works:**
1. User sets up delegation from the dashboard
2. Defines spending limits (per transaction, daily, weekly, monthly)
3. Telegram bot receives delegated signing permission
4. Bot can sign transactions within limits (no user confirmation needed)

**Delegation Configuration:**
```typescript
{
  chain: "base-sepolia",
  delegateAddress: "0xTELEGRAM_BOT_ADDRESS",
  spendLimits: {
    perTransaction: "10",   // $10 per tx
    daily: "50",            // $50 per day
    weekly: "200",          // $200 per week
    monthly: "500"          // $500 per month
  }
}
```

**UI Components:**
- **DelegationCard** - Prominently displayed on dashboard
- **DelegationSetup** - Configure new delegation
- **DelegationManager** - View and manage existing delegations

**Database:**
- `delegations` table tracks all delegation relationships
- `delegation_spend_counters` tracks spending against limits
- Automatic reset logic for daily/weekly/monthly counters

**Telegram Bot Integration:**
See the [crossmint-checkout-telegram-agent](https://github.com/Crossmint/examples/tree/main/apps/wallets/delegation/crossmint-checkout-telegram-agent) example for bot implementation.

---

### Withdraw to Bank (Circle)

Withdraw USDC to a bank account using Circle's payout infrastructure. Currently supports wire transfers to US banks (Puerto Rico included).

**How to use:**
1. Click the menu (⋮) on the dashboard
2. Select "Withdraw to Bank"
3. First time: Add bank details (routing number, account number)
4. Enter amount and confirm
5. Track payout status in real-time

**Circle Flow:**
1. Create bank beneficiary (first time only)
2. Create payout request
3. Circle processes the transfer
4. Funds arrive in bank account (1-2 business days)

**Database:**
- `bank_beneficiaries` - Stores linked bank accounts
- `fiat_payouts` - Tracks payout status (pending → processing → succeeded/failed)

**API Endpoints:**
- `POST /api/circle/create-beneficiary` - Link bank account
- `POST /api/circle/create-payout` - Initiate withdrawal
- `GET /api/circle/payout-status/:id` - Check status

**Circle Requirements:**
- API key from Circle Console
- Travel Rule compliance for payouts ≥ $3,000 (identity verification)
- Sufficient balance in Circle account

---

## Environment Variables

### Required

```env
# Crossmint
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=pk_staging_...  # Client-side API key
CROSSMINT_SERVER_SIDE_API_KEY=sk_staging_...         # Server-side API key
CROSSMINT_ENV=staging                                # or 'production'

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=base-sepolia                    # Chain to use
NEXT_PUBLIC_USDC_MINT=0x036CbD53842c5426634e7929541eC2318f3dCF7e  # USDC address

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...               # Server-side only
```

### Optional

```env
# Circle (for bank withdrawals)
CIRCLE_BASE_URL=https://api-sandbox.circle.com     # or https://api.circle.com for production
CIRCLE_API_KEY=SAND_API_KEY...
PAYMENTS_CIRCLE_ENABLED=true

# Telegram Delegation (for shopping bot)
NEXT_PUBLIC_TELEGRAM_BOT_ADDRESS=0x...             # Bot's wallet address

# Wallet Creation Limits (not enforced yet)
MAX_WALLETS_PER_USER_PER_DAY=5
MAX_WALLETS_PER_USER_TOTAL=50
```

---

## Database Setup

### Migrations

Run these migrations in your Supabase SQL Editor (in order):

1. **`20250108_telegram_shopping.sql`** - Delegation tables
   - `delegations` - Delegation relationships
   - `delegation_spend_counters` - Spending tracking

2. **`20250108_wallet_creation_tracking.sql`** - Wallet creation tracking
   - `wallet_creations` - Track who creates wallets

3. **Circle tables** (if using withdrawals):
   - `bank_beneficiaries` - Linked bank accounts
   - `fiat_payouts` - Payout history

### Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- View their own records
- Insert their own records
- Admin operations use service role key

---

## Using another chain

To use another chain, you'll need to:

1. Update the chain environment variable to the chain you want to use.

```env
NEXT_PUBLIC_CHAIN_ID=solana  # or polygon, ethereum, arbitrum, etc.
```

2. Update the USDC locator to the USDC of the chain you want to use.

```env
# For solana: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
# For ethereum: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
# For base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_USDC_MINT=your_USDC_address
```

Supported chains: Solana, Ethereum, Base, Polygon, Arbitrum, Optimism, and 40+ more.

---

## Using in production

To deploy StablePago to production:

### 1. Crossmint Production Setup

1. Login to the [Crossmint production console](https://www.crossmint.com/console)
2. Create production API keys with these scopes:
   - `users.create`, `users.read`
   - `wallets.read`, `wallets.create`
   - `wallets:transactions.create`, `wallets:transactions.sign`, `wallets:transactions.read`
   - `wallets:balance.read`
   - `wallets.fund`
   - `wallets:signers.create`, `wallets:signers.read` (for delegation)

3. Update `.env.local`:
```env
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=pk_live_...
CROSSMINT_SERVER_SIDE_API_KEY=sk_live_...
CROSSMINT_ENV=production
```

4. Customize email templates in Console → Settings → Branding

**⚠️ Note**: Non-custodial signers for Solana are undergoing security audit. Join [Telegram](https://t.me/crossmintdevs) for updates.

### 2. Update Chain to Mainnet

```env
NEXT_PUBLIC_CHAIN_ID=base  # or ethereum, polygon, etc.
NEXT_PUBLIC_USDC_MINT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  # Base USDC
```

### 3. Circle Production Setup

1. Complete KYB (Know Your Business) verification with Circle
2. Get production API key from [Circle Console](https://console.circle.com)
3. Update `.env.local`:

```env
CIRCLE_BASE_URL=https://api.circle.com
CIRCLE_API_KEY=LIVE_API_KEY...
PAYMENTS_CIRCLE_ENABLED=true
```

4. Test with small amounts first
5. Implement Travel Rule compliance for payouts ≥ $3,000

### 4. Supabase Production

1. Create a production Supabase project
2. Run all migrations
3. Enable RLS on all tables
4. Set up backups and monitoring
5. Update environment variables

### 5. Deployment Checklist

- [ ] Crossmint production API keys configured
- [ ] Supabase production database set up
- [ ] Circle production API configured (if using withdrawals)
- [ ] Environment variables set in Vercel/hosting platform
- [ ] Domain configured and SSL enabled
- [ ] Email templates customized
- [ ] Test all flows: signup → deposit → send → withdraw
- [ ] Monitor error logs and transactions
- [ ] Set up alerting for failed transactions

### 6. Compliance & Security

**For Puerto Rico Operations:**
- Ensure compliance with local money transmission laws
- Implement proper KYC/AML procedures
- Set up transaction monitoring
- Maintain audit logs in Supabase
- Review Circle's Travel Rule requirements

**Recommended:**
- Set up rate limiting (enable wallet creation limits)
- Implement fraud detection
- Add two-factor authentication
- Regular security audits
- Incident response plan

---

## Support

- **Crossmint**: [Telegram](https://t.me/crossmintdevs) | [Docs](https://docs.crossmint.com/)
- **Circle**: [Support](https://support.circle.com/) | [Docs](https://developers.circle.com/)
- **StablePago**: Open an issue on [GitHub](https://github.com/JdejesusIsaac/stablePago)


