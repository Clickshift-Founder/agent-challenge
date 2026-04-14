/**
 * RugCheck.xyz API Client
 *
 * Endpoints:
 *   GET https://api.rugcheck.xyz/v1/tokens/{mint}/report         — Full detailed report
 *   GET https://api.rugcheck.xyz/v1/tokens/{mint}/report/summary  — Summary report
 *   GET https://api.rugcheck.xyz/v1/stats/new_tokens              — Recently detected tokens
 *   GET https://api.rugcheck.xyz/v1/stats/trending                — Trending tokens (24h)
 *
 * No API key required for basic usage. Rate limits apply.
 */

import type { RugCheckResult, RugRiskFactor, AuthorityStatus, LpStatus } from "../types";
import { getRiskLevel, RiskLevel } from "../types";

const BASE_URL = "https://api.rugcheck.xyz/v1";
const TIMEOUT = 10_000;

// ── Raw API response types ──────────────────────────────────

interface RugCheckApiReport {
  mint: string;
  tokenMeta?: {
    name: string;
    symbol: string;
    uri: string;
  };
  token?: {
    mintAuthority: string | null;
    freezeAuthority: string | null;
    supply: number;
    decimals: number;
  };
  topHolders?: Array<{
    address: string;
    pct: number;
    owner: string;
    uiAmount: number;
    isInsider: boolean;
  }>;
  markets?: Array<{
    pubkey: string;
    marketType: string;
    lp?: {
      lpLockedPct: number;
      lpBurnedPct: number;
      lpUnlockedPct: number;
      lpLockedUSD: number;
      lpTotalSupply: number;
    };
    liquidityA?: number;
    liquidityB?: number;
    liquidityAUsd?: number;
    liquidityBUsd?: number;
  }>;
  risks?: Array<{
    name: string;
    value: string;
    description: string;
    score: number;
    level: string;
  }>;
  score?: number;
  fileMeta?: {
    description: string;
    image: string;
  };
  creatorAddress?: string;
  createdAt?: string;
}

// ── Public API functions ────────────────────────────────────

/**
 * Fetch a full rug check report for a Solana token.
 */
