# Voice RWA Integration - Testing Guide

## What Was Fixed

### Problem
When you said "Dime de oro en las redes de Ethereum" (voice), the bot:
1. Transcribed it correctly ✅
2. Parsed as "UNKNOWN" command (wallet parser doesn't understand Spanish RWA queries)
3. Showed help message instead of routing to ElevenLabs agent ❌

### Solution
Added **intelligent routing** for RWA queries:

```
Voice Message → Transcription → Command Parser
                                      ↓
                              Is it "UNKNOWN"?
                                      ↓
                              Check if RWA query
                                      ↓
                          YES → Route to ElevenLabs Agent
                          NO → Show help message
```

### Changes Made

1. **Added Spanish RWA Keywords** (`isRWAQuery` method):
   - `oro`, `plata`, `ethereum`, `redes`
   - `precio`, `mercado`, `moneda`, `token`
   - `dime de`, `háblame de`, `información sobre`
   - `activos`, `cripto`, `criptomoneda`

2. **Enhanced Voice Command Router** (`executeVoiceCommand`):
   - Now checks transcription for RWA keywords when command is "UNKNOWN"
   - Routes to `handleVoiceAgentQuery` if RWA-related

3. **Fixed Agent API Call** (`handleVoiceAgentQuery`):
   - Uses reliable text endpoint: `/v1/convai/conversation/send_text`
   - Added detailed logging for debugging
   - Better error messages in Spanish
   - Handles various response formats from agent

---

## Testing Scenarios

### ✅ Test 1: Spanish Voice RWA Query

**Say (in Spanish):**
```
🎤 "Dime de oro en las redes de Ethereum"
```

**Expected Flow:**
1. Bot transcribes: "Dime de oro en las redes de Ethereum"
2. Parser: UNKNOWN command
3. RWA Check: ✅ Contains "oro" and "ethereum"
4. Routes to ElevenLabs agent
5. Agent uses CoinGecko MCP to fetch data
6. Bot responds with market data about gold-backed tokens on Ethereum

**Expected Response (example):**
```
📊 Hay varios tokens relacionados con oro en Ethereum. Los más populares incluyen:

1. PAX Gold (PAXG) - Respaldado 1:1 por oro físico
2. Tether Gold (XAUT) - Cada token representa una onza troy de oro

¿Te gustaría más detalles sobre alguno?
```

---

### ✅ Test 2: English Voice RWA Query

**Say:**
```
🎤 "What is the price of ONDO?"
```

**Expected:**
1. Transcription: "What is the price of ONDO?"
2. Parser: UNKNOWN
3. RWA Check: ✅ Contains "price" and "ondo"
4. Routes to agent
5. Response with ONDO price, market cap, description

---

### ✅ Test 3: Spanish Text RWA Query

**Type:**
```
¿Cuál es el precio de USDC?
```

**Expected:**
1. Detected as RWA query (contains "precio")
2. Routes to agent via `handleAgentQuery`
3. Response with USDC data

---

### ✅ Test 4: Wallet Command Still Works

**Say:**
```
🎤 "Check my balance"
```

**Expected:**
1. Transcription: "Check my balance"
2. Parser: CHECK_BALANCE command ✅
3. Executes wallet balance check (NOT routed to agent)
4. Shows USDC balance

---

### ✅ Test 5: Mixed Workflow

**Scenario: Research then transact**

```
Step 1: 🎤 "Dime sobre Uniswap"
→ Agent responds with UNI token info

Step 2: 🎤 "Swap for gold"
→ Wallet command: initiates UNI swap

Step 3: Type: "CONFIRM"
→ Executes swap transaction
```

---

## Debugging

### If You Get an Error

Check the server logs (terminal where you ran `pnpm dev`):

```bash
# Look for these logs:
Calling ElevenLabs agent with transcription: Dime de oro en las redes de Ethereum
Agent response: { text: "...", ... }

# Or errors:
Voice agent query error: ...
API Error Response: ...
API Error Status: 401 / 400 / 500
```

### Common Issues

#### Error: "API Error: 401 - Unauthorized"
**Cause**: Invalid or missing `ELEVENLABS_API_KEY`

**Fix**:
```bash
# Check .env file
cat .env | grep ELEVENLABS_API_KEY

# If missing or wrong, update it:
# 1. Go to https://elevenlabs.io/app/settings
# 2. Copy your API key
# 3. Update .env:
ELEVENLABS_API_KEY=your_actual_key_here

# Restart server
pnpm dev
```

---

#### Error: "Agent not found" or "Invalid agent_id"
**Cause**: Wrong `ELEVENLABS_AGENT_ID`

**Fix**:
```bash
# Your agent ID (from screenshot): agent_5401k83ya0nbfv7b1hj2bxqta05k
# Update .env:
ELEVENLABS_AGENT_ID=agent_5401k83ya0nbfv7b1hj2bxqta05k

# Restart
pnpm dev
```

---

#### Error: "No pude encontrar esa información"
**Cause**: Agent couldn't find data (not an error, just no results)

**Try**:
- Ask about well-known tokens: ONDO, USDC, Chainlink
- Be more specific: "precio de" instead of just "dime de"

---

#### Agent Response is Generic/Unhelpful
**Cause**: CoinGecko MCP might not be properly configured in ElevenLabs

**Fix**:
1. Go to your agent: https://elevenlabs.io/app/agents/agent_5401k83ya0nbfv7b1hj2bxqta05k
2. Click "Agent" tab → scroll to "Custom MCP Servers"
3. Verify "CoinGecko-MCP" is there with green indicator ✅
4. If not, click "Add Server" and connect CoinGecko MCP
5. Enable these tools:
   - ✅ coins_markets
   - ✅ coins_id
   - ✅ search
   - ✅ search_trending
   - ✅ coins_id_market_chart

---

## Expected Console Output (Success)

```bash
# When voice RWA query is processed:

Calling ElevenLabs agent with transcription: Dime de oro en las redes de Ethereum

Agent response: {
  text: 'Hay varios tokens relacionados con oro en Ethereum...',
  conversation_id: 'conv_abc123',
  ...
}

# No errors = working! ✅
```

---

## No Need for CoinGeckoRWAService.ts

**You do NOT need to create this file** because:

1. **CoinGecko MCP is already connected** to your ElevenLabs agent
2. **Agent handles all CoinGecko queries internally**
3. **Your code just sends questions and receives answers**

### Architecture

```
┌─────────────────────────────────────────┐
│  User Voice: "Dime de oro en Ethereum"  │
└───────────────┬─────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│  TelegramService (Node.js)                │
│  - Transcribes voice → text               │
│  - Detects RWA query                      │
│  - Calls ElevenLabs agent                 │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│  ElevenLabs Agent (Cloud)                 │
│  - Receives question                      │
│  - Uses CoinGecko MCP (internal)          │
│  - Formats response per system prompt     │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│  CoinGecko API (via MCP)                  │
│  - Agent calls: coins_markets, coins_id   │
│  - Returns: price, market cap, etc.       │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│  Agent Response                           │
│  "Hay varios tokens relacionados..."      │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│  TelegramService sends to user            │
│  📊 [Agent's formatted response]          │
└───────────────────────────────────────────┘
```

**Key Point**: All CoinGecko integration happens **inside** the ElevenLabs agent. Your code is just a messenger.

---

## Next Steps

### 1. Test Now ✅

Restart your server:
```bash
# In terminal:
cd /Users/juanisaac/Desktop/stablepagoV2/stablePago
pnpm dev
```

Send voice message:
```
🎤 "Dime de oro en las redes de Ethereum"
```

Check logs for:
- `Calling ElevenLabs agent with transcription: ...`
- `Agent response: { text: "..." }`

---

### 2. If It Works 🎉

You now have:
- ✅ Voice wallet operations (English)
- ✅ Voice RWA queries (Spanish + English)
- ✅ Text RWA queries (Spanish + English)
- ✅ Intelligent routing (wallet vs RWA)
- ✅ Security confirmations (for transactions)

**LinkedIn Post Time!** You've built a truly multilingual, voice-enabled crypto assistant.

---

### 3. If It Doesn't Work 🔧

**Share the error logs:**
1. Look in your terminal where `pnpm dev` is running
2. Copy the error message (especially the part starting with "Voice agent query error:")
3. Share it so we can debug

**Check ElevenLabs Dashboard:**
1. Go to https://elevenlabs.io/app/conversations
2. Look for recent conversations from your agent
3. See if the query reached the agent at all

---

## Future Enhancements 🚀

Once basic text responses work, you can add:

### Phase 2: Audio Responses
- Agent responds with voice (not just text)
- Requires WebSocket API or conversation endpoint
- More complex but creates full voice conversation

### Phase 3: Conversation Memory
- Agent remembers previous questions
- "Tell me more about that" works
- Requires conversation session management

### Phase 4: Charts & Images
- Agent can generate price charts
- Send as images to Telegram
- Visual data representation

---

## Summary

### What You Have Now

```typescript
// Voice RWA Query Flow (NEW! ✨)
🎤 "Dime de oro"
  → Transcribe: "Dime de oro en las redes de Ethereum"
  → Parse: UNKNOWN
  → RWA Check: ✅ (contains "oro")
  → Route to ElevenLabs Agent
  → Agent uses CoinGecko MCP
  → 📊 Response with gold token data

// Wallet Operations (UNCHANGED ✅)
🎤 "Send 10 to grandma"
  → Parse: SEND command
  → Show confirmation
  → Type: "CONFIRM"
  → Execute transaction
```

### Files Changed

1. **`services/TelegramService.ts`**
   - Added Spanish keywords to `isRWAQuery()`
   - Updated `executeVoiceCommand()` to check transcription
   - Fixed `handleVoiceAgentQuery()` API call
   - Added detailed logging

2. **No other files needed!**
   - Don't create `CoinGeckoRWAService.ts`
   - Agent handles CoinGecko internally

---

## Support

If you encounter issues:

1. **Check logs** (server terminal)
2. **Verify ElevenLabs setup**:
   - API key in `.env`
   - Agent ID correct
   - CoinGecko MCP connected
3. **Test with simple query first**: "What is USDC?"

Ready to test! 🚀


