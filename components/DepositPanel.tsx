"use client";
// components/DepositPanel.tsx

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";
import { getQuote, convertQuoteToRoute, executeRoute, createConfig, EVM } from "@lifi/sdk";
import type { Route } from "@lifi/sdk";
import type { Vault } from "@/lib/lifi";
import { getExplorerUrl } from "@/lib/portfolio";

export type TxStatus =
  | "idle"
  | "building"
  | "awaiting_signature"
  | "pending"
  | "success"
  | "error";

export function DepositPanel({ vault }: { vault: Vault }) {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  const [amount, setAmount]     = useState("100");
  const [status, setStatus]     = useState<TxStatus>("idle");
  const [txHash, setTxHash]     = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stepMsg, setStepMsg]   = useState<string>("");

  // Wire LI.FI SDK to wagmi wallet
  useEffect(() => {
    if (!walletClient) return;
    createConfig({
      integrator: "yield-router-hackathon",
      providers: [
        EVM({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getWalletClient: async () => walletClient as any,
          switchChain: async (targetChainId: number) => {
            await switchChainAsync({ chainId: targetChainId });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return walletClient as any;
          },
        }),
      ],
    });
  }, [walletClient, switchChainAsync]);

  const handleDeposit = useCallback(async () => {
    if (!address || !walletClient) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    setErrorMsg(null);
    setStatus("building");
    setStepMsg("Getting best route…");

    try {
      const amountIn = Math.floor(
        amountNum * 10 ** vault.underlyingToken.decimals
      ).toString();

      const quote = await getQuote({
        fromChain:   vault.chainId,
        toChain:     vault.chainId,
        fromToken:   vault.underlyingToken.address,
        toToken:     vault.vaultAddress,
        fromAmount:  amountIn,
        fromAddress: address,
        toAddress:   address,
      });

      setStepMsg("Route found — preparing transaction…");
      const route: Route = convertQuoteToRoute(quote);

      setStatus("awaiting_signature");
      setStepMsg("Check your wallet — approval or signature needed…");

      const executedRoute = await executeRoute(route, {
        updateRouteHook(updatedRoute) {
          const step  = updatedRoute.steps[0];
          const stepSt = step?.execution?.status;
          const procs  = step?.execution?.process ?? [];
          const last   = procs[procs.length - 1] as {
            type?: string; txHash?: string; error?: unknown;
          } | undefined;

          if (last?.type === "APPROVING_TOKEN") {
            setStepMsg("Approving USDC spend… confirm in wallet.");
          } else if (last?.type === "SENDING_TRANSACTION") {
            setStepMsg("Sending deposit… confirm in wallet.");
            setStatus("pending");
          } else if (stepSt === "DONE") {
            setStatus("success");
          }

          const withHash = procs.find((p: { txHash?: string }) => p.txHash);
          if (withHash?.txHash) setTxHash(withHash.txHash);
        },
      });

      const finalStatus = executedRoute.steps[0]?.execution?.status;
      const failedProcess = executedRoute.steps[0]?.execution?.process
        ?.find((p: { status?: string; error?: { message?: string } }) =>
          p.status === "FAILED"
        );

      if (finalStatus === "DONE") {
        setStatus("success");
      } else if (finalStatus === "FAILED") {
        const reason = failedProcess?.error?.message ?? "Unknown reason";
        throw new Error(`Deposit failed: ${reason}`);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setErrorMsg(msg);
      setStatus("error");
    }
  }, [address, walletClient, vault, amount]);

  const reset = () => {
    setStatus("idle");
    setTxHash(null);
    setErrorMsg(null);
    setStepMsg("");
  };

  if (!isConnected) {
    return (
      <div className="deposit-panel deposit-panel--notice">
        Connect your wallet to deposit.
      </div>
    );
  }

  const isWrongChain = chainId !== vault.chainId;
  const explorerLink = txHash ? getExplorerUrl(vault.chainId, txHash) : null;

  return (
    <div className="deposit-panel">
      <h3 className="deposit-panel__title">Deposit into {vault.protocol}</h3>

      {isWrongChain && status === "idle" && (
        <div className="alert alert--error" style={{ marginBottom: 16 }}>
          ⚠️ Your wallet is on the wrong network. Clicking Deposit will
          automatically switch you to <strong>{vault.chain}</strong>.
        </div>
      )}

      {(status === "idle" || status === "error") && (
        <>
          <div className="deposit-panel__input-row">
            <label htmlFor="amount" className="deposit-panel__label">
              Amount (USDC)
            </label>
            <div className="deposit-panel__input-wrap">
              <span className="deposit-panel__currency">$</span>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="deposit-panel__input"
                placeholder="100"
              />
              <span className="deposit-panel__token">USDC</span>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert--error">{errorMsg}</div>
          )}

          <button
            className="btn btn-primary btn--full"
            onClick={handleDeposit}
          >
            {isWrongChain
              ? `Switch to ${vault.chain} & Deposit`
              : `Deposit ${amount || "—"} USDC`}
          </button>
        </>
      )}

      {status === "building" && (
        <StatusMsg icon="⚙️" text={stepMsg} pulse />
      )}

      {status === "awaiting_signature" && (
        <StatusMsg icon="✍️" text={stepMsg} pulse />
      )}

      {status === "pending" && (
        <>
          <StatusMsg icon="⏳" text={stepMsg || "Waiting for confirmation…"} pulse />
          {txHash && (
            <div className="tx-hash">
              Tx: <code>{txHash.slice(0, 12)}…{txHash.slice(-6)}</code>
            </div>
          )}
        </>
      )}

      {status === "success" && (
        <div className="deposit-success">
          <div className="deposit-success__icon">✅</div>
          <div className="deposit-success__text">
            Deposit successful! Your {amount} USDC is now earning{" "}
            <strong>{vault.apyFormatted} APY</strong> on {vault.protocol}.
          </div>
          <div className="deposit-success__sub">
            Your position will appear in <strong>Your Positions</strong> above within a minute.
          </div>
          {explorerLink && (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              View on {chainName(vault.chainId)} Explorer ↗
            </a>
          )}
          <button className="btn btn-ghost" onClick={reset}>
            New Deposit
          </button>
        </div>
      )}
    </div>
  );
}

function chainName(chainId: number): string {
  const names: Record<number, string> = {
    1: "Etherscan", 137: "Polygonscan", 42161: "Arbiscan",
    10: "Optimistic Etherscan", 8453: "Basescan",
  };
  return names[chainId] ?? "Explorer";
}

function StatusMsg({
  icon, text, pulse,
}: {
  icon: string; text: string; pulse?: boolean;
}) {
  return (
    <div className={`status-msg ${pulse ? "status-msg--pulse" : ""}`}>
      <span className="status-msg__icon">{icon}</span>
      <span>{text || "Processing…"}</span>
    </div>
  );
}