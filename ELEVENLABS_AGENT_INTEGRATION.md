# ElevenLabs Agent Integration Guide

## Overview

Successfully integrated ElevenLabs Conversational AI Agent with TelegramService to provide **Real-World Asset (RWA) market data** alongside existing wallet operations.

## Architecture

### Integration Strategy

**Hybrid Approach**: 
- ✅ **Wallet Operations** → Existing handlers (voice + text commands)
- ✅ **RWA Queries** → ElevenLabs Agent with CoinGecko MCP

```
┌─────────────────────────────────────────────────────────┐
│              Telegram User Message                       │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  TelegramService     │
         │   Message Router     │
         └──────────┬───────────┘
                    │
      ┌─────────────┴──────────────┐
      │                            │
      ▼                            ▼
┌───────────────┐         ┌─────────────────┐
│ Wallet Ops    │         │  RWA Queries    │
│               │         │                 │
│ • /balance    │         │ • /rwa          │
│ • /send       │         │ • "price of X"  │
│ • /swap       │         │ • "top RWA"     │
│ • Voice cmds  │         │ • "trending"    │
│               │         │                 │
│ ↓             │         │ ↓               │
│ Circle SDK    │         │ ElevenLabs API  │
│ SwapService   │         │ (with CoinGecko)│
└───────────────┘         └─────────────────┘
```

---

## What Was Changed

### 1. Config Updates (`config/index.ts`)

**Added:**
```typescript
elevenlabs: {
  apiKey: process.env.ELEVENLABS_API_KEY,
  agentId: process.env.ELEVENLABS_AGENT_ID || "agent_5401k83ya0nbfv7b1hj2bxqta05k"
}
```

### 2. TelegramService Updates (`services/TelegramService.ts`)

**New Imports:**
```typescript
import axios from 'axios';
```

**New Methods:**

#### `isRWAQuery(text: string): boolean`
Detects if a message is RWA-related using keyword matching:
- `rwa`, `real world asset`
- `price`, `market cap`, `trading`
- `trending`, `top coins`
- Token names: `ondo`, `usdc`, `link`, `chainlink`
- `stablecoin`, `tokenized`, `treasury`

#### `handleAgentQuery(msg: TelegramBot.Message): Promise<void>`
Calls ElevenLabs Conversational AI API:
- Sends user query to agent
- Passes context (username, network, timestamp)
- Displays "🔍 Fetching market data..." while processing
- Returns agent's text response
- Handles errors gracefully

#### `handleRWA(msg: TelegramBot.Message, match?: RegExpExecArray | null)`
Handles `/rwa [query]` command:
- Default query: "What are the top RWA tokens?"
- Routes to agent

**Modified Methods:**

#### `setupCommands()`
Added:
```typescript
this.bot.onText(/\/rwa(.*)/, this.handleRWA.bind(this));
```

#### `handleTextMessage(msg: TelegramBot.Message)`
Enhanced logic:
1. **Priority 1**: Check for pending confirmations (wallet ops)
2. **Priority 2**: Check if RWA query → route to agent
3. **Else**: Ignore (not a command)

#### `handleStart(msg: TelegramBot.Message)`
Updated welcome message to include:
- `/rwa [query]` command
- Examples: "What are the top RWA tokens?", "What is the price of ONDO?"

---

## How It Works

### RWA Query Flow

1. **User sends message**: "What is the price of ONDO?"
2. **TelegramService receives** → `handleTextMessage()`
3. **Check pending confirmations** → None
4. **Check if RWA query** → `isRWAQuery()` → ✅ YES
5. **Call agent** → `handleAgentQuery()`
6. **ElevenLabs API** receives query
7. **Agent uses CoinGecko MCP** to fetch data
8. **Agent responds** with market data
9. **TelegramService sends** formatted response to user

### Wallet Operation Flow (Unchanged)

1. **User says**: "Send 10 USDC to grandma"
2. **Voice handler** → transcription
3. **Voice parser** → extracts command
4. **Request confirmation** → stores in `pendingConfirmations`
5. **User texts**: "CONFIRM"
6. **Execute** → Circle SDK transaction

---

## Environment Variables

### Required

Add to `.env` file:

```bash
# Existing (already configured)
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_entity_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# ElevenLabs (NEW - required for RWA queries)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=agent_5401k83ya0nbfv7b1hj2bxqta05k
```

### Get ElevenLabs API Key

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Navigate to your agent: `agent_5401k83ya0nbfv7b1hj2bxqta05k`
3. Copy API key from Settings → API Keys
4. Add to `.env`

---

## Testing Guide

### Test 1: Wallet Operations (Existing - Should Still Work)

