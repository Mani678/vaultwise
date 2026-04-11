"use client";
// components/WalletButton.tsx
// Minimal connect/disconnect wallet button

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <span className="wallet-address">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button className="btn btn-ghost" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  // Find injected (MetaMask) connector first, fallback to first available
  const injected = connectors.find((c) => c.type === "injected") ?? connectors[0];

  return (
    <button
      className="btn btn-primary"
      onClick={() => connect({ connector: injected })}
      disabled={isPending}
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
