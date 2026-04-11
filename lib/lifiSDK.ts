// lib/lifiSDK.ts
// Configures LI.FI SDK v3 with wagmi wallet provider

import { createConfig } from "@lifi/sdk";

// Call once at app startup — tells the SDK who we are
export function initLiFiSDK() {
  createConfig({
    integrator: "yield-router-hackathon",
  });
}