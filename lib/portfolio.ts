// lib/portfolio.ts

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
}

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum", 137: "Polygon", 42161: "Arbitrum",
  10: "Optimism", 8453: "Base", 100: "Gnosis",
};

const EXPLORER_URLS: Record<number, string> = {
  1:     "https://etherscan.io",
  137:   "https://polygonscan.com",
  42161: "https://arbiscan.io",
  10:    "https://optimistic.etherscan.io",
  8453:  "https://basescan.org",
  100:   "https://gnosisscan.io",
};

export function getExplorerUrl(chainId: number, txHash: string): string {
  const base = EXPLORER_URLS[chainId] ?? "https://etherscan.io";
  return `${base}/tx/${txHash}`;
}

export async function fetchPortfolio(userAddress: string): Promise<Position[]> {
  try {
    // Call our own API route — avoids CORS issues with earn.li.fi
    const res = await fetch(`/api/portfolio?address=${userAddress}`);
    if (!res.ok) return [];

    const data = await res.json();

    const raw: unknown[] = Array.isArray(data?.positions)
      ? data.positions
      : Array.isArray(data)
      ? data
      : [];

    return raw
      .filter((p: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return parseFloat((p as any)?.balanceUsd ?? "0") >= 0.01;
      })
      .map((p: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pos = p as any;
        const chainId = pos.chainId ?? 1;
        return {
          chainId,
          chain:        CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,
          protocolName: pos.protocolName ?? pos.protocol ?? "Unknown",
          asset: {
            address:  pos.asset?.address  ?? "",
            name:     pos.asset?.name     ?? "",
            symbol:   pos.asset?.symbol   ?? "",
            decimals: pos.asset?.decimals ?? 18,
          },
          balanceUsd:    pos.balanceUsd    ?? "0",
          balanceNative: pos.balanceNative ?? "0",
        };
      });
  } catch {
    return [];
  }
}