import type { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

/**
 * marketDataProvider
 *
 * Injects current market data (SOL price, trending tokens) into agent context.
 * Cached for 60 seconds to avoid excessive API calls.
 */

let cachedData: { text: string; data: any; fetchedAt: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

export const marketDataProvider: Provider = {
  name: "MARKET_DATA",
  description: "Provides current SOL price and trending Solana tokens as context.",
  dynamic: true,
  position: 10, // Load after core providers

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ) => {
    // Return cache if fresh
    if (cachedData && Date.now() - cachedData.fetchedAt < CACHE_TTL) {
      return { text: cachedData.text, data: cachedData.data };
    }

    try {
      // Fetch SOL price from DexScreener
      const { fetchTokenPairs, fetchTopBoostedTokens } = await import("../api/dexscreener");

      // SOL/USDC price
      const solMint = "So11111111111111111111111111111111111111112";
      const { bestPair } = await fetchTokenPairs(solMint);
      const solPrice = bestPair ? parseFloat(bestPair.priceUsd || "0") : 0;

      // Top boosted (trending) tokens
      const trending = await fetchTopBoostedTokens();

      const now = new Date().toISOString();
      const text = `Market context: SOL is trading at $${solPrice.toFixed(2)}. ${trending.length} tokens trending on DexScreener.`;

      cachedData = {
        text,
        data: { solPrice, trending, lastUpdated: now },
        fetchedAt: Date.now(),
      };

      return { text, data: cachedData.data };
    } catch {
      return {
        text: "Market data temporarily unavailable.",
        data: { solPrice: 0, trending: [] },
      };
    }
  },
};

export default marketDataProvider;
