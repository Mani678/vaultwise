# ⚡ YieldRouter — AI-Powered Yield Routing

> **LI.FI Hackathon Submission** · Built with LI.FI Earn API + Composer SDK

YieldRouter is a one-click DeFi yield optimizer that finds the best USDC vault for your risk tolerance and executes the deposit — all in a single transaction. No manual protocol research, no multi-step bridging, no copy-pasting contract addresses.

---

## The Problem

DeFi yield is fragmented across dozens of protocols and chains. A user who wants to earn yield on their USDC has to:

1. Research which protocols are safe
2. Compare APYs across Aave, Morpho, Euler, etc.
3. Bridge to the right chain
4. Approve token spend
5. Execute the deposit transaction

This is a 20-minute process that requires significant DeFi knowledge. Most users give up.

---

## The Solution

YieldRouter reduces this to **3 clicks**:

1. Select your risk tolerance (Low / Medium / High)
2. Click **Find Best Yield**
3. Click **Deposit** and confirm in your wallet

The app handles everything else — vault discovery, risk scoring, chain switching, token approval, and deposit execution.

---

## Live Demo

> Transaction on Base mainnet:
> https://basescan.org/tx/0x821a60fcedba9446f39cdab7101fb70725d40bcf96f9b2f79654763956b8aa2a

---

## How It Works

```
User selects risk level
        ↓
LI.FI Earn API fetches live vaults across 5 chains
        ↓
Risk strategy scores and ranks vaults
(Low → established protocols + high TVL)
(Medium → balanced APY/risk)
(High → maximum APY)
        ↓
Best vault displayed with APY, TVL, chain, protocol
        ↓
LI.FI Composer SDK executes deposit:
  → Handles token approval automatically
  → Switches wallet chain if needed
  → Executes deposit in one transaction
        ↓
Position appears in "Your Positions" portfolio view
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Wallet | wagmi v2, viem |
| Vault Discovery | LI.FI Earn API (`earn.li.fi`) |
| Execution | LI.FI Composer SDK (`@lifi/sdk` v3) |
| Chains | Ethereum, Base, Arbitrum, Optimism, Polygon |
| Styling | Custom CSS (no UI library) |

---

## LI.FI Integration

This project uses two LI.FI products:

**1. LI.FI Earn API** — vault discovery
```
GET https://earn.li.fi/v1/earn/vaults?chainId=8453&asset=USDC&sortBy=apy
```
Fetches live yield opportunities from Morpho, Aave, Euler and 20+ protocols across 60+ chains with standardized APY and TVL data.

**2. LI.FI Composer SDK** — deposit execution
```ts
const quote = await getQuote({
  fromChain: vault.chainId,
  toChain:   vault.chainId,
  fromToken: USDC_ADDRESS,
  toToken:   vault.vaultAddress, // triggers Composer deposit
  fromAmount: amountIn,
  fromAddress: userAddress,
});
const route = convertQuoteToRoute(quote);
await executeRoute(route, { updateRouteHook });
```
The SDK handles token approvals, chain switching, and deposit execution automatically — no manual transaction building required.

**3. LI.FI Earn Portfolio API** — position tracking
```
GET https://earn.li.fi/v1/earn/portfolio/:address/positions
```
Shows the user's active yield positions across all supported protocols after depositing.

---

## Vault Selection Strategy

```ts
// Low risk  → established protocols (Aave, Morpho) + TVL > $50M + APY < 12%
// Medium    → TVL > $10M + APY < 25%
// High      → highest APY, no filter

// Chain preference: Base > Arbitrum > Optimism > Ethereum
// (cheaper gas = better UX)
```

---

## Project Structure

```
yield-router/
├── app/
│   ├── api/portfolio/route.ts   ← server-side portfolio proxy (avoids CORS)
│   ├── layout.tsx
│   ├── page.tsx                 ← main UI
│   └── globals.css
├── components/
│   ├── DepositPanel.tsx         ← LI.FI SDK deposit flow
│   ├── Portfolio.tsx            ← active positions display
│   ├── VaultCard.tsx            ← vault display
│   ├── WalletButton.tsx         ← connect/disconnect
│   └── Providers.tsx            ← wagmi + react-query
├── lib/
│   ├── lifi.ts                  ← LI.FI Earn API fetch + parse
│   ├── strategy.ts              ← vault selection logic
│   ├── portfolio.ts             ← portfolio fetch + parse
│   └── wagmi.ts                 ← wallet config
└── actions/
    └── findVault.ts             ← server action: fetch + select
```

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/yield-router
cd yield-router

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local
# Add your WalletConnect Project ID (free at cloud.walletconnect.com)

# 4. Run
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
```

Get a free WalletConnect Project ID at https://cloud.walletconnect.com

---

## Supported Protocols

Morpho · Aave V3 · Euler · Seamless · Moonwell

---

## Supported Chains

Ethereum · Base · Arbitrum · Optimism · Polygon

---

## What's Next

- [ ] Withdraw flow (reverse deposit via Composer)
- [ ] Multi-token support (ETH, WBTC, USDT)
- [ ] Claude AI explanation of vault selection reasoning
- [ ] Email/push alerts when APY changes significantly
- [ ] Mobile app (React Native + wagmi)

---

## Built With

- [LI.FI](https://li.fi) — vault data + execution infrastructure
- [Next.js](https://nextjs.org) — React framework
- [wagmi](https://wagmi.sh) — Ethereum React hooks
- [viem](https://viem.sh) — TypeScript Ethereum library

---

*Built for the LI.FI Hackathon · April 2026*
