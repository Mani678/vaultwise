// lib/portfolio.ts
// LI.FI Earn Portfolio API

export interface Position {
  chainId: number;
  chain: string;
  protocolName: string;
  asset: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  balanceUsd: string;
  balanceNative: string;
  apy?: number;
  apyFormatted?: string;
}

const EARN_BASE = "https://earn.li.fi/v1";

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum", 137: "Polygon", 42161: "Arbitrum", 10: "Optimism", 8453: "Base",
};

const EXPLORER_URLS: Record<number, string> = {
  1:     "https://etherscan.io",
  137:   "https://polygonscan.com",
  42161: "https://arbiscan.io",
  10:    "https://optimistic.etherscan.io",
  8453:  "https://basescan.org",
};

export function getExplorerUrl(chainId: number, txHash: string): string {
  const base = EXPLORER_URLS[chainId] ?? "https://etherscan.io";
  return `${base}/tx/${txHash}`;
}

export async function fetchPortfolio(userAddress: string): Promise<Position[]> {
  const res = await fetch(
    `${EARN_BASE}/portfolio/${userAddress}/positions`,
    { headers: { "Content-Type": "application/json", "x-lifi-api-key": process.env.LIFI_API_KEY ?? "" } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const positions: unknown[] = Array.isArray(data?.positions)
    ? data.positions
    : Array.isArray(data)
    ? data
    : [];

  return positions.map((p: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pos = p as any;
    const chainId = pos.chainId ?? 1;
    return {
      chainId,
      chain: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,
      protocolName: pos.protocolName ?? pos.protocol ?? "Unknown",
      asset: {
        address: pos.asset?.address ?? "",
        name:    pos.asset?.name ?? "",
        symbol:  pos.asset?.symbol ?? "",
        decimals: pos.asset?.decimals ?? 6,
      },
      balanceUsd:    pos.balanceUsd ?? "0",
      balanceNative: pos.balanceNative ?? "0",
      apy:           pos.apy ? (pos.apy > 1 ? pos.apy / 100 : pos.apy) : undefined,
      apyFormatted:  pos.apy ? `${(pos.apy > 1 ? pos.apy : pos.apy * 100).toFixed(2)}%` : undefined,
    };
  });
}
