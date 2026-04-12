"use client";
// components/RebalanceAlert.tsx
// Monitors for better yield opportunities after a deposit
// and alerts the user if a significantly better vault appears

import { useEffect, useState } from "react";
import { fetchUSDCVaults, type Vault } from "@/lib/lifi";

interface RebalanceAlertProps {
  currentVault: Vault;
  onSwitch: (vault: Vault) => void;
}

const IMPROVEMENT_THRESHOLD = 0.02; // alert if 2%+ better APY exists
const POLL_INTERVAL = 60_000;       // check every 60 seconds

export function RebalanceAlert({ currentVault, onSwitch }: RebalanceAlertProps) {
  const [betterVault, setBetterVault] = useState<Vault | null>(null);
  const [dismissed, setDismissed]     = useState(false);

  const checkForBetterVault = async () => {
    try {
      const vaults = await fetchUSDCVaults();

      const better = vaults
        .filter((v) => v.id !== currentVault.id)
        .filter((v) => v.riskScore <= currentVault.riskScore) // same or lower risk
        .find((v) => v.apy > currentVault.apy + IMPROVEMENT_THRESHOLD);

      if (better) {
        setBetterVault(better);
      } else {
        setBetterVault(null);
      }
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkForBetterVault();

    // Then poll every 60 seconds
    const interval = setInterval(checkForBetterVault, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [currentVault]);

  if (!betterVault || dismissed) return null;

  const improvement = ((betterVault.apy - currentVault.apy) * 100).toFixed(2);

  return (
    <div className="rebalance-alert">
      <div className="rebalance-alert__icon">⚡</div>
      <div className="rebalance-alert__content">
        <div className="rebalance-alert__title">Better opportunity found</div>
        <div className="rebalance-alert__body">
          <strong>{betterVault.protocol}</strong> on {betterVault.chain} is offering{" "}
          <strong>{betterVault.apyFormatted} APY</strong> — that's{" "}
          <strong>+{improvement}%</strong> more than your current{" "}
          {currentVault.apyFormatted} on {currentVault.protocol}.
        </div>
      </div>
      <div className="rebalance-alert__actions">
        <button
          className="btn btn-primary btn--sm"
          onClick={() => {
            setDismissed(true);
            onSwitch(betterVault);
          }}
        >
          Switch Vault
        </button>
        <button
          className="btn btn-ghost btn--sm"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}