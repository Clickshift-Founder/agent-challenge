/**
 * DexScreener API Client
 *
 * Endpoints:
 *   GET https://api.dexscreener.com/latest/dex/tokens/{address}       — Get pairs for token(s)
 *   GET https://api.dexscreener.com/latest/dex/search?q={query}       — Search pairs
 *   GET https://api.dexscreener.com/latest/dex/pairs/{chain}/{pair}   — Get specific pair
 *   GET https://api.dexscreener.com/token-boosts/top/v1               — Top boosted tokens
 *
 * No API key required. Rate limit: ~300 requests/minute.
 */

import type { TokenAnalysis, HolderInfo, TrendingToken } from "../types";
import { getRiskLevel } from "../types";

const BASE_URL = "https://api.dexscreener.com";
const TIMEOUT = 10_000;

// ── Raw API response types ──────────────────────────────────

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ label: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
  boosts?: {
    active?: number;
  };
}

interface DexScreenerPairsResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

interface DexScreenerSearchResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

// ── Public API functions ────────────────────────────────────

/**
 * Fetch all trading pairs for a token address.
 * Returns the best pair (highest liquidity) as primary, plus all pairs data.
 */
export async function fetchTokenPairs(tokenAddress: string): Promise<{
  bestPair: DexScreenerPair | null;
  allPairs: DexScreenerPair[];
}> {
  const url = `${BASE_URL}/latest/dex/tokens/${tokenAddress}`;
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`DexScreener API error: ${response.status}`);
  }

  const data: DexScreenerPairsResponse = await response.json();
  const pairs = data.pairs || [];

  // Sort by liquidity — highest first
  const sorted = pairs
    .filter((p) => p.chainId === "solana")
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

  return {
    bestPair: sorted[0] || null,
    allPairs: sorted,
  };
}

/**
 * Search for pairs by token name or symbol.
 * Useful when user provides a symbol like "BONK" instead of a mint address.
 */
export async function searchPairs(query: string): Promise<DexScreenerPair[]> {
  const url = `${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`;
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`DexScreener search error: ${response.status}`);
  }

  const data: DexScreenerSearchResponse = await response.json();
  // Filter to Solana pairs and sort by liquidity
  return (data.pairs || [])
    .filter((p) => p.chainId === "solana")
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
}

/**
 * Get top boosted tokens (trending on DexScreener).
 */
export async function fetchTopBoostedTokens(): Promise<TrendingToken[]> {
  const url = `${BASE_URL}/token-boosts/top/v1`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return [];
    const data = await response.json();

    return (Array.isArray(data) ? data : [])
      .filter((t: any) => t.chainId === "solana")
      .slice(0, 20)
      .map((t: any) => ({
        mint: t.tokenAddress || "",
        symbol: t.tokenAddress?.substring(0, 6) || "???",
        name: t.description || "Unknown",
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        liquidity: 0,
      }));
  } catch {
    return [];
  }
}

/**
 * Resolve a token symbol to a mint address by searching DexScreener.
 * Returns the mint address of the highest-liquidity Solana pair.
 */
export async function resolveSymbolToMint(symbol: string): Promise<string | null> {
  const pairs = await searchPairs(symbol);
  if (pairs.length === 0) return null;

  // Return the base token address of the best pair
  return pairs[0].baseToken.address;
}

/**
 * Build a full TokenAnalysis from DexScreener data.
 * Combines pair data with optional rug check score.
 */
export function buildTokenAnalysisFromPair(
  pair: DexScreenerPair,
  rugScore: number = 0,
  holders: HolderInfo[] = []
): TokenAnalysis {
  const price = parseFloat(pair.priceUsd || "0");
  const volume24h = pair.volume?.h24 || 0;
  const liquidity = pair.liquidity?.usd || 0;
  const marketCap = pair.marketCap || pair.fdv || 0;
  const priceChange24h = pair.priceChange?.h24 || 0;

  // Estimate price impact for a $1000 trade
  const priceImpact1k = liquidity > 0 ? (1000 / liquidity) * 100 : 100;

  // Calculate created time
  const createdAt = pair.pairCreatedAt
    ? new Date(pair.pairCreatedAt).toISOString()
    : new Date().toISOString();

  return {
    mint: pair.baseToken.address,
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    price,
    priceChange24h,
    volume24h,
    marketCap,
    liquidity,
    holderCount: holders.length,
    topHolders: holders,
    rugScore,
    riskLevel: getRiskLevel(rugScore),
    priceImpact1k: Math.min(priceImpact1k, 100),
    createdAt,
  };
}

/**
 * Fetch and build a complete token analysis.
 * Resolves symbol → mint if needed, then fetches pair data.
 */
export async function fetchTokenAnalysis(
  tokenIdOrSymbol: string,
  rugScore: number = 0
): Promise<TokenAnalysis | null> {
  let mint = tokenIdOrSymbol;

  // If it looks like a symbol (short, no numbers), resolve it
  const isSymbol = /^[A-Za-z]{2,10}$/.test(tokenIdOrSymbol);
  if (isSymbol) {
    const resolved = await resolveSymbolToMint(tokenIdOrSymbol);
    if (!resolved) return null;
    mint = resolved;
  }

  const { bestPair } = await fetchTokenPairs(mint);
  if (!bestPair) return null;

  return buildTokenAnalysisFromPair(bestPair, rugScore);
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
