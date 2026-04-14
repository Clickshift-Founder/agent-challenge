import type { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import type { RugCheckResult } from "../types";
import { getRiskLevel, RiskLevel } from "../types";
import { fetchRugCheckReport } from "../api/rugcheck";
import { searchPairs, resolveSymbolToMint } from "../api/dexscreener";

/**
 * CHECK_RUG_SCORE action
 *
 * Performs a comprehensive rug pull risk analysis on a Solana token.
 * Checks mint/freeze authority, LP status, holder concentration, and liquidity.
 *
 * Triggered when user mentions: "check", "rug", "safe", "scam", "risk" + a token name or mint address.
 */
export const checkRugScore: Action = {
  name: "CHECK_RUG_SCORE",
  description:
    "Check a Solana token for rug pull risk. Analyzes mint authority, freeze authority, LP status, holder concentration, and liquidity depth.",
  similes: [
    "RUG_CHECK",
    "CHECK_TOKEN_SAFETY",
    "IS_IT_SAFE",
    "SCAN_TOKEN",
    "AUDIT_TOKEN",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Check if BONK is safe" },
      },
      {
        name: "ClickShift Alpha",
        content: {
          text: "Running rug analysis on BONK...",
          action: "CHECK_RUG_SCORE",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Is this token a scam? DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
      },
      {
        name: "ClickShift Alpha",
        content: {
          text: "Let me pull the rug score data for that mint address...",
          action: "CHECK_RUG_SCORE",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Rug check $WIF" },
      },
      {
        name: "ClickShift Alpha",
        content: {
          text: "Checking WIF for rug pull indicators...",
          action: "CHECK_RUG_SCORE",
        },
      },
    ],
  ],

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    const hasRugKeyword = /\b(rug|check|safe|scam|risk|audit|scan|legit)\b/.test(text);
    const hasTokenRef =
      /\b[A-Za-z]{2,10}\b/.test(text) || // token symbol
      /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(text); // Solana address
    return hasRugKeyword && hasTokenRef;
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

    // Extract token identifier (mint address or symbol)
    const mintMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    const symbolMatch = text.match(/\$?([A-Za-z]{2,10})/);
    const tokenId = mintMatch?.[0] || symbolMatch?.[1] || "";

    if (!tokenId) {
      return {
        success: false,
        text: "I need a token symbol or mint address to check. Try something like 'rug check BONK' or paste a Solana mint address.",
      };
    }

    try {
      // Emit thought: starting analysis
      emitThought(runtime, "reasoning", `Starting rug analysis for ${tokenId}...`);

      // Step 1: Resolve symbol to mint address if needed
      let mint = tokenId;
      const isSymbol = /^[A-Za-z]{2,10}$/.test(tokenId);
      if (isSymbol) {
        emitThought(runtime, "read_context", `Resolving symbol "${tokenId}" to mint address via DexScreener`);
        const resolved = await resolveSymbolToMint(tokenId);
        if (!resolved) {
          return {
            success: false,
            text: `I couldn't find a Solana token matching "${tokenId}". Try pasting the exact mint address instead.`,
          };
        }
        mint = resolved;
        emitThought(runtime, "read_context", `Resolved ${tokenId} → ${mint.slice(0, 8)}...${mint.slice(-4)}`);
      }

      // Step 2: Query RugCheck API
      emitThought(runtime, "read_context", `Querying RugCheck API for ${mint.slice(0, 8)}...`);
      const rugData = await fetchRugCheckReport(mint);

      // Step 3: Enrich with DexScreener market data
      emitThought(runtime, "read_context", `Pulling market data from DexScreener`);
      const marketData = await fetchMarketDataSafe(mint);

      // Step 3: Compose analysis
      emitThought(runtime, "reasoning", `Composing risk assessment — score: ${rugData.score}/100`);

      const riskLevel = getRiskLevel(rugData.score);
      const analysis = composeRugAnalysis(rugData, marketData, riskLevel);

      // Step 4: Send response via callback
      if (callback) {
        await callback({ text: analysis }, []);
      }

      emitThought(runtime, "action_result", `Rug check complete: ${riskLevel} risk`);

      return {
        success: true,
        text: analysis,
        data: { rugData, riskLevel },
      };
    } catch (error: any) {
      emitThought(runtime, "risk_flag", `Error during rug check: ${error.message}`);
      return {
        success: false,
        text: `I couldn't complete the rug check for ${tokenId}. Error: ${error.message}. Try again with a valid mint address.`,
      };
    }
  },
};