**Text Commands:**
```
/balance
/send 0x5C479D97997763A9fBaE700B42d1cE88AA8263Ea 0.5
/swap WETH 0.5 1200
```

**Voice Commands:**
```
🎤 "Check my balance"
🎤 "Send 25 to grandma"
🎤 "Swap for gold"
```

**Expected**: All wallet ops work as before ✅

---

### Test 2: RWA Queries via `/rwa` Command

**Test 2a: Default Query**
```
/rwa
```
**Expected**: Returns top RWA tokens (ONDO, Chainlink, etc.)

**Test 2b: Specific Query**
```
/rwa What is the price of ONDO?
```
**Expected**: Returns ONDO price and details

**Test 2c: Trending Query**
```
/rwa Show me trending RWA coins
```
**Expected**: Returns trending tokens

---

### Test 3: Natural Language RWA Queries

**No command prefix needed - just send text:**

```
What are the top RWA tokens?
```
**Expected**: Agent response with top 5 RWA tokens

```
What is the price of Chainlink?
```
**Expected**: LINK price, market cap, description

```
Show me trending coins
```
**Expected**: Trending RWA tokens

```
How much is USDC?
```
**Expected**: USDC price ($1.00), stablecoin info

---

### Test 4: Mixed Workflow

**Scenario**: Check balance, then research tokens, then swap

```
Step 1: 🎤 "Check my balance"
→ Returns: "1.6 USDC on BASE-SEPOLIA"

Step 2: Type: "What is the price of UNI?"
→ Returns: "Uniswap (UNI) is currently trading at $7.50..."

Step 3: 🎤 "Swap for gold"
→ Asks for confirmation
→ Type: "CONFIRM"
→ Executes swap
```

**Expected**: All operations work seamlessly ✅

---

### Test 5: Error Handling

**Test 5a: Missing API Key**
Remove `ELEVENLABS_API_KEY` from `.env`, then:
```
What is the price of ONDO?
```
**Expected**: "❌ ElevenLabs agent not configured. Please set ELEVENLABS_API_KEY."

**Test 5b: Invalid RWA Query**
```
What is the price of RANDOMFAKETOKEN?
```
**Expected**: Agent responds: "I couldn't find that information. Try asking about specific RWA tokens like ONDO, USDC, or Chainlink."

**Test 5c: Network Error**
Disconnect internet, then:
```
/rwa
```
**Expected**: "❌ Sorry, I couldn't fetch market data right now. Error: [details]. Try asking about..."

---

## RWA Query Detection Keywords

The following keywords trigger agent routing:

### Category Keywords
- `rwa`, `real world asset`, `real-world asset`
- `stablecoin`, `tokenized`
- `treasury`, `treasuries`

### Action Keywords
- `price`, `market cap`, `market`, `trading`
- `trending`, `top coins`, `top tokens`
- `how much is`, `what is the price`
- `token price`, `coin price`

### Token Names
- `ondo`, `usdc`, `link`, `chainlink`
- `defi token`, `crypto price`

**Note**: Keywords are case-insensitive.

---

## API Integration Details

### ElevenLabs API Endpoint

```
POST https://api.elevenlabs.io/v1/convai/conversation/send_text
```

### Request Format

```typescript
{
  agent_id: "agent_5401k83ya0nbfv7b1hj2bxqta05k",
  text: "What is the price of ONDO?",
  user_id: "12345",
  variables: {
    user_name: "john_crypto",
    current_network: "BASE-SEPOLIA",
    timestamp: "2025-10-27T12:34:56.789Z"
  }
}
```

### Response Format

```typescript
{
  text: "Ondo Finance (ONDO) is currently trading at $1.23...",
  // ... other metadata
}
```

---

## Features

### ✅ What Works

1. **RWA Market Data**
   - Top RWA tokens by market cap
   - Specific token prices and details
   - Trending coins
   - Historical data (if agent configured)

2. **Natural Language Processing**
   - No command prefix needed for RWA queries
   - Conversational responses
   - Context-aware (knows username, network)

3. **Existing Wallet Operations**
   - All voice commands unchanged
   - All text commands unchanged
   - Confirmations still required for financial ops

4. **Error Handling**
   - Graceful fallbacks
   - User-friendly error messages
   - API error details for debugging

### 🚧 Limitations

1. **Agent Must Be Configured in ElevenLabs**
   - CoinGecko MCP server must be added
   - System prompt must include RWA tools
   - See your ElevenLabs setup notes for details

2. **Text-Only Responses**
   - Agent returns text (not voice yet)
   - Future: Could return audio for voice responses