export async function fetchRugCheckReport(mint: string): Promise<RugCheckResult> {
  const url = `${BASE_URL}/tokens/${mint}/report`;

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Token ${mint} not found on RugCheck. It may be too new or not indexed.`);
    }
    throw new Error(`RugCheck API error: ${response.status} ${response.statusText}`);
  }

  const data: RugCheckApiReport = await response.json();
  return mapRugCheckResponse(data);
}

/**
 * Fetch a summary rug check report (lighter payload).
 */
export async function fetchRugCheckSummary(mint: string): Promise<RugCheckResult> {
  const url = `${BASE_URL}/tokens/${mint}/report/summary`;

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    // Fallback to full report if summary isn't available
    if (response.status === 404) {
      return fetchRugCheckReport(mint);
    }
    throw new Error(`RugCheck API error: ${response.status}`);
  }

  const data: RugCheckApiReport = await response.json();
  return mapRugCheckResponse(data);
}

/**
 * Fetch trending tokens from RugCheck (last 24h).
 */
export async function fetchTrendingTokens(): Promise<Array<{ mint: string; name: string; symbol: string }>> {
  const url = `${BASE_URL}/stats/trending`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data)
      ? data.map((t: any) => ({
          mint: t.mint || t.address || "",
          name: t.tokenMeta?.name || t.name || "Unknown",
          symbol: t.tokenMeta?.symbol || t.symbol || "???",
        }))
      : [];
  } catch {
    return [];
  }
}

// ── Response mapping ────────────────────────────────────────

function mapRugCheckResponse(data: RugCheckApiReport): RugCheckResult {
  // Calculate top holder concentration
  const topHolders = data.topHolders || [];
  const topHolderConcentration = topHolders
    .slice(0, 10)
    .reduce((sum, h) => sum + (h.pct || 0), 0);

  // Map authority status
  const mintAuthority: AuthorityStatus = data.token?.mintAuthority
    ? data.token.mintAuthority === "null" || data.token.mintAuthority === ""
      ? "revoked"
      : "active"
    : "unknown";

  const freezeAuthority: AuthorityStatus = data.token?.freezeAuthority
    ? data.token.freezeAuthority === "null" || data.token.freezeAuthority === ""
      ? "revoked"
      : "active"
    : "unknown";

  // Aggregate LP status across all markets
  const lpStatus = aggregateLpStatus(data.markets || []);

  // Total liquidity across all markets
  const totalLiquidity = (data.markets || []).reduce(
    (sum, m) => sum + (m.liquidityAUsd || 0) + (m.liquidityBUsd || 0),
    0
  );

  // Map risk factors
  const risks: RugRiskFactor[] = (data.risks || []).map((r) => ({
    name: r.name,
    description: r.description,
    severity: mapRiskLevel(r.level),
    value: r.value,
  }));

  // Score — RugCheck returns 0-100 where higher is riskier
  const score = data.score ?? calculateFallbackScore(mintAuthority, freezeAuthority, topHolderConcentration, totalLiquidity);

  // Token age in hours
  const tokenAge = data.createdAt
    ? Math.floor((Date.now() - new Date(data.createdAt).getTime()) / 3_600_000)
    : -1;

  return {
    mint: data.mint,
    tokenName: data.tokenMeta?.name || data.mint.substring(0, 8),
    tokenSymbol: data.tokenMeta?.symbol || "???",
    score,
    riskLevel: getRiskLevel(score),
    risks,
    mintAuthority,
    freezeAuthority,
    lpStatus,
    topHolderConcentration,
    totalLiquidity,
    tokenAge: tokenAge >= 0 ? tokenAge : 0,
  };
}

function aggregateLpStatus(markets: RugCheckApiReport["markets"]): LpStatus {
  if (!markets || markets.length === 0) {
    return { burned: 0, locked: 0, unlocked: 100 };
  }

  // Use the primary market (first one with LP data)
  const primaryMarket = markets.find((m) => m.lp);
  if (!primaryMarket?.lp) {
    return { burned: 0, locked: 0, unlocked: 100 };
  }

  return {
    burned: Math.round(primaryMarket.lp.lpBurnedPct || 0),
    locked: Math.round(primaryMarket.lp.lpLockedPct || 0),
    unlocked: Math.round(primaryMarket.lp.lpUnlockedPct || 0),
  };
}

function mapRiskLevel(level: string): RiskLevel {
  switch (level?.toLowerCase()) {
    case "critical":
    case "danger":
      return RiskLevel.CRITICAL;
    case "high":
    case "warn":
      return RiskLevel.HIGH;
    case "medium":
    case "caution":
      return RiskLevel.MEDIUM;
    default:
      return RiskLevel.LOW;
  }
}

/**
 * Fallback score calculation when RugCheck doesn't return one.
 */
function calculateFallbackScore(
  mintAuth: AuthorityStatus,
  freezeAuth: AuthorityStatus,
  holderConcentration: number,
  liquidity: number
): number {
  let score = 0;

  // Mint authority active = +30 points
  if (mintAuth === "active") score += 30;
  if (mintAuth === "unknown") score += 15;

  // Freeze authority active = +20 points
  if (freezeAuth === "active") score += 20;
  if (freezeAuth === "unknown") score += 10;

  // Holder concentration
  if (holderConcentration > 50) score += 25;
  else if (holderConcentration > 30) score += 15;
  else if (holderConcentration > 20) score += 5;

  // Low liquidity
  if (liquidity < 1000) score += 20;
  else if (liquidity < 5000) score += 10;
  else if (liquidity < 10000) score += 5;

  return Math.min(score, 100);
}

// ── Utilities ───────────────────────────────────────────────

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "ClickShift-Alpha/1.0",
      },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
