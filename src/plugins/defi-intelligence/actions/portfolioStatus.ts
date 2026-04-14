import type { Action, IAgentRuntime, Memory } from "@elizaos/core";
import type { PortfolioSummary } from "../types";

/**
 * PORTFOLIO_STATUS action
 *
 * Shows the user's tracked portfolio with current values,
 * risk scores, and any active alerts.
 */
export const portfolioStatus: Action = {
  name: "PORTFOLIO_STATUS",
  description:
    "Display the user's tracked portfolio positions with current values, risk scores, price changes, and active risk alerts.",
  similes: ["MY_PORTFOLIO", "PORTFOLIO_CHECK", "HOW_AM_I_DOING", "SHOW_POSITIONS"],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How's my portfolio looking?" },
      },
      {
        name: "ClickShift Alpha",
        content: {
          text: "Pulling your tracked positions...",
          action: "PORTFOLIO_STATUS",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Show me my positions" },
      },
      {
        name: "ClickShift Alpha",
        content: {
          text: "Loading portfolio summary...",
          action: "PORTFOLIO_STATUS",
        },
      },
    ],
  ],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = (message.content?.text || "").toLowerCase();
    return /\b(portfolio|positions|holdings|how.*(doing|looking)|my tokens|my bags)\b/.test(text);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: any,
    _options?: Record<string, unknown>,
    callback?: Function
  ) => {
    try {
      (runtime as any).emit("thought_stream", {
        id: `thought_${Date.now()}`,
        agentName: "ClickShift Alpha",
        type: "read_context",
        content: "Loading tracked positions and refreshing price data...",
        timestamp: new Date().toISOString(),
      });

      // TODO: Implement actual portfolio tracking
      // 1. Retrieve tracked positions from agent memory
      // 2. Refresh price data via DexScreener
      // 3. Re-check rug scores for all positions
      // 4. Generate risk alerts for any changes

      const summary = await buildPortfolioSummary(runtime, message);
      const formatted = formatPortfolioSummary(summary);

      if (callback) {
        await callback({ text: formatted }, []);
      }

      return { success: true, text: formatted, data: { summary } };
    } catch (error: any) {
      return {
        success: false,
        text: `Portfolio check failed: ${error.message}`,
      };
    }
  },
};

async function buildPortfolioSummary(
  _runtime: IAgentRuntime,
  _message: Memory
): Promise<PortfolioSummary> {
  // TODO: Replace with actual portfolio data from memory + live price refresh
  return {
    totalValueUsd: 0,
    positions: [],
    riskAlerts: [],
    lastUpdated: new Date().toISOString(),
  };
}

function formatPortfolioSummary(summary: PortfolioSummary): string {
  if (summary.positions.length === 0) {
    return [
      "No tracked positions yet.",
      "",
      "You can add positions by:",
      '- Asking me to analyze a token ("analyze $JUP")',
      '- Telling me what you hold ("I have 500 JUP")',
      '- Asking me to track a wallet with your holdings',
    ].join("\n");
  }

  const lines = ["Portfolio Summary:\n"];

  for (const pos of summary.positions) {
    const change = pos.priceChange24h >= 0
      ? `+${pos.priceChange24h.toFixed(1)}%`
      : `${pos.priceChange24h.toFixed(1)}%`;
    lines.push(
      `- ${pos.symbol}: ${pos.balance.toLocaleString()} tokens ($${pos.valueUsd.toFixed(2)}) — ${change} today — Risk: ${pos.riskLevel}`
    );
  }

  lines.push(`\nTotal tracked value: ~$${summary.totalValueUsd.toFixed(2)}`);

  if (summary.riskAlerts.length > 0) {
    lines.push("\nActive alerts:");
    for (const alert of summary.riskAlerts) {
      lines.push(`⚠ ${alert.symbol}: ${alert.message}`);
    }
  } else {
    lines.push("\nNo active risk alerts. All positions stable.");
  }

  return lines.join("\n");
}

export default portfolioStatus;

