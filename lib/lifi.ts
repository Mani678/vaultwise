// lib/lifi.ts
// LI.FI Earn API — https://docs.li.fi/earn/overview

export interface Vault {
  id: string;
  protocol: string;
  chain: string;
  chainId: number;
  token: string;
  tokenAddress: string;
  apy: number;
  apyFormatted: string;
  tvl: number;
  riskScore: number;
  depositContractAddress: string;
  vaultAddress: string;
  underlyingToken: {
    address: string;
    symbol: string;
    decimals: number;
    chainId: number;
  };
  raw: unknown;
}

// Supported tokens
export type SupportedToken = "USDC" | "ETH" | "WBTC";

export interface TokenConfig {
  symbol: SupportedToken;
  name: string;
  icon: string;
  decimals: number;
  addresses: Record<number, string>;
}

export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "💵",
    decimals: 6,
    addresses: {
      1:     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      137:   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      42161: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      10:    "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      8453:  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: "⟠",
    decimals: 18,
    addresses: {
      1:     "0x0000000000000000000000000000000000000000",
      42161: "0x0000000000000000000000000000000000000000",
      10:    "0x0000000000000000000000000000000000000000",
      8453:  "0x0000000000000000000000000000000000000000",
    },
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    icon: "₿",
    decimals: 8,
    addresses: {
      1:     "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      42161: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      10:    "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    },
  },
];

// ONLY these protocols are supported by LI.FI Composer
const COMPOSER_SUPPORTED_PROTOCOLS = [
  "morpho", "aave", "euler", "seamless", "moonwell",
];

const EARN_BASE = "https://earn.li.fi/v1";
const TARGET_CHAIN_IDS = [1, 137, 42161, 10, 8453];

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum", 137: "Polygon", 42161: "Arbitrum",
  10: "Optimism", 8453: "Base",
};

// Preferred cheap-gas chains
const PREFERRED_CHAIN_IDS = [8453, 42161, 10];

export async function fetchVaults(token: SupportedToken = "USDC"): Promise<Vault[]> {
  // LI.FI Earn API uses WETH for ETH vault queries
  const apiToken = token === "ETH" ? "WETH" : token;
  const allVaults: Vault[] = [];

  await Promise.all(
    TARGET_CHAIN_IDS.map(async (chainId) => {
      try {
        const url = `${EARN_BASE}/vaults?chainId=${chainId}&asset=${apiToken}&sortBy=apy&limit=20`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            "x-lifi-api-key": process.env.LIFI_API_KEY ?? "",
          },
          next: { revalidate: 60 },
        });
        if (!res.ok) return;

        const json = await res.json();
        const raw: unknown[] = Array.isArray(json?.data) ? json.data : [];

        const parsed = raw
          .map((v) => parseVault(v, chainId, token))
          .filter((v): v is Vault => v !== null)
          .filter((v) =>
            COMPOSER_SUPPORTED_PROTOCOLS.some((p) =>
              v.protocol.toLowerCase().includes(p)
            )
          );

        allVaults.push(...parsed);
      } catch {
        // skip failed chains
      }
    })
  );

  if (allVaults.length === 0) {
    throw new Error(`No supported vaults found for ${token}.`);
  }

  return allVaults;
}

// Keep backward compat for RebalanceAlert which calls fetchUSDCVaults
export async function fetchUSDCVaults(): Promise<Vault[]> {
  return fetchVaults("USDC");
}

function parseVault(raw: unknown, chainId: number, token: SupportedToken): Vault | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = raw as any;

    const apyRaw: number =
      r?.analytics?.apy?.total ??
      r?.analytics?.apy?.base ??
      r?.apy?.total ??
      r?.apy ?? 0;

    const apyDecimal = apyRaw > 1 ? apyRaw / 100 : apyRaw;

    const tvl: number = parseFloat(
      r?.analytics?.tvl?.usd ?? r?.tvl?.usd ?? r?.tvl ?? "0"
    );

    const protocol: string =
      r?.protocol?.name ?? r?.protocol ?? r?.provider ?? "Unknown";

    const vaultAddress: string = r?.address ?? "";
    const underlying = r?.underlyingTokens?.[0] ?? {};
    const riskScore = deriveRiskScore(protocol, tvl, apyDecimal);

    // Get token config for fallback address
    const tokenConfig = SUPPORTED_TOKENS.find((t) => t.symbol === token);
    const fallbackAddress = tokenConfig?.addresses[chainId] ?? "";
    const fallbackDecimals = tokenConfig?.decimals ?? 6;

    return {
      id: r?.slug ?? r?.id ?? `${protocol}-${chainId}-${vaultAddress}`,
      protocol,
      chain: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,
      chainId,
      token: underlying.symbol ?? token,
      tokenAddress: underlying.address ?? fallbackAddress,
      apy: apyDecimal,
      apyFormatted: `${(apyDecimal * 100).toFixed(2)}%`,
      tvl,
      riskScore,
      depositContractAddress: vaultAddress,
      vaultAddress,
      underlyingToken: {
        address:  underlying.address  ?? fallbackAddress,
        symbol:   underlying.symbol   ?? token,
        decimals: underlying.decimals ?? fallbackDecimals,
        chainId,
      },
      raw,
    };
  } catch {
    return null;
  }
}

function deriveRiskScore(protocol: string, tvl: number, apy: number): number {
  const LOW_RISK = [
    "aave", "compound", "morpho", "spark", "yearn", "euler",
    "fluid", "seamless", "exactly", "moonwell",
  ];
  const isEstablished = LOW_RISK.some((p) =>
    protocol.toLowerCase().includes(p)
  );
  if (isEstablished && tvl > 50_000_000 && apy < 0.12) return 1;
  if (tvl > 10_000_000 && apy < 0.25) return 2;
  return 3;
}

export { PREFERRED_CHAIN_IDS };
