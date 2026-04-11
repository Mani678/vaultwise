"use client";
// components/VaultCard.tsx
// Displays a single vault's key details

import type { Vault } from "@/lib/lifi";

const RISK_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: "Low Risk",    cls: "risk-low"    },
  2: { label: "Medium Risk", cls: "risk-medium" },
  3: { label: "High Risk",   cls: "risk-high"   },
};

interface VaultCardProps {
  vault: Vault;
  reason: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function VaultCard({ vault, reason, isSelected, onSelect }: VaultCardProps) {
  const risk = RISK_LABELS[vault.riskScore] ?? RISK_LABELS[2];
  const tvlFormatted = formatTVL(vault.tvl);

  return (
    <div
      className={`vault-card ${isSelected ? "vault-card--selected" : ""}`}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="vault-card__header">
        <div className="vault-card__protocol">{vault.protocol}</div>
        <span className={`badge ${risk.cls}`}>{risk.label}</span>
      </div>

      <div className="vault-card__apy">{vault.apyFormatted}</div>
      <div className="vault-card__apy-label">APY</div>

      <div className="vault-card__meta">
        <div className="vault-card__meta-item">
          <span className="label">Chain</span>
          <span className="value">{vault.chain}</span>
        </div>
        <div className="vault-card__meta-item">
          <span className="label">Token</span>
          <span className="value">{vault.token}</span>
        </div>
        <div className="vault-card__meta-item">
          <span className="label">TVL</span>
          <span className="value">{tvlFormatted}</span>
        </div>
      </div>

      <p className="vault-card__reason">{reason}</p>
    </div>
  );
}

function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000)     return `$${(tvl / 1_000_000).toFixed(1)}M`;
  if (tvl >= 1_000)         return `$${(tvl / 1_000).toFixed(0)}K`;
  return `$${tvl.toFixed(0)}`;
}
