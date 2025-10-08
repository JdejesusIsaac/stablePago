# 👵 Create Wallet for Recipients Feature

## Overview
Added a "Create Wallet for Email" feature to help onboard recipients (like grandma) who don't have a StablePago wallet yet.

## How It Works

### **For Senders:**
1. Click the **three-dot menu** (⋮) in the Dashboard
2. Select **"Create Wallet for Email"**
3. Enter the recipient's email address (e.g., `grandma@example.com`)
4. Click **"Create Wallet"**
5. ✅ Done! The recipient now has a wallet

### **For Recipients:**
After the wallet is created:
- They can **login with their email** at your app
- Crossmint automatically links them to their wallet
- They can **receive USDC** sent to their email
- They can **withdraw to their bank** using Circle

---

## Technical Implementation

### **Files Created:**
- `components/CreateWalletModal.tsx` - UI modal for creating wallets
- `app/api/create-wallet/route.ts` - Server endpoint that calls Crossmint API

### **Files Modified:**
- `components/dashboard-summary/index.tsx` - Added menu option
- `components/MainScreen.tsx` - Wired up the modal

### **API Used:**
- **Crossmint Wallet API**: `POST /api/v1-alpha2/wallets`
- Links wallet to user's email via `linkedUser` field
- Creates EVM smart wallet on Base Sepolia

---

## Environment Variables Required

Already documented in `SETUP.md`:
```bash
CROSSMINT_SERVER_SIDE_API_KEY=sk_staging_...
```

This is the **server-side API key** (not the public key). Get it from:
1. [Crossmint Console](https://staging.crossmint.com/console/overview)
2. Go to **Developers** → **API Keys**
3. Copy the **Server-Side API Key** (starts with `sk_staging_` or `sk_production_`)

⚠️ **Never expose this key client-side!** It's only used in the `/api/create-wallet` endpoint.

---

## User Flow Example

### **Sender (You):**
```
1. Login to StablePago
2. Click ⋮ → "Create Wallet for Email"
3. Enter: grandma@gmail.com
4. ✅ Wallet created!
5. Send $50 USDC to grandma@gmail.com
```

### **Recipient (Grandma):**
```
1. Open StablePago app
2. Login with grandma@gmail.com (email OTP)
3. ✅ Sees $50 USDC balance
4. Click "Withdraw to Bank"
5. Add bank details (one time)
6. Withdraw → money arrives in 1-2 days
```

---

## Error Handling

### **Wallet Already Exists:**
```
❌ "A wallet already exists for this email address"
```
**Solution:** They can just login with their email - no need to create again.

### **Invalid Email:**
```
❌ "Invalid email format"
```
**Solution:** Check for typos (must be `user@domain.com` format).

### **Server Error:**
```
❌ "Failed to create wallet"
```
**Solution:** Check that `CROSSMINT_SERVER_SIDE_API_KEY` is set in `.env.local`

---

## Next Steps

After creating a wallet for someone:
1. **Send them money** using the Send button (to their email)
2. **Tell them to login** at your app URL
3. They can **withdraw** to their local PR/DR bank

This completes the onboarding flow! 🎉


