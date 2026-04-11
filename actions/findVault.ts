"use server";
// actions/findVault.ts
// Server action: calls LI.FI Earn API + runs selection strategy

import { fetchUSDCVaults } from "@/lib/lifi";
import { selectBestVault, type RiskLevel, type SelectionResult } from "@/lib/strategy";

export interface FindVaultResult {
  success: true;
  data: SelectionResult;
}

export interface FindVaultError {
  success: false;
  error: string;
}

export type FindVaultResponse = FindVaultResult | FindVaultError;

export async function findBestVault(
  risk: RiskLevel
): Promise<FindVaultResponse> {
  try {
    const vaults = await fetchUSDCVaults();
    const result = selectBestVault(vaults, risk);
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
