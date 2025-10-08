# 🎯 Delegation Feature - Ready for Bot Integration

## ✅ What's Available

StablePago has a **complete delegation management system** ready for you to integrate your Telegram bot logic.

---

## 🎨 UI Components (Complete & Working)

### **1. Delegation Setup Modal**
- Location: `components/delegation/DelegationSetup.tsx`
- Purpose: User configures spending limits and enables bot
- Features:
  - Configure daily, weekly, per-item limits
  - Set approval threshold
  - Select allowed categories
  - Choose delegation duration
  - Calls Crossmint `addDelegatedSigner()`

### **2. Delegation Manager Modal**
- Location: `components/delegation/DelegationManager.tsx`
- Purpose: View and manage existing delegations
- Features:
  - List active delegations
  - Show delegation history
  - Revoke access
  - Setup new delegations

### **3. Delegation Dashboard Card**
- Location: `components/dashboard-summary/DelegationCard.tsx`
- Purpose: Prominent display on main dashboard
- Features:
  - Auto-loads delegation status
  - Shows current limits at a glance
  - One-click access to manage
  - Beautiful gradient design (active/inactive states)

---

## 📡 API Endpoints (Complete & Working)

### **1. Save Delegation**
```typescript
POST /api/delegation/save

Body:
{
  user_id: string,
  bot_address: string,
  daily_limit: number,
  weekly_limit: number,
  per_item_limit: number,
  approval_threshold: number,
  allowed_categories: string[],
  valid_until: string,
  delegation_id: string
}

Response:
{
  success: true,
  delegation: { ... }
}
```

### **2. List Delegations**
```typescript
GET /api/delegation/list?user_id={crossmintUserId}

Response:
{
  delegations: [
    {
      id: string,
      bot_address: string,
      daily_limit: number,
      weekly_limit: number,
      per_item_limit: number,
      approval_threshold: number,
      allowed_categories: string[],
      valid_until: string,
      is_active: boolean,
      created_at: string
    }
  ]
}
```

### **3. Revoke Delegation**
```typescript
POST /api/delegation/revoke

Body:
{
  delegation_id: string
}

Response:
{
  success: true,
  message: "Delegation revoked"
}
```

---

## 🗄️ Database Schema

### **Delegations Table**
```sql
create table public.delegations (
  id uuid primary key,
  user_id uuid → users(id),
  bot_address text,
  daily_limit numeric,
  weekly_limit numeric,
  per_item_limit numeric,
  approval_threshold numeric,
  allowed_categories text[],
  valid_until timestamptz,
  delegation_id text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
);
```

---

## 🎯 What Users Can Do Right Now

1. ✅ **Access via Dashboard**
   - Delegation card always visible below wallet balance
   - Clear status indicator (active/inactive)
   - One-click to manage

2. ✅ **Configure Limits**
   - Set daily spending limit ($50 default)
   - Set weekly spending limit ($150 default)
   - Set per-item limit ($30 default)
   - Set approval threshold ($40+ default)
   - Choose allowed categories (grocery, pharmacy, etc.)
   - Choose duration (7, 14, 30, 90 days)

3. ✅ **Grant Permission**
   - Click "Enable Shopping Bot"
   - Configure limits
   - Confirm delegation
   - Wallet prompts to add delegated signer
   - Success! Bot can now sign transactions

4. ✅ **Manage Access**
   - View current limits
   - See expiry date
   - Revoke access anytime
   - Setup new delegations

---

## 🔧 Environment Variables Needed

```bash
# Add to .env.local:
NEXT_PUBLIC_TELEGRAM_BOT_ADDRESS=0xYourBotWalletAddressHere
```

---

## 🚀 How to Test

1. **Start dev server:**
   ```bash
   pnpm dev
   ```

2. **Log in to dashboard**

3. **See delegation card** (below wallet balance)

4. **Click "Enable Shopping Bot"**

5. **Configure limits and confirm**

6. **Check wallet** - should show delegated signer