// ── Helper functions ─────────────────────────────────────────

/**
 * Safely fetch market data from DexScreener (non-critical, won't fail the whole action).
 */
async function fetchMarketDataSafe(mint: string) {
  try {
    const { fetchTokenPairs } = await import("../api/dexscreener");
    const { bestPair } = await fetchTokenPairs(mint);
    return bestPair;
  } catch {
    return null; // Market data is enrichment, not critical
  }
}

/**
 * Compose a human-readable rug analysis from the data.
 */
function composeRugAnalysis(
  rug: RugCheckResult,
  _marketData: any,
  riskLevel: RiskLevel
): string {
  const lines: string[] = [];
  lines.push(`Rug Score: ${rug.score}/100 (${riskLevel} Risk)\n`);
  lines.push("Here's what I checked:");

  // Mint authority
  const mintStatus = rug.mintAuthority === "revoked" ? "Revoked. Good." : "⚠ ACTIVE — deployer can mint unlimited tokens.";
  lines.push(`- Mint authority: ${mintStatus}`);

  // Freeze authority
  const freezeStatus = rug.freezeAuthority === "revoked" ? "Revoked. Good." : "⚠ ACTIVE — your tokens can be frozen.";
  lines.push(`- Freeze authority: ${freezeStatus}`);

  // Top holder concentration
  const concNote =
    rug.topHolderConcentration > 50
      ? "CRITICAL concentration."
      : rug.topHolderConcentration > 30
        ? "Warning — high concentration."
        : "Within normal range.";
  lines.push(`- Top 10 holders: ${rug.topHolderConcentration.toFixed(1)}% of supply. ${concNote}`);

  // Liquidity
  const liqNote =
    rug.totalLiquidity < 5000
      ? "Dangerously thin."
      : rug.totalLiquidity < 50000
        ? "Moderate."
        : "Deep liquidity.";
  lines.push(`- Liquidity: $${formatNumber(rug.totalLiquidity)}. ${liqNote}`);

  // LP status
  lines.push(`- LP tokens: ${rug.lpStatus.burned}% burned, ${rug.lpStatus.locked}% locked, ${rug.lpStatus.unlocked}% unlocked.`);

  // Token age
  if (rug.tokenAge < 24) {
    lines.push(`- Token age: ${rug.tokenAge} hours. ⚠ Very new — insufficient history for reliable assessment.`);
  }

  // Risk factors
  if (rug.risks.length > 0) {
    lines.push("\nAdditional risk factors:");
    for (const risk of rug.risks) {
      lines.push(`- ${risk.name}: ${risk.description}`);
    }
  }

  // Overall assessment
  lines.push(`\nOverall assessment: ${riskLevel} RISK.`);
  lines.push("\nThis is data analysis, not financial advice. Your decision.");

  return lines.join("\n");
}

/**
 * Emit a thought stream entry for the transparent reasoning UI.
 */
function emitThought(
  runtime: IAgentRuntime,
  type: string,
  content: string
): void {
  // Emit via the runtime event system so the thoughtStreamProvider and SSE route can pick it up
  try {
    (runtime as any).emit("thought_stream", {
      id: `thought_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentName: "ClickShift Alpha",
      type,
      content,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Silently fail — thought stream is non-critical
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

export default checkRugScore;

