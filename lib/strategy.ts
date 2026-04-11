// lib/strategy.ts
import type { Vault } from "./lifi";

export type RiskLevel = "low" | "medium" | "high";

export interface SelectionResult {
  vault: Vault;
  reason: string;
  alternatives: Vault[];
}

// Prefer these chains — cheaper gas, better for demos
const PREFERRED_CHAIN_IDS = [8453, 42161, 10]; // Base, Arbitrum, Optimism

export function selectBestVault(
  vaults: Vault[],
  risk: RiskLevel
): SelectionResult {
  if (vaults.length === 0) throw new Error("No vaults available.");

  const eligible = filterByRisk(vaults, risk);
  const pool = eligible.length > 0 ? eligible : vaults;

  const sorted = sortVaults(pool, risk);
  const best = sorted[0];

  return {
    vault: best,
    reason: buildReason(best, risk),
    alternatives: sorted.slice(1, 3),
  };
}

function filterByRisk(vaults: Vault[], risk: RiskLevel): Vault[] {
  switch (risk) {
    case "low":    return vaults.filter((v) => v.riskScore === 1);
    case "medium": return vaults.filter((v) => v.riskScore <= 2);
    case "high":   return vaults;
  }
}

function sortVaults(vaults: Vault[], risk: RiskLevel): Vault[] {
  return [...vaults].sort((a, b) => {
    // Always prefer cheap-gas chains over Ethereum mainnet
    const aPreferred = PREFERRED_CHAIN_IDS.includes(a.chainId) ? 1 : 0;
    const bPreferred = PREFERRED_CHAIN_IDS.includes(b.chainId) ? 1 : 0;

    if (aPreferred !== bPreferred) return bPreferred - aPreferred;

    // Within same chain preference, sort by APY
    return b.apy - a.apy;
  });
}

function buildReason(vault: Vault, risk: RiskLevel): string {
  const descriptions: Record<RiskLevel, string> = {
    low:    "Established protocol with stable yield",
    medium: "Balanced risk-reward profile",
    high:   "Highest available APY",
  };
  return `${descriptions[risk]} — ${vault.protocol} on ${vault.chain} offering ${vault.apyFormatted} APY`;
}