# 🔄 Switch from Demo to Production

## Current State: Demo Mode
- Using `DemoWithdrawModal` (no backend needed)
- Shows UI flow only
- No real transactions

## To Enable Real Circle Integration:

### 1. Add Circle API Keys to `.env.local`
```bash
CIRCLE_BASE_URL=https://api-sandbox.circle.com
CIRCLE_API_KEY=sk_sandbox_YOUR_KEY_HERE
CIRCLE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
PAYMENTS_CIRCLE_ENABLED=true
```

### 2. Switch Component in MainScreen.tsx

**Change line 6 from:**
```typescript
import { DemoWithdrawModal as WithdrawModal } from "@/components/withdraw/DemoWithdrawModal";
```

**To:**
```typescript
import { WithdrawModal } from "@/components/withdraw/WithdrawModal";
```

### 3. Restart Server
```bash
pnpm dev
```

### 4. Test Real Integration
- Click Withdraw
- Add bank (will save to Circle + Supabase)
- Create payout (will call Circle API)
- Check Supabase tables for records

## Verifying It Works:

1. **Supabase Dashboard:** Check `bank_beneficiaries` table
2. **Circle Dashboard:** See bank accounts + payouts
3. **Console Logs:** No errors about missing API keys
4. **Webhook Events:** Check `webhook_events` table

---

**Keep Demo Mode Active** until you have:
- ✅ Circle sandbox account
- ✅ Circle API keys
- ✅ Webhook endpoint configured
- ✅ Tested in sandbox

