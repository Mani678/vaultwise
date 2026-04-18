# ⚡ Vaultwise — One-Click DeFi Yield Routing

> **DeFi Mullet Hackathon #1 Submission** · Built with LI.FI Earn API + Composer SDK

Vaultwise is a one-click DeFi yield optimizer that finds the best vault for your token and risk tolerance — then deposits automatically. No manual protocol research, no multi-step bridging, no copy-pasting contract addresses.

🌐 **Live Demo:** https://getvaultwise.vercel.app

**Real mainnet transaction on Base:**
https://basescan.org/tx/0x821a60fcedba9446f39cdab7101fb70725d40bcf96f9b2f79654763956b8aa2a

---

## The Problem

DeFi yield is fragmented across dozens of protocols and chains. A user who wants to earn yield on their USDC has to:

1. Research which protocols are safe
2. Compare APYs across Aave, Morpho, Euler etc.
3. Bridge to the right chain
4. Approve token spend
5. Execute the deposit transaction

This is a 20-minute process that requires significant DeFi knowledge. Most users give up.

---

## The Solution

Vaultwise reduces this to **3 clicks**:

1. Select your token (USDC / ETH / WBTC) and risk tolerance (Low / Medium / High)
2. Click **Find Best Yield**
3. Click **Deposit** and confirm in your wallet

The app handles everything else — vault discovery, risk scoring, chain switching, token approval, and deposit execution.

---

## Features

- 🔍 **Live vault discovery** — fetches real-time APY and TVL from 20+ protocols across 5 chains
- 🛡️ **Risk-based selection** — scores vaults by protocol reputation, TVL and APY stability
- 💰 **Multi-token support** — USDC, ETH and WBTC
- ⚡ **One-click deposit** — LI.FI Composer SDK handles approval + chain switch + deposit automatically
- 📊 **Portfolio view** — shows active positions across all supported protocols
- 🔔 **Rebalance alerts** — monitors for better vaults and alerts when 2%+ APY improvement found
- 📱 **Mobile + Safari optimized** — works on all devices and browsers
- 🔗 **Multi-chain** — Base, Arbitrum, Optimism, Polygon, Ethereum

---

## How It Works

```
User selects token + risk level
        ↓
LI.FI Earn API fetches live vaults across 5 chains
(earn.li.fi/v1/vaults)
        ↓
Risk strategy scores and ranks vaults
Low  → established protocols + TVL > $50M + APY < 12%
Med  → TVL > $10M + APY < 25%
High → maximum APY, no filter
Chain preference: Base > Arbitrum > Optimism > Ethereum
        ↓
Best vault displayed with APY, TVL, chain, protocol
        ↓
LI.FI Composer SDK executes deposit:
  → Token approval handled automatically
  → Chain switching handled automatically
  → Deposit in one transaction, one signature
        ↓
Position appears in Portfolio view
        ↓
Rebalance alert monitors for better opportunities every 60s
```

---

## LI.FI Integration

**1. LI.FI Earn API — vault discovery**
```
GET https://earn.li.fi/v1/vaults?chainId=8453&asset=USDC&sortBy=apy&limit=20
Headers: x-lifi-api-key: YOUR_API_KEY
```

**2. LI.FI Composer SDK — deposit execution**
```ts
const quote = await getQuote({
  fromChain:   vault.chainId,
  toChain:     vault.chainId,
  fromToken:   vault.underlyingToken.address,
  toToken:     vault.vaultAddress, // triggers Composer deposit
  fromAmount:  amountIn,
  fromAddress: userAddress,
});
const route = convertQuoteToRoute(quote);
await executeRoute(route, { updateRouteHook });
```

**3. LI.FI Earn Portfolio API — position tracking**
```
GET https://earn.li.fi/v1/portfolio/:address/positions
Headers: x-lifi-api-key: YOUR_API_KEY
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Wallet | wagmi v2, viem |
| Vault Discovery | LI.FI Earn API |
| Execution | LI.FI Composer SDK (@lifi/sdk v3) |
| Chains | Ethereum, Base, Arbitrum, Optimism, Polygon |
| Styling | Custom CSS |

---

## Supported Protocols

Morpho · Aave V3 · Euler · Seamless · Moonwell

## Supported Chains

Ethereum · Base · Arbitrum · Optimism · Polygon

## Supported Tokens

USDC · ETH · WBTC

---

## Project Structure

```
vaultwise/
├── app/
│   ├── api/portfolio/route.ts   ← server-side portfolio proxy (avoids CORS)
│   ├── layout.tsx
│   ├── page.tsx                 ← main UI + token/risk selector
│   └── globals.css
├── components/
│   ├── DepositPanel.tsx         ← LI.FI SDK deposit flow
│   ├── Portfolio.tsx            ← active positions display
│   ├── RebalanceAlert.tsx       ← better vault detection + alert
│   ├── VaultCard.tsx            ← vault display
│   ├── WalletButton.tsx         ← connect/disconnect
│   └── Providers.tsx            ← wagmi + react-query
├── lib/
│   ├── lifi.ts                  ← LI.FI Earn API fetch + parse (multi-token)
│   ├── strategy.ts              ← vault selection + risk scoring
│   ├── portfolio.ts             ← portfolio fetch + parse
│   └── wagmi.ts                 ← wallet config
└── actions/
    └── findVault.ts             ← server action: fetch + select
```

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/Mani678/vaultwise
cd vaultwise

# 2. Install dependencies
npm install

# 3. Set up environment
# Create a .env.local file with your LI.FI API key
# Get your key at https://portal.li.fi
echo "LIFI_API_KEY=your_key_here" > .env.local

# 4. Run
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

```bash
# .env.local
LIFI_API_KEY=your_lifi_api_key_here
```

Get your LI.FI API key at **https://portal.li.fi**

---

## Roadmap

- [ ] Withdraw flow via Composer SDK
- [ ] Auto-rebalancing — automatically move funds to higher-yield vaults
- [ ] Claude AI — explain vault selection reasoning in plain English
- [ ] Email/push alerts when APY changes significantly
- [ ] Mobile app (React Native + wagmi)

---

## Built With

- [LI.FI](https://li.fi) — vault data + execution infrastructure
- [Next.js](https://nextjs.org) — React framework
- [wagmi](https://wagmi.sh) — Ethereum React hooks
- [viem](https://viem.sh) — TypeScript Ethereum library

---

*Built for DeFi Mullet Hackathon #1 · April 2026*