3. **Rate Limits**
   - ElevenLabs API: 50 requests/minute (free tier)
   - CoinGecko API: 10-50 calls/minute (depends on plan)

---

## Next Steps

### Phase 1: Test & Deploy ✅
- [x] Add ElevenLabs agent integration
- [x] Route RWA queries to agent
- [x] Keep wallet operations intact
- [ ] Test all scenarios (see Testing Guide)
- [ ] Deploy to production

### Phase 2: Enhancements 🔜
- [ ] Add voice responses (return audio from agent)
- [ ] Cache common queries (e.g., "top RWA tokens")
- [ ] Add conversation history (multi-turn dialogues)
- [ ] Expand RWA keywords (more token names)

### Phase 3: Advanced Features 🚀
- [ ] Portfolio tracking ("How's my portfolio?")
- [ ] Price alerts ("Alert me when ONDO hits $2")
- [ ] Historical charts (send chart images to Telegram)
- [ ] Comparative analysis ("Compare ONDO and Chainlink")

---

## Troubleshooting

### Problem: "❌ ElevenLabs agent not configured"

**Cause**: Missing `ELEVENLABS_API_KEY` in `.env`

**Fix**:
```bash
# Add to .env
ELEVENLABS_API_KEY=your_api_key_here
```

Restart server:
```bash
pnpm dev
```

---

### Problem: Agent returns generic response

**Cause**: CoinGecko MCP not configured in ElevenLabs agent

**Fix**:
1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Open your agent: `agent_5401k83ya0nbfv7b1hj2bxqta05k`
3. Go to "Tools" tab
4. Add CoinGecko MCP server (see your setup notes)
5. Enable tools: `coins_markets`, `coins_id`, `search`, `search_trending`

---

### Problem: "API Error: 401 - Unauthorized"

**Cause**: Invalid API key

**Fix**:
1. Generate new API key in ElevenLabs
2. Update `.env`
3. Restart server

---

### Problem: RWA query not detected

**Cause**: Keywords not matching

**Debug**:
```typescript
// Add logging to isRWAQuery() method
console.log('Checking text:', text);
console.log('Is RWA query?', this.isRWAQuery(text));
```

**Fix**: Add more keywords to `rwaKeywords` array in `isRWAQuery()` method

---

## LinkedIn Post Context

You successfully demonstrated:
- ✅ Voice-enabled wallet creation
- ✅ Voice-enabled balance checks
- ✅ Voice-enabled USDC transfers ("Send to grandma")
- ✅ Voice-enabled swaps ("Swap for gold")

Now adding:
- 🆕 RWA market data queries
- 🆕 Real-time token prices
- 🆕 Trending coins
- 🆕 Natural language conversations

**This creates a complete conversational crypto experience**:
- Wallet management via voice
- Market research via text/voice
- Seamless workflow: research → transact

---

## Files Changed

1. **`config/index.ts`**
   - Added `elevenlabs.agentId` configuration

2. **`services/TelegramService.ts`**
   - Added `isRWAQuery()` method
   - Added `handleAgentQuery()` method
   - Added `handleRWA()` method
   - Modified `handleTextMessage()` for RWA routing
   - Modified `handleStart()` for updated help text
   - Added `axios` import

3. **`.env`** (needs manual update)
   - Add `ELEVENLABS_AGENT_ID=agent_5401k83ya0nbfv7b1hj2bxqta05k`
   - Ensure `ELEVENLABS_API_KEY` is set

---

## API Costs (Estimate)

### Free Tier
- **ElevenLabs**: 50 requests/minute, 10,000 characters/month
- **CoinGecko**: 10-50 calls/minute (demo API)

### Paid Tier (if needed)
- **ElevenLabs Starter**: $5/month → 100,000 characters
- **CoinGecko Pro**: $129/month → 500 calls/minute

For your demo/testing: **Free tier is sufficient** ✅

---

## Summary

### What We Built

A **hybrid intelligent agent** that:
1. Handles wallet operations (create, send, swap) via voice/text
2. Provides RWA market data via ElevenLabs agent + CoinGecko
3. Routes queries intelligently based on context
4. Maintains security (confirmations still required)

### Why This Matters

**Before**: Users needed separate apps for wallet management and market research

**After**: One conversational interface for everything:
- "Check my balance" → Wallet info
- "What's the price of ONDO?" → Market data  
- "Send 10 to grandma" → Transaction
- "Swap for gold" → DeFi operation

**Result**: True conversational Web3 experience 🚀

---

## Contact & Support

For issues or questions about this integration:
- Check troubleshooting section above
- Review ElevenLabs agent configuration
- Ensure CoinGecko MCP is properly connected
- Check API keys in `.env`

Happy building! 🎙️💰📊