7. **Check Supabase** - should have delegation record

---

## 🎓 How Delegation Works (Crossmint)

### **Granting Delegation:**
```typescript
// User clicks "Enable Shopping Bot"
await wallet.addDelegatedSigner({ 
  signer: BOT_WALLET_ADDRESS 
});

// Now bot can sign transactions!
```

### **Checking Delegation:**
```typescript
// Get all delegated signers
const signers = await wallet.delegatedSigners();
// Returns: [{ signer: "0xBotAddress" }]

// Check if bot is delegated
const isDelegated = signers.some(
  s => s.signer.toLowerCase() === BOT_ADDRESS.toLowerCase()
);
```

### **Using Delegation (Bot Side):**
```typescript
// Bot creates transaction
const tx = await wallet.createTransaction({
  to: MERCHANT_ADDRESS,
  amount: productPrice,
  token: 'USDC'
});

// Bot signs (because it has delegation!)
const signed = await wallet.signTransaction(tx);

// Transaction broadcast
console.log('TX Hash:', signed.hash);
```

---

## 📋 What You Need to Build (Bot Logic)

The delegation **infrastructure is complete**. You now need to build:

### **1. Bot Spending Logic**
- Read delegation limits from Supabase
- Check if purchase is within limits
- Handle approval flow for >threshold amounts
- Update spend counters after purchases

### **2. Bot Transaction Signing**
- Create transactions for purchases
- Sign using delegation
- Broadcast to blockchain

### **3. Bot Logging (Optional)**
- Log purchases to your own database
- Track user spending history
- Generate receipts

---

## 🎯 Integration Points

When you build your bot, you'll need to:

### **1. Check if User Has Delegation**
```typescript
// Query Supabase:
SELECT * FROM delegations 
WHERE user_id = $1 
AND is_active = true 
AND valid_until > now();

// Or query via API:
const response = await fetch(
  `/api/delegation/list?user_id=${crossmintUserId}`
);
const { delegations } = await response.json();
const activeDelegation = delegations.find(d => d.is_active);
```

### **2. Read Spending Limits**
```typescript
// From delegation record:
const { 
  daily_limit, 
  weekly_limit, 
  per_item_limit,
  approval_threshold,
  allowed_categories 
} = delegation;
```

### **3. Implement Your Spending Logic**
```typescript
// Example (you implement this):
async function canPurchase(userId, amount, category) {
  const delegation = await getDelegation(userId);
  const todaySpent = await getTodaySpending(userId);
  
  // Your logic:
  if (!delegation || !delegation.is_active) return false;
  if (amount > delegation.per_item_limit) return false;
  if (todaySpent + amount > delegation.daily_limit) return false;
  if (!delegation.allowed_categories.includes(category)) return false;
  
  return true;
}
```

### **4. Sign Transactions**
```typescript
// You implement this using Crossmint SDK:
if (await canPurchase(userId, product.price, product.category)) {
  const tx = await createTransaction(product);
  const signed = await wallet.signTransaction(tx);
  
  // Your logging:
  await logPurchase(userId, product, signed.hash);
}
```

---

## ✅ Summary

### **What's Ready:**
- ✅ Complete delegation UI (setup, manage, display)
- ✅ Delegation APIs (save, list, revoke)
- ✅ Supabase schema for delegations
- ✅ Dashboard integration
- ✅ Crossmint integration

### **What You Build:**
- 🔜 Bot spending evaluation logic
- 🔜 Bot transaction signing
- 🔜 Bot logging/tracking
- 🔜 Bot approval flow
- 🔜 Bot counter management

---

## 🎉 You're Ready!

The delegation **foundation is solid**. Now you can focus on building the bot logic that makes sense for your specific use case.

**When you're ready to integrate, you'll have:**
- A working delegation UI for users
- APIs to query delegation settings
- A clean database schema
- Full control over bot implementation

**Start building your bot logic whenever you're ready!** 🚀

