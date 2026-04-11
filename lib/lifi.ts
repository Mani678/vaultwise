// lib/lifi.ts
// LI.FI Earn API — only returns Composer-supported vaults

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

const EARN_BASE = "https://earn.li.fi/v1/earn";
const TARGET_CHAIN_IDS = [1, 137, 42161, 10, 8453];

export const USDC_ADDRESSES: Record<number, string> = {
  1:     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  137:   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  42161: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
  10:    "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  8453:  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum", 137: "Polygon", 42161: "Arbitrum", 10: "Optimism", 8453: "Base",
};

// ONLY these protocols are supported by LI.FI Composer for deposits
// Source: https://docs.li.fi/composer/reference/supported-protocols
const COMPOSER_SUPPORTED_PROTOCOLS = [
  "morpho", "aave", "euler", "seamless", "moonwell",
];

export async function fetchUSDCVaults(): Promise<Vault[]> {
  const allVaults: Vault[] = [];

  await Promise.all(
    TARGET_CHAIN_IDS.map(async (chainId) => {
      try {
        const url = `${EARN_BASE}/vaults?chainId=${chainId}&asset=USDC&sortBy=apy&limit=20`;
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json" },
          next: { revalidate: 60 },
        });
        if (!res.ok) return;

        const json = await res.json();
        const raw: unknown[] = Array.isArray(json?.data) ? json.data : [];

        const parsed = raw
          .map((v) => parseVault(v, chainId))
          .filter((v): v is Vault => v !== null)
          // Only keep Composer-supported protocols
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
    throw new Error("No supported vaults found. Try again shortly.");
  }

  return allVaults;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseVault(raw: unknown, chainId: number): Vault | null {
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

    return {
      id: r?.slug ?? r?.id ?? `${protocol}-${chainId}-${vaultAddress}`,
      protocol,
      chain: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,
      chainId,
      token: underlying.symbol ?? "USDC",
      tokenAddress: underlying.address ?? USDC_ADDRESSES[chainId] ?? "",
      apy: apyDecimal,
      apyFormatted: `${(apyDecimal * 100).toFixed(2)}%`,
      tvl,
      riskScore,
      depositContractAddress: vaultAddress,
      vaultAddress,
      underlyingToken: {
        address: underlying.address ?? USDC_ADDRESSES[chainId] ?? "",
        symbol: underlying.symbol ?? "USDC",
        decimals: underlying.decimals ?? 6,
        chainId,
      },
      raw,
    };
  } catch {
    return null;
  }
}

function deriveRiskScore(protocol: string, tvl: number, apy: number): number {
  const LOW_RISK = ["aave", "compound", "morpho", "spark", "yearn", "euler", "fluid", "seamless", "exactly", "moonwell"];
  const isEstablished = LOW_RISK.some((p) => protocol.toLowerCase().includes(p));
  if (isEstablished && tvl > 50_000_000 && apy < 0.12) return 1;
  if (tvl > 10_000_000 && apy < 0.25) return 2;
  return 3;
}