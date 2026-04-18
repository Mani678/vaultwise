"use server";
// actions/findVault.ts

import { fetchVaults, type SupportedToken } from "@/lib/lifi";
import { selectBestVault, type RiskLevel, type SelectionResult } from "@/lib/strategy";

export interface FindVaultResult  { success: true;  data: SelectionResult; }
export interface FindVaultError   { success: false; error: string; }
export type FindVaultResponse = FindVaultResult | FindVaultError;

export async function findBestVault(
  risk: RiskLevel,
  token: SupportedToken = "USDC"
): Promise<FindVaultResponse> {
  console.log("API KEY EXISTS:", !!process.env.LIFI_API_KEY);
  console.log("API KEY LENGTH:", process.env.LIFI_API_KEY?.length);
  try {
    const vaults = await fetchVaults(token);
    const result = selectBestVault(vaults, risk);
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
