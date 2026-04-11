"use client";
// lib/wagmi.ts

import { createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, optimism, base } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base],
  connectors: [
    injected(),                                    // Rainbow, MetaMask, any browser wallet
    coinbaseWallet({ appName: "Yield Router" }),
  ],
  transports: {
    [mainnet.id]:  http(),
    [polygon.id]:  http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]:     http(),
  },
  ssr: true,
});