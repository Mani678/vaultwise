"use client";
// components/Portfolio.tsx
// Shows user's active yield positions from LI.FI Earn portfolio API

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { fetchPortfolio, type Position } from "@/lib/portfolio";

export function Portfolio() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading]     = useState(false);
  const [loaded, setLoaded]       = useState(false);

  useEffect(() => {
    if (!address || !isConnected) return;

    setLoading(true);
    fetchPortfolio(address)
      .then((data) => {
        setPositions(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }, [address, isConnected]);

  // Refresh after a deposit — poll every 30s when connected
  useEffect(() => {
    if (!address || !isConnected) return;
    const interval = setInterval(() => {
      fetchPortfolio(address).then(setPositions).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [address, isConnected]);

  if (!isConnected) return null;

  const totalUsd = positions.reduce(
    (sum, p) => sum + parseFloat(p.balanceUsd ?? "0"),
    0
  );

  return (
    <section className="section portfolio">
      <div className="section__header">
        <h2 className="section__title">Your Positions</h2>
        {loading && <span className="portfolio__loading">Refreshing…</span>}
        {!loading && loaded && positions.length > 0 && (
          <span className="portfolio__total">
            ${totalUsd.toFixed(2)} total
          </span>
        )}
      </div>

      {loading && !loaded && (
        <div className="portfolio__empty">
          <span className="spinner-dark" />
          Loading your positions…
        </div>
      )}

      {loaded && positions.length === 0 && (
        <div className="portfolio__empty">
          No active positions yet. Deposit into a vault to start earning.
        </div>
      )}

      {positions.length > 0 && (
        <div className="portfolio__grid">
          {positions.map((pos, i) => (
            <div key={i} className="position-card">
              <div className="position-card__header">
                <span className="position-card__protocol">
                  {formatProtocol(pos.protocolName)}
                </span>
                <span className="position-card__chain">{pos.chain}</span>
              </div>

              <div className="position-card__balance">
                ${parseFloat(pos.balanceUsd).toFixed(4)}
              </div>
              <div className="position-card__label">Current Value (USD)</div>

              <div className="position-card__meta">
                <div className="position-card__meta-item">
                  <span className="label">Asset</span>
                  <span className="value">{pos.asset.symbol || "—"}</span>
                </div>
              </div>

              {parseFloat(pos.balanceUsd) > 0 && (
                <p className="position-card__earning">
                  ⚡ Earning yield on {pos.asset.symbol} via {formatProtocol(pos.protocolName)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatProtocol(name: string): string {
  return name
    .replace(/-v\d+$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}