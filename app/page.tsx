"use client";
// app/page.tsx

import { useState, useTransition, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { VaultCard } from "@/components/VaultCard";
import { DepositPanel } from "@/components/DepositPanel";
import { Portfolio } from "@/components/Portfolio";
import { findBestVault } from "@/actions/findVault";
import type { RiskLevel, SelectionResult } from "@/lib/strategy";

type AppState = "idle" | "loading" | "result" | "error";

const RISK_OPTIONS: { value: RiskLevel; label: string; desc: string; icon: string }[] = [
  { value: "low",    label: "Low",    desc: "Established protocols, stable APY", icon: "🛡️" },
  { value: "medium", label: "Medium", desc: "Balanced risk & reward",             icon: "⚖️" },
  { value: "high",   label: "High",   desc: "Maximum APY, higher risk",          icon: "🚀" },
];

// Preferred cheap-gas chains — auto switch to first one the user isn't on
const PREFERRED_CHAINS = [8453, 42161, 10]; // Base, Arbitrum, Optimism

export default function Home() {
  const [risk, setRisk]         = useState<RiskLevel>("medium");
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult]     = useState<SelectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { chainId, isConnected } = useAccount();
  const { switchChainAsync }     = useSwitchChain();

  // Auto switch to Base when wallet connects on Ethereum mainnet
  useEffect(() => {
    if (!isConnected || !chainId) return;
    if (PREFERRED_CHAINS.includes(chainId)) return;
    // User is on Ethereum or unsupported chain — silently switch to Base
    switchChainAsync({ chainId: 8453 }).catch(() => {
      // User rejected — that's fine, we'll show the warning in DepositPanel
    });
  }, [isConnected, chainId, switchChainAsync]);

  const handleFindVault = () => {
    startTransition(async () => {
      setAppState("loading");
      setErrorMsg(null);
      setResult(null);

      const res = await findBestVault(risk);
      if (!res.success) {
        setErrorMsg(res.error);
        setAppState("error");
        return;
      }
      setResult(res.data);
      setAppState("result");
    });
  };

  return (
    <main className="app">
      {/* Header */}
      <header className="app__header">
        <div className="header__brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">YieldRouter</span>
          <span className="brand-tag">powered by LI.FI</span>
        </div>
        <WalletButton />
      </header>

      {/* Hero */}
      <section className="hero">
        <h1 className="hero__title">AI-Powered<br />Yield Routing</h1>
        <p className="hero__sub">
          Pick your risk tolerance. We find the best USDC vault and deposit for you.
        </p>
      </section>

      {/* Portfolio — shows after wallet connects */}
      <Portfolio />

      {/* Input Panel */}
      <section className="input-panel">
        <div className="field">
          <label className="field__label">Token</label>
          <div className="token-selector">
            <span className="token-selector__icon">💵</span>
            <span className="token-selector__name">USDC</span>
            <span className="token-selector__badge">Only supported token</span>
          </div>
        </div>

        <div className="field">
          <label className="field__label">Risk Level</label>
          <div className="risk-grid">
            {RISK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`risk-option ${risk === opt.value ? "risk-option--active" : ""}`}
                onClick={() => setRisk(opt.value)}
              >
                <span className="risk-option__icon">{opt.icon}</span>
                <span className="risk-option__label">{opt.label}</span>
                <span className="risk-option__desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className={`btn btn-primary btn--full btn--large ${isPending ? "btn--loading" : ""}`}
          onClick={handleFindVault}
          disabled={isPending}
        >
          {isPending
            ? <><span className="spinner" />Scanning vaults…</>
            : "⚡ Find Best Yield"}
        </button>
      </section>

      {/* Error */}
      {appState === "error" && errorMsg && (
        <section className="section">
          <div className="alert alert--error">
            <strong>Error:</strong> {errorMsg}
            <button className="btn btn-ghost btn--sm" onClick={() => setAppState("idle")}>
              Retry
            </button>
          </div>
        </section>
      )}

      {/* Results */}
      {appState === "result" && result && (
        <>
          <section className="section">
            <div className="section__header">
              <h2 className="section__title">Best Match</h2>
              <span className="section__badge">{risk} risk</span>
            </div>
            <VaultCard vault={result.vault} reason={result.reason} isSelected />
          </section>

          {result.alternatives.length > 0 && (
            <section className="section section--alt">
              <h3 className="section__title section__title--sm">Alternatives</h3>
              <div className="alt-grid">
                {result.alternatives.map((v) => (
                  <VaultCard
                    key={v.id}
                    vault={v}
                    reason={`${v.apyFormatted} APY on ${v.chain}`}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <DepositPanel vault={result.vault} />
          </section>
        </>
      )}

      <footer className="app__footer">
        <span>Built with LI.FI Earn API · Hackathon MVP</span>
      </footer>
    </main>
  );
}