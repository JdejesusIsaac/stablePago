# 🏗️ StablePago Architecture Reference

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                    │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │   Login    │→ │  Dashboard  │→ │ Withdraw Modal   │    │
│  │ (Crossmint)│  │  (Balance)  │  │ (Circle/Bank)    │    │
│  └────────────┘  └─────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Server Actions (Next.js API)                   │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ Circle Actions   │  │   Webhook Handler            │   │
│  │ - createBenef... │  │   /api/webhooks/circle       │   │
│  │ - createPayout   │  └──────────────────────────────┘   │
│  │ - getStatus      │                                      │
│  └──────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
            ↓                           ↓
┌──────────────────────┐    ┌──────────────────────────────┐
│   Circle API         │    │      Supabase                │
│   - Banks/Wires      │    │   - users                    │
│   - Payouts          │    │   - bank_beneficiaries       │
│   - Webhooks         │    │   - fiat_payouts             │
└──────────────────────┘    │   - webhook_events           │
                            └──────────────────────────────┘
```

---

## File Structure

```
fintech-starter-app/
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── circle/
│   │           └── route.ts          # Circle webhook handler
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   └── providers.tsx                 # Crossmint + React Query
│
├── components/
│   ├── withdraw/
│   │   ├── BankForm.tsx              # Bank account form (PR/DR)
│   │   ├── WithdrawModal.tsx         # Main withdrawal flow
│   │   └── MockWithdrawModal.tsx     # (deprecated - was for testing)
│   ├── dashboard-summary/
│   │   └── index.tsx                 # Dashboard with withdraw button
│   ├── MainScreen.tsx                # Main app screen
│   └── ActivityFeed.tsx              # Transaction history
│
├── server-actions/
│   └── fiat/
│       └── circle-actions.ts         # Circle integration logic
│
├── lib/
│   ├── supabase/
│   │   ├── browser.ts                # Supabase browser client
│   │   └── server.ts                 # Supabase server client
│   ├── fees.ts                       # Fee calculation
│   └── utils.ts                      # Utilities
│
├── utils/
│   └── circle.ts                     # Circle API utilities
│
├── supabase/
│   └── migrations/
│       └── 20250107_init_stablepago.sql  # Database schema
│
├── middleware.ts                      # Supabase auth middleware
├── .env.local                         # Environment variables
└── SETUP.md                           # Setup guide
```

---

## Data Flow: Withdrawal Process

### **Step 1: User Adds Bank**

```
User fills BankForm
    ↓
createCircleBankBeneficiary()
    ↓
POST /v1/businessAccount/banks/wires (Circle)
    ↓
Store in Supabase.bank_beneficiaries
    ↓
Return destinationId
```

### **Step 2: User Initiates Withdrawal**

```
User enters amount in WithdrawModal
    ↓
calculateWithdrawalFee(amount)
    Fee = amount * 1.25% (minimum $1)
    ↓
User confirms
    ↓
createCirclePayout()
    ↓
POST /v1/businessAccount/payouts (Circle)
    ↓
Store in Supabase.fiat_payouts (status: pending)
    ↓
Show success message
```

### **Step 3: Circle Processes**

```
Circle processes withdrawal
    ↓
Circle sends webhook → /api/webhooks/circle
    ↓
Webhook handler updates Supabase
    status: pending → processing → succeeded
    ↓
User sees updated status in UI
```

---

## API Reference

### **Server Actions**

#### `createCircleBankBeneficiary(input)`
**Purpose:** Create bank account for withdrawals

**Input:**
```typescript
{
  userId: string;
  legalName: string;
  bankName: string;
  country: string;
  billingDetails: { name, city, country, line1, district, postalCode };
  bankAddress: { bankName, city, country, line1, district };
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  data?: { beneficiaryId: uuid, destinationId: string };
  error?: string;
}
```

---

#### `createCirclePayout(input)`
**Purpose:** Initiate withdrawal to bank

**Input:**
```typescript
{
  userId: string;
  beneficiaryId: string;
  amountUsd: number;
  walletId: string;
  originatorIdentity?: CircleIdentity; // Required for ≥$3,000
}
```

**Output:**
```typescript
{
  success: boolean;
  data?: {
    payoutId: uuid;
    circlePayoutId: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: string;
  };
  error?: string;
}
```

---

#### `getCirclePayoutStatus(payoutId)`
**Purpose:** Check withdrawal status

**Output:**
```typescript
{
  success: boolean;
  data?: {
    status: 'pending' | 'processing' | 'succeeded' | 'failed';
    trackingRef?: string;
    errorCode?: string;
    errorMessage?: string;
  };
  error?: string;
}
```

---

#### `getUserBankBeneficiaries(userId)`
**Purpose:** Get user's saved banks

**Output:**
```typescript
{
  success: boolean;
  data: Array<{
    id: uuid;
    circle_destination_id: string;
    legal_name: string;
    bank_name: string;
    country: string;
    account_last_four: string;
  }>;
}
```

---

#### `getUserPayouts(userId)`
**Purpose:** Get withdrawal history

**Output:**
```typescript
{
  success: boolean;
  data: Array<{
    id: uuid;
    amount_usd: number;
    fee_usd: number;
    net_amount_usd: number;
    status: string;
    created_at: timestamp;
    bank_beneficiaries: { bank_name, account_last_four };
  }>;
}
```

---

## Circle API Endpoints Used

### `POST /v1/businessAccount/banks/wires`
Create beneficiary bank account

**Request:**
```json
{
  "idempotencyKey": "unique-key",
  "billingDetails": { "name", "city", "country", "line1", "district", "postalCode" },
  "bankAddress": { "bankName", "city", "country", "line1", "district" },
  "accountNumber": "12340010",
  "routingNumber": "121000248"
}
```

**Response:**
```json
{
  "data": {
    "id": "destination-id-123",
    "status": "pending",
    "description": "Bank account added"
  }
}
```

---

### `POST /v1/businessAccount/payouts`
Create payout (withdrawal)

**Request:**
```json
{
  "idempotencyKey": "unique-key",
  "destination": { "type": "wire", "id": "destination-id-123" },
  "amount": { "currency": "USD", "amount": "9.88" },
  "source": {
    "type": "wallet",
    "id": "wallet-address",
    "identities": [/* if >= $3,000 */]
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "payout-id-456",
    "status": "pending",
    "amount": { "amount": "9.88", "currency": "USD" },
    "fees": { "amount": "0.12", "currency": "USD" }
  }
}
```

---

### `GET /v1/businessAccount/payouts/{id}`
Get payout status

**Response:**
```json
{
  "data": {
    "id": "payout-id-456",
    "status": "complete",
    "trackingRef": "ABC123",
    "createDate": "2025-01-07T12:00:00Z",
    "updateDate": "2025-01-07T14:00:00Z"
  }
}
```

---

## Database Schema

### `users`
```sql
id                  uuid PRIMARY KEY
crossmint_user_id   text UNIQUE
email               text
wallet_address      text
created_at          timestamptz
updated_at          timestamptz
```

### `bank_beneficiaries`
```sql
id                      uuid PRIMARY KEY
user_id                 uuid REFERENCES users(id)
circle_destination_id   text UNIQUE
legal_name              text
bank_name               text
country                 text
account_last_four       text
status                  text DEFAULT 'active'
created_at              timestamptz
updated_at              timestamptz
```

### `fiat_payouts`
```sql
id                  uuid PRIMARY KEY
user_id             uuid REFERENCES users(id)
beneficiary_id      uuid REFERENCES bank_beneficiaries(id)
wallet_id           text
amount_usd          numeric(12,2)
fee_usd             numeric(12,2)
net_amount_usd      numeric(12,2)
provider            text DEFAULT 'circle'
circle_payout_id    text UNIQUE
status              text DEFAULT 'pending'
error_code          text
error_message       text
idempotency_key     text UNIQUE
metadata            jsonb
created_at          timestamptz
updated_at          timestamptz
```

### `platform_fees`
```sql
id                  uuid PRIMARY KEY
tx_type             text
fee_bps             integer
min_fee_usd         numeric(10,2)
max_fee_usd         numeric(10,2)
effective_from      timestamptz
effective_until     timestamptz
created_at          timestamptz
```

### `webhook_events`
```sql
id              uuid PRIMARY KEY
provider        text
event_type      text
event_id        text UNIQUE
payload         jsonb
signature       text
processed       boolean DEFAULT false
processed_at    timestamptz
error           text
received_at     timestamptz
```

---

## Security & Compliance

### **Row Level Security (RLS)**
- Users can only access their own data
- Enforced at database level
- Policies created in migration

### **Travel Rule (≥$3,000)**
```typescript
if (amountUsd >= 3000) {
  // Must provide originator identity
  source.identities = [{
    type: 'individual',
    name: 'Juan Pérez',
    addresses: [{ line1, city, district, country, postalCode }]
  }];
}
```

### **Idempotency**
- Every Circle API call includes unique `idempotencyKey`
- Prevents duplicate transactions
- Key format: `{type}-{userId}-{timestamp}-{uuid}`

### **Webhook Verification**
```typescript
function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac.digest('hex'))
  );
}
```

---

## Fee Structure

```typescript
// Default configuration
{
  feeBps: 125,        // 1.25% (125 basis points)
  minFeeUsd: 1.00,    // $1 minimum
  maxFeeUsd: null     // No maximum
}

// Examples:
$10 withdrawal  → $0.13 fee → $9.87 to bank
$100 withdrawal → $1.25 fee → $98.75 to bank
$5 withdrawal   → $1.00 fee → $4.00 to bank (minimum applied)
```

---

## Environment Variables Reference

```bash
# Required for Crossmint (existing)
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=ck_staging_...
CROSSMINT_SERVER_SIDE_API_KEY=sk_staging_...
NEXT_PUBLIC_CHAIN_ID=base-sepolia
NEXT_PUBLIC_USDC_MINT=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Required for Circle
CIRCLE_BASE_URL=https://api-sandbox.circle.com  # or https://api.circle.com
CIRCLE_API_KEY=sk_sandbox_...  # or sk_live_...
CIRCLE_WEBHOOK_SECRET=whsec_...
PAYMENTS_CIRCLE_ENABLED=true
```

---

## Next Steps

1. ✅ Complete SETUP.md configuration
2. ✅ Test in sandbox environment
3. 🔜 Apply for Circle production access
4. 🔜 Deploy to Vercel/production
5. 🔜 Set up monitoring and alerts
6. 🔜 Add KYC flow for large withdrawals

