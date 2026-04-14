import type { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import type { TokenAnalysis } from "../types";
import { getRiskLevel } from "../types";
import { fetchRugCheckReport } from "../api/rugcheck";
import { fetchTokenAnalysis, resolveSymbolToMint, fetchTokenPairs, buildTokenAnalysisFromPair } from "../api/dexscreener";

/**
 * ANALYZE_TOKEN action
 *
 * Performs deep analysis of a Solana token: price, volume, liquidity,
 * holder distribution, risk score, and price impact assessment.
 */
export const analyzeToken: Action = {
  name: "ANALYZE_TOKEN",
  description:
    "Deep analysis of a Solana token including price data, volume, liquidity depth, holder distribution, and risk assessment.",
  similes: [
    "TOKEN_ANALYSIS",
    "ANALYZE",
    "LOOK_UP_TOKEN",
    "TOKEN_INFO",
    "RESEARCH_TOKEN",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Analyze JUP for me" },
      },
      {
        name: "ClickShift Alpha",
        content: {
          text: "Pulling full analysis on JUP...",
          action: "ANALYZE_TOKEN",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "What's the data look like on WIF?" },
      },
      {
        name: "ClickShift Alpha",
        content: {
          text: "Let me run a deep analysis on WIF...",
          action: "ANALYZE_TOKEN",
        },
      },
    ],
  ],


validate: async (
  _runtime: IAgentRuntime,
  message: Memory
): Promise<boolean> => {
  const text = (message.content?.text || "").toLowerCase();
  
  const hasActionWord = /\b(analyze|analysis|look up|research|data|info|tell me|what about|buy|sell|worth|good|safe|check|price|how is|what is|should i|is it|pump|dump|rug|risky)\b/.test(text);
   // Catch $SYMBOL format
  const hasDollarSymbol = /\$[A-Za-z]{2,10}/.test(message.content?.text || "");
  // Catch mint address
  const hasMint = /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(message.content?.text || "");
   // Catch known token names mentioned directly (bonk, wif, sol, jup, etc.)
  const hasKnownToken = /\b(bonk|wif|sol|jup|ray|pyth|jto|wen|bome|popcat|mew|slerf|samo|orca|mngo|msol|usdc|usdt)\b/.test(text);
  
  return hasActionWord || hasDollarSymbol || hasMint || hasKnownToken;
},

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    _options?: Record<string, unknown>,
    callback?: Function
  ) => {
    const text = message.content?.text || "";
    const rt = runtime as any; // bypass emit type error

    // Extract token identifier
const mintMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
const symbolMatch = text.match(/\$([A-Za-z]{2,10})/i);
const knownToken = text.match(/\b(bonk|wif|sol|jup|ray|pyth|jto|wen|bome|popcat|mew|slerf|samo|orca)\b/i);
const contextWord = text.match(/\b(?:buy|sell|analyze|check|price|about|on|safe|worth)\s+([A-Za-z]{2,10})\b/i);
const tokenId = mintMatch?.[0] || symbolMatch?.[1] || contextWord?.[2] || knownToken?.[1] || "";

    if (!tokenId) {
      return {
        success: false,
        text: "I need a token symbol or mint address. Try 'analyze $JUP' or paste a Solana mint address.",
      };
    }

    try {
      rt.emit("thought_stream", {
        id: `thought_${Date.now()}`,
        agentName: "ClickShift Alpha",
        type: "reasoning",
        content: `Deep analysis initiated for ${tokenId}. Resolving token and pulling data...`,
        timestamp: new Date().toISOString(),
      });

      // Step 1: Resolve symbol to mint if needed
      let mint = tokenId;
      const isSymbol = /^[A-Za-z]{2,10}$/.test(tokenId);
      if (isSymbol) {
        rt.emit("thought_stream", {
          id: `thought_${Date.now()}`,
          agentName: "ClickShift Alpha",
          type: "read_context",
          content: `Resolving "${tokenId}" to Solana mint address...`,
          timestamp: new Date().toISOString(),
        });
        const resolved = await resolveSymbolToMint(tokenId);
        if (!resolved) {
          return {
            success: false,
            text: `Couldn't find a Solana token matching "${tokenId}". Try the exact mint address.`,
          };
        }
        mint = resolved;
      }

      // Step 2: Fetch DexScreener pair data
      rt.emit("thought_stream", {
        id: `thought_${Date.now()}`,
        agentName: "ClickShift Alpha",
        type: "read_context",
        content: `Fetching pair data from DexScreener for ${mint.slice(0, 8)}...`,
        timestamp: new Date().toISOString(),
      });
      const { bestPair, allPairs } = await fetchTokenPairs(mint);

      if (!bestPair) {
        return {
          success: false,
          text: `No trading pairs found for ${tokenId} on Solana DEXs. The token may be too new or have no liquidity.`,
        };
      }

      // Step 3: Fetch rug check score
      rt.emit("thought_stream", {
        id: `thought_${Date.now()}`,
        agentName: "ClickShift Alpha",
        type: "read_context",
        content: `Running rug check on ${bestPair.baseToken.symbol}...`,
        timestamp: new Date().toISOString(),
      });

      let rugScore = 0;
      try {
        const rugData = await fetchRugCheckReport(mint);
        rugScore = rugData.score;
      } catch {
        // RugCheck may not have this token — continue with score 0
        rt.emit("thought_stream", {
          id: `thought_${Date.now()}`,
          agentName: "ClickShift Alpha",
          type: "reasoning",
          content: `RugCheck data unavailable for this token. Proceeding with market data only.`,
          timestamp: new Date().toISOString(),
        });
      }

      // Step 4: Build analysis
      const analysis = buildTokenAnalysisFromPair(bestPair, rugScore);
      const report = formatAnalysisReport(analysis, allPairs.length);

      if (callback) {
        await callback({ text: report }, []);
      }

      rt.emit("thought_stream", {
        id: `thought_${Date.now()}`,
        agentName: "ClickShift Alpha",
        type: "action_result",
        content: `Analysis complete: ${analysis.symbol} — $${analysis.price.toFixed(6)} — ${analysis.riskLevel} risk`,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        text: report,
        data: { analysis },
      };
    } catch (error: any) {
      return {
        success: false,
        text: `Analysis failed for ${tokenId}: ${error.message}`,
      };
    }
  },
};

function formatAnalysisReport(t: TokenAnalysis, pairCount: number): string {
  const lines = [
    `Token Analysis: ${t.name} (${t.symbol})`,
    `Mint: ${t.mint}\n`,
    `Price: $${t.price < 0.001 ? t.price.toExponential(4) : t.price.toFixed(6)}`,
    `24h Change: ${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`,
    `24h Volume: $${formatNum(t.volume24h)}`,
    `Market Cap: $${formatNum(t.marketCap)}`,
    `Liquidity: $${formatNum(t.liquidity)}`,
    `Price Impact ($1K trade): ${t.priceImpact1k.toFixed(2)}%`,
    `Trading Pairs: ${pairCount} active on Solana DEXs\n`,
    `Rug Score: ${t.rugScore}/100 (${t.riskLevel})`,
  ];

  if (t.topHolders.length > 0) {
    lines.push("\nTop Holders:");
    for (const h of t.topHolders.slice(0, 5)) {
      const label = h.label ? ` (${h.label})` : "";
      lines.push(`  ${h.address.slice(0, 4)}...${h.address.slice(-4)}: ${h.percentage.toFixed(1)}%${label}`);
    }
  }

  lines.push("\nThis is data analysis, not financial advice.");
  return lines.join("\n");
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

export default analyzeToken;
