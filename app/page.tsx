"use client";
// app/page.tsx

import { useState, useTransition, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { VaultCard } from "@/components/VaultCard";
import { DepositPanel } from "@/components/DepositPanel";
import { Portfolio } from "@/components/Portfolio";
import { RebalanceAlert } from "@/components/RebalanceAlert";
import { findBestVault } from "@/actions/findVault";
import { SUPPORTED_TOKENS, type SupportedToken } from "@/lib/lifi";
import type { RiskLevel, SelectionResult } from "@/lib/strategy";
import type { Vault } from "@/lib/lifi";

type AppState = "idle" | "loading" | "result" | "error";

const RISK_OPTIONS: { value: RiskLevel; label: string; desc: string; icon: string }[] = [
  { value: "low",    label: "Low",    desc: "Established protocols, stable APY", icon: "🛡️" },
  { value: "medium", label: "Medium", desc: "Balanced risk & reward",             icon: "⚖️" },
  { value: "high",   label: "High",   desc: "Maximum APY, higher risk",          icon: "🚀" },
];

const PREFERRED_CHAINS = [8453, 42161, 10];

export default function Home() {
  const [token, setToken]       = useState<SupportedToken>("USDC");
  const [risk, setRisk]         = useState<RiskLevel>("medium");
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult]     = useState<SelectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [depositedVault, setDepositedVault] = useState<Vault | null>(null);
  const [isPending, startTransition] = useTransition();

  const { chainId, isConnected } = useAccount();
  const { switchChainAsync }     = useSwitchChain();

  // Auto switch to Base when on Ethereum mainnet
  useEffect(() => {
    if (!isConnected || !chainId) return;
    if (PREFERRED_CHAINS.includes(chainId)) return;
    switchChainAsync({ chainId: 8453 }).catch(() => {});
  }, [isConnected, chainId, switchChainAsync]);

  // Reset results when token changes
  useEffect(() => {
    setResult(null);
    setAppState("idle");
    setDepositedVault(null);
  }, [token]);

  const handleFindVault = () => {
    startTransition(async () => {
      setAppState("loading");
      setErrorMsg(null);
      setResult(null);

      const res = await findBestVault(risk, token);
      if (!res.success) {
        setErrorMsg(res.error);
        setAppState("error");
        return;
      }
      setResult(res.data);
      setAppState("result");
    });
  };

  const handleSwitchVault = (newVault: Vault) => {
    if (!result) return;
    setResult({
      ...result,
      vault: newVault,
      reason: `Switched to better opportunity — ${newVault.protocol} on ${newVault.chain} offering ${newVault.apyFormatted} APY`,
    });
    setDepositedVault(null);
  };

  return (
    <main className="app">
      {/* Header */}
      <header className="app__header">
        <div className="header__brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Vaultwise</span>
          <span className="brand-tag">powered by LI.FI</span>
        </div>
        <WalletButton />
      </header>

      {/* Hero */}
      <section className="hero">
        <h1 className="hero__title">AI-Powered<br />Yield Routing</h1>
        <p className="hero__sub">
          Pick your token and risk tolerance. We find the best vault and deposit for you — in one click.
        </p>
      </section>

      {/* Rebalance Alert */}
      {depositedVault && (
        <RebalanceAlert
          currentVault={depositedVault}
          onSwitch={handleSwitchVault}
        />
      )}

      {/* Portfolio */}
      <Portfolio />

      {/* Input Panel */}
      <section className="input-panel">

        {/* Token Selector */}
        <div className="field">
          <label className="field__label">Token</label>
          <div className="token-grid">
            {SUPPORTED_TOKENS.map((t) => (
              <button
                key={t.symbol}
                className={`token-option ${token === t.symbol ? "token-option--active" : ""}`}
                onClick={() => setToken(t.symbol)}
              >
                <span className="token-option__icon">{t.icon}</span>
                <span className="token-option__symbol">{t.symbol}</span>
                <span className="token-option__name">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Risk Selector */}
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
            : `⚡ Find Best ${token} Yield`}
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
              <span className="section__badge">{risk} risk · {token}</span>
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
            <DepositPanel
              vault={result.vault}
              onDepositSuccess={() => setDepositedVault(result.vault)}
            />
          </section>
        </>
      )}

      <footer className="app__footer">
        <span>Built with LI.FI Earn API · DeFi Mullet Hackathon #1</span>
      </footer>
    </main>
  );
}