# 🚀 StablePago Setup Guide - Phase 2 Complete!

## ✅ What's Been Built

Phase 2 implementation is complete! Here's what we've integrated:

### **Backend Infrastructure**
- ✅ Supabase database schema with 5 tables
- ✅ Circle API integration utilities  
- ✅ Server actions for bank/payout management
- ✅ Fee calculation logic (1.25%)
- ✅ Webhook handler for Circle events
- ✅ Supabase Auth SSR middleware

### **Frontend Components**
- ✅ BankForm for PR/DR bank accounts
- ✅ WithdrawModal with multi-step flow
- ✅ Real-time status tracking
- ✅ Fee preview and validation
- ✅ Replaced mock with production code

---

## 📋 Next Steps: Configuration

### **Step 1: Create Supabase Project**

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: `stablepago`
4. Database Password: (save this securely)
5. Region: Choose closest to PR/DR
6. Wait for project to provision (~2 minutes)

### **Step 2: Run Database Migration**

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of:
   ```
   supabase/migrations/20250107_init_stablepago.sql
   ```
4. Paste into SQL Editor
5. Click "Run" (bottom right)
6. You should see: ✅ Success. No rows returned

### **Step 3: Get Supabase Credentials**

1. In Supabase dashboard, click "Settings" (gear icon)
2. Go to **API**
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbG...
```

### **Step 4: Get Circle API Keys**

#### **Sandbox (Testing)**
1. Go to [https://developers.circle.com](https://developers.circle.com)
2. Sign up / Log in
3. Navigate to **API Keys**
4. Create new key:
   - Name: `stablepago-sandbox`
   - Environment: **Sandbox**
5. Copy the API key (starts with `sk_sandbox_...`)

#### **Production (Later)**
- Same process but select **Production** environment
- Requires KYC/business verification

### **Step 5: Update Environment Variables**

Update your `.env.local`:

```bash
# Existing Crossmint keys (keep these)
CROSSMINT_SERVER_SIDE_API_KEY=sk_staging_...
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=ck_staging_...
NEXT_PUBLIC_CHAIN_ID=base-sepolia
NEXT_PUBLIC_USDC_MINT=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# ✅ ADD THESE - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# ✅ ADD THESE - Circle
CIRCLE_BASE_URL=https://api-sandbox.circle.com
CIRCLE_API_KEY=sk_sandbox_...
CIRCLE_WEBHOOK_SECRET=whsec_... # (get this after setting up webhooks)
PAYMENTS_CIRCLE_ENABLED=true


```

### **Step 6: Set Up Circle Webhooks**

1. In Circle dashboard, go to **Webhooks**
2. Click "Create Endpoint"
3. URL: `https://your-domain.com/api/webhooks/circle`
   - For local testing: Use [ngrok](https://ngrok.com) or similar
   - `ngrok http 3002` then use the HTTPS URL
4. Events to subscribe:
   - `payouts.completed`
   - `payouts.failed`
   - `payouts.processing`
5. Copy the **Webhook Secret** and add to `.env.local`

---

## 🧪 Testing Guide

### **Test 1: Restart Dev Server**

```bash
npm run dev
# or
pnpm dev
```

### **Test 2: Check Console for Errors**

Look for:
- ✅ Supabase connection successful
- ✅ No Circle API key warnings
- ❌ Any red errors (report these)

### **Test 3: Full Withdraw Flow (Sandbox)**

1. **Login** to your account
2. **Deposit** $20 using test card `4242 4242 4242 4242`
3. **Click "..." menu** → "Withdraw to Bank"
4. **Add Bank Account:**
   - Country: 🇵🇷 Puerto Rico
   - Legal Name: Your Name
   - Bank: Banco Popular de Puerto Rico
   - Account: `12340010` (Circle sandbox test account)
   - Routing: `121000248` (Circle sandbox routing)
   - Address: Any valid PR address
5. **Enter Amount:** $10.00
6. **Review Fee:** Should show $0.13 fee (1.25%)
7. **Confirm**
8. **Wait for Status:** Should show "Withdrawal Initiated!"

### **Test 4: Check Supabase Tables**

In Supabase dashboard:
1. Go to **Table Editor**
2. Check `users` table → should have 1 row
3. Check `bank_beneficiaries` → should have 1 row
4. Check `fiat_payouts` → should have 1 row with status `pending`
5. Wait 30 seconds, refresh → status should update to `processing` or `succeeded`

### **Test 5: Webhook Verification**

1. Check `webhook_events` table in Supabase
2. Should see events from Circle
3. Look for `payouts.completed` event

---

## 🐛 Troubleshooting

### **Error: "Failed to create bank beneficiary"**

**Cause:** Circle API key invalid or sandbox not enabled

**Fix:**
1. Verify `CIRCLE_API_KEY` in `.env.local`
2. Ensure you're using sandbox key for testing
3. Check Circle dashboard for API errors

### **Error: "User not found"**

**Cause:** Supabase RLS policies blocking access

**Fix:**
1. Go to Supabase → **Authentication** → **Policies**
2. Ensure RLS policies are set up (migration should have done this)
3. Check browser console for Supabase errors

### **Error: "Insufficient balance"**

**Cause:** Circle sandbox account not funded

**Fix:**
1. In Circle dashboard, go to **Sandbox**
2. Fund your account with test USDC
3. Or use Circle's mock funding endpoints

### **Webhooks Not Working**

**Cause:** Webhook URL not accessible

**Fix:**
1. For local testing, use ngrok:
   ```bash
   ngrok http 3002
   ```
2. Update Circle webhook URL with ngrok HTTPS URL
3. Ensure webhook secret matches `.env.local`

---

## 📊 Database Schema Summary

```sql
users (id, crossmint_user_id, email, wallet_address)
bank_beneficiaries (id, user_id, circle_destination_id, bank_name, country)
fiat_payouts (id, user_id, beneficiary_id, amount_usd, fee_usd, status)
platform_fees (tx_type, fee_bps, min_fee_usd)
webhook_events (provider, event_type, payload, processed)
```

---

## 🎯 What's Next: Phase 3

### **Production Readiness**
- [ ] Get Circle production API keys
- [ ] Complete Circle KYC/business verification
- [ ] Set up production Supabase project
- [ ] Configure production domain
- [ ] Set up proper SSL/HTTPS
- [ ] Add error tracking (Sentry)
- [ ] Set up monitoring (Datadog/New Relic)

### **Compliance & Security**
- [ ] Add KYC flow for users (≥$3,000 withdrawals)
- [ ] Implement transaction limits
- [ ] Add 2FA for withdrawals
- [ ] Create audit logs
- [ ] GDPR compliance measures
- [ ] AML screening integration

### **Enhanced Features**
- [ ] Email notifications for withdrawals
- [ ] SMS notifications (Twilio)
- [ ] Withdrawal history page
- [ ] CSV export for transactions
- [ ] Multiple bank accounts per user
- [ ] Schedule recurring withdrawals

---

## 📞 Support

**Questions?**
- Circle Docs: https://developers.circle.com
- Supabase Docs: https://supabase.com/docs
- StablePago Issues: [Create GitHub issue]

**Ready to test?** Follow the testing guide above! 🚀

